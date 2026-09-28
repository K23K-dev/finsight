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
}

/** Scheduled SimpleFIN sync and Bedrock categorization pipeline. */
export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // FIFO message groups keep one sync per user in flight; a message that
    // fails three times moves to the DLQ. AWS recommends a visibility timeout
    // of six times the consumer's timeout.
    const syncQueue = new Queue(this, "SyncQueue", {
      fifo: true,
      visibilityTimeout: Duration.minutes(12),
      deadLetterQueue: {
        queue: new Queue(this, "SyncDlq", {
          fifo: true,
          retentionPeriod: Duration.days(14),
        }),
        maxReceiveCount: 3,
      },
    });

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
      timeout: Duration.minutes(2),
    });
    syncUser.addEventSource(new SqsEventSource(syncQueue, { batchSize: 1 }));

    new Schedule(this, "DailySync", {
      schedule: ScheduleExpression.cron({ minute: "0", hour: "11" }),
      target: new LambdaInvoke(scheduleSyncs, { retryAttempts: 2 }),
      enabled: props.scheduleEnabled,
    });

    new CfnOutput(this, "SyncQueueUrl", { value: syncQueue.queueUrl });
    new CfnOutput(this, "ScheduleSyncsFunctionName", {
      value: scheduleSyncs.functionName,
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
