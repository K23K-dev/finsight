import { fileURLToPath } from "node:url";
import type { StackProps } from "aws-cdk-lib";
import type { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  SecretValue,
  Stack,
} from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Schedule, ScheduleExpression } from "aws-cdk-lib/aws-scheduler";
import { LambdaInvoke } from "aws-cdk-lib/aws-scheduler-targets";
import { Queue } from "aws-cdk-lib/aws-sqs";

const repoPath = (relativePath: string) =>
  fileURLToPath(new URL(`../../../${relativePath}`, import.meta.url));

export interface PipelineStackProps extends StackProps {
  /** Whether the daily schedule fires. The Lambdas can be invoked by hand either way. */
  readonly scheduleEnabled: boolean;
  /** A Bedrock cross-region inference profile ID, such as `us.anthropic...`. */
  readonly bedrockModelId: string;
}

/** Scheduled SimpleFIN sync and Bedrock categorization pipeline. */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const syncTimeout = Duration.minutes(2);
    const categorizeTimeout = Duration.minutes(10);
    const sync = this.createJobQueue("Sync", syncTimeout);
    const categorize = this.createJobQueue("Categorize", categorizeTimeout);

    const scheduleSyncs = this.createHandler(
      "ScheduleSyncs",
      "schedule-syncs",
      {
        timeout: Duration.minutes(1),
        environment: { SYNC_QUEUE_URL: sync.queue.queueUrl },
      },
    );
    sync.queue.grantSendMessages(scheduleSyncs);

    const syncUser = this.createHandler("SyncUser", "sync-user", {
      timeout: syncTimeout,
      environment: { CATEGORIZE_QUEUE_URL: categorize.queue.queueUrl },
    });
    syncUser.addEventSource(new SqsEventSource(sync.queue, { batchSize: 1 }));
    categorize.queue.grantSendMessages(syncUser);

    const categorizeUser = this.createHandler(
      "CategorizeUser",
      "categorize-user",
      {
        timeout: categorizeTimeout,
        environment: { BEDROCK_MODEL_ID: props.bedrockModelId },
      },
    );
    categorizeUser.addEventSource(
      new SqsEventSource(categorize.queue, { batchSize: 1 }),
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

    new Schedule(this, "DailySync", {
      schedule: ScheduleExpression.cron({ minute: "0", hour: "11" }),
      target: new LambdaInvoke(scheduleSyncs, { retryAttempts: 2 }),
      enabled: props.scheduleEnabled,
    });

    new CfnOutput(this, "SyncQueueUrl", { value: sync.queue.queueUrl });
    new CfnOutput(this, "CategorizeQueueUrl", {
      value: categorize.queue.queueUrl,
    });
    new CfnOutput(this, "ScheduleSyncsFunctionName", {
      value: scheduleSyncs.functionName,
    });
  }

  /**
   * A FIFO queue of per-user jobs. Grouping messages by user keeps one job per
   * user in flight, and a message that fails three times moves to the DLQ.
   */
  private createJobQueue(name: string, consumerTimeout: Duration) {
    const deadLetterQueue = new Queue(this, `${name}Dlq`, {
      fifo: true,
      retentionPeriod: Duration.days(14),
    });
    const queue = new Queue(this, `${name}Queue`, {
      fifo: true,
      // AWS recommends six times the consumer's timeout.
      visibilityTimeout: Duration.seconds(consumerTimeout.toSeconds() * 6),
      deadLetterQueue: { queue: deadLetterQueue, maxReceiveCount: 3 },
    });
    return { queue, deadLetterQueue };
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
