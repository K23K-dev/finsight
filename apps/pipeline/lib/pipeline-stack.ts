import { fileURLToPath } from "node:url";
import type { StackProps } from "aws-cdk-lib";
import type { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import type { ITopic } from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";
import {
  Annotations,
  CfnOutput,
  Duration,
  RemovalPolicy,
  SecretValue,
  Stack,
} from "aws-cdk-lib";
import {
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import {
  OidcProviderNative,
  PolicyStatement,
  Role,
  WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Schedule, ScheduleExpression } from "aws-cdk-lib/aws-scheduler";
import { LambdaInvoke } from "aws-cdk-lib/aws-scheduler-targets";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Queue } from "aws-cdk-lib/aws-sqs";

const repoPath = (relativePath: string) =>
  fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url));

export interface VercelProject {
  /** From the dashboard URL: vercel.com/<teamSlug>/<projectName>. */
  readonly teamSlug: string;
  readonly projectName: string;
  /** Set when the account already has an IAM OIDC provider for this team. */
  readonly oidcProviderArn?: string;
}

export interface PipelineStackProps extends StackProps {
  /** Whether the daily schedule fires. The Lambdas can be invoked by hand either way. */
  readonly scheduleEnabled: boolean;
  /** A Bedrock cross-region inference profile ID, such as `us.anthropic...`. */
  readonly bedrockModelId: string;
  /** Lets this Vercel project queue categorization jobs. Skipped when unset. */
  readonly vercel?: VercelProject;
}

