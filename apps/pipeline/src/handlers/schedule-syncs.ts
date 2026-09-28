import { SendMessageBatchCommand, SQSClient } from "@aws-sdk/client-sqs";

import { db } from "@finsight/db/client";
import { Connection } from "@finsight/db/schema";

import { logEvent } from "../jobs";

const SQS_MAX_BATCH = 10;
const sqs = new SQSClient({});

/** Fans the daily schedule out into one sync job per connected user. */
export async function handler() {
  const queueUrl = process.env.SYNC_QUEUE_URL;
  if (!queueUrl) throw new Error("SYNC_QUEUE_URL is not set.");

  // The dedup ID drops repeats if the schedule retries on the same day.
  const runDate = new Date().toISOString().slice(0, 10);
  const connections = await db
    .select({ userId: Connection.userId })
    .from(Connection);

  for (let index = 0; index < connections.length; index += SQS_MAX_BATCH) {
    const { Failed } = await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: connections
          .slice(index, index + SQS_MAX_BATCH)
          .map(({ userId }, position) => ({
            Id: String(position),
            MessageBody: JSON.stringify({ userId }),
            MessageGroupId: userId,
            MessageDeduplicationId: `${userId}:${runDate}`,
          })),
      }),
    );

    if (Failed?.length) {
      throw new Error(`Failed to queue ${Failed.length} sync jobs.`);
    }
  }

  logEvent("syncs.scheduled", { users: connections.length });
}