/** Scheduled SimpleFIN sync and Bedrock categorization pipeline. */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Dead-letter alarms notify this topic. Subscribe your email once after
    // deploying, so the address stays out of this public repo:
    //   aws sns subscribe --topic-arn <AlertsTopicArn> --protocol email \
    //     --notification-endpoint <you@example.com>
    const alerts = new Topic(this, "Alerts");

    const syncTimeout = Duration.minutes(2);
    const categorizeTimeout = Duration.minutes(10);
    const syncQueue = this.createJobQueue("Sync", syncTimeout, alerts);
    const categorizeQueue = this.createJobQueue(
      "Categorize",
      categorizeTimeout,
      alerts,
    );

    const scheduleSyncs = this.createHandler(
      "ScheduleSyncs",
      "schedule-syncs",
      {
        timeout: Duration.minutes(1),
        environment: { SYNC_QUEUE_URL: syncQueue.queueUrl },
      },
    );
    syncQueue.grantSendMessages(scheduleSyncs);

    const syncUser = this.createHandler("SyncUser", "sync-user", {
      timeout: syncTimeout,
      environment: { CATEGORIZE_QUEUE_URL: categorizeQueue.queueUrl },
    });
    syncUser.addEventSource(new SqsEventSource(syncQueue, { batchSize: 1 }));
    categorizeQueue.grantSendMessages(syncUser);

    const categorizeUser = this.createHandler(
      "CategorizeUser",
      "categorize-user",
      {
        timeout: categorizeTimeout,
        environment: { BEDROCK_MODEL_ID: props.bedrockModelId },
      },
    );
    categorizeUser.addEventSource(
      new SqsEventSource(categorizeQueue, { batchSize: 1 }),
    );
    // Bedrock checks permission on the inference profile and on the model it
    // routes to, which can run in any of the profile's regions.
    const foundationModelId = props.bedrockModelId.slice(
      props.bedrockModelId.indexOf(".") + 1,
    );
    categorizeUser.addToRolePolicy(
      new PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: [
          this.formatArn({
            service: "bedrock",
            resource: "inference-profile",
            resourceName: props.bedrockModelId,
          }),
          `arn:${this.partition}:bedrock:*::foundation-model/${foundationModelId}`,
        ],
      }),
    );

    if (props.vercel) {
      const vercelRole = this.createVercelRole(props.vercel);
      categorizeQueue.grantSendMessages(vercelRole);
      new CfnOutput(this, "VercelRoleArn", { value: vercelRole.roleArn });
    } else {
      Annotations.of(this).addWarningV2(
        "finsight:vercelRole",
        "Set vercelTeamSlug and vercelProjectName in cdk.json so the website can queue categorization jobs.",
      );
    }

    new Schedule(this, "DailySync", {
      schedule: ScheduleExpression.cron({ minute: "0", hour: "11" }),
      target: new LambdaInvoke(scheduleSyncs, { retryAttempts: 2 }),
      enabled: props.scheduleEnabled,
    });

    new CfnOutput(this, "SyncQueueUrl", { value: syncQueue.queueUrl });
    new CfnOutput(this, "CategorizeQueueUrl", {
      value: categorizeQueue.queueUrl,
    });
    new CfnOutput(this, "ScheduleSyncsFunctionName", {
      value: scheduleSyncs.functionName,
    });
    new CfnOutput(this, "AlertsTopicArn", { value: alerts.topicArn });
  }

  /**
   * A FIFO queue of per-user jobs. Grouping messages by user keeps one job per
   * user in flight. A message that fails three times moves to a dead-letter
   * queue, which triggers an alert.
   */
  private createJobQueue(
    name: string,
    consumerTimeout: Duration,
    alerts: ITopic,
  ) {
    const deadLetterQueue = new Queue(this, `${name}Dlq`, {
      fifo: true,
      retentionPeriod: Duration.days(14),
    });
    deadLetterQueue
      .metricApproximateNumberOfMessagesVisible()
      .createAlarm(this, `${name}DlqAlarm`, {
        alarmDescription: `A ${name.toLowerCase()} job failed three times and is waiting in its dead-letter queue.`,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        // Idle queues stop reporting metrics, which means nothing is waiting.
        treatMissingData: TreatMissingData.NOT_BREACHING,
      })
      .addAlarmAction(new SnsAction(alerts));

    return new Queue(this, `${name}Queue`, {
      fifo: true,
      // AWS recommends six times the consumer's timeout.
      visibilityTimeout: Duration.seconds(consumerTimeout.toSeconds() * 6),
      deadLetterQueue: { queue: deadLetterQueue, maxReceiveCount: 3 },
    });
  }

  /**
   * A role the Vercel deployment assumes with its OIDC token, so the website
   * reaches AWS without long-lived access keys.
   */
  private createVercelRole({
    teamSlug,
    projectName,
    oidcProviderArn,
  }: VercelProject) {
    const issuer = `oidc.vercel.com/${teamSlug}`;
    const audience = `https://vercel.com/${teamSlug}`;
    // An account allows one provider per issuer, so reuse an existing one.
    const provider = oidcProviderArn
      ? OidcProviderNative.fromOidcProviderArn(
          this,
          "VercelOidc",
          oidcProviderArn,
        )
      : new OidcProviderNative(this, "VercelOidc", {
          url: `https://${issuer}`,
          clientIds: [audience],
        });

    return new Role(this, "VercelRole", {
      assumedBy: new WebIdentityPrincipal(provider.oidcProviderArn, {
        StringEquals: { [`${issuer}:aud`]: audience },
        StringLike: {
          [`${issuer}:sub`]: `owner:${teamSlug}:project:${projectName}:environment:*`,
        },
      }),
    });
  }

  private createHandler(
    id: string,
    file: string,
    props: Pick<NodejsFunctionProps, "timeout" | "environment">,
  ) {
    return new NodejsFunction(this, id, {
      entry: fileURLToPath(
        new URL(`../src/handlers/${file}.ts`, import.meta.url),
      ),
      projectRoot: repoPath(""),
      depsLockFilePath: repoPath("pnpm-lock.yaml"),
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 512,
      timeout: props.timeout,
      bundling: {
        minify: true,
        sourceMap: true,
        // Ship the SDK version the code was tested with, not the runtime's copy.
        bundleAwsSDK: true,
      },
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        // CloudFormation resolves this at deploy time; the template only
        // stores a reference to the secret.
        POSTGRES_URL: SecretValue.secretsManager(
          "finsight/postgres-url",
        ).unsafeUnwrap(),
        ...props.environment,
      },
      logGroup: new LogGroup(this, `${id}Logs`, {
        retention: RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });
  }
}
