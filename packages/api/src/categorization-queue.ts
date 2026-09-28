import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

let sqs: SQSClient | undefined;

/**
 * Queues a categorization job for the user. Failures are logged rather than
 * thrown: the sync that called this has already committed, and the next sync
 * queues another job.
 */
export async function enqueueCategorization(userId: string) {
  const queueUrl = process.env.CATEGORIZE_QUEUE_URL;
  if (!queueUrl) {
    console.warn("CATEGORIZE_QUEUE_URL is not set; skipping categorization.");
    return;
  }

  try {
    // Queue URLs look like https://sqs.<region>.amazonaws.com/<account>/<name>.
    // Reading the region from the URL keeps this working on Vercel, where
    // AWS_REGION is the function's own region.
    sqs ??= new SQSClient({ region: new URL(queueUrl).hostname.split(".")[1] });
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ userId }),
        MessageGroupId: userId,
        // Requests for the same user within SQS's five-minute dedup window
        // collapse into one job.
        MessageDeduplicationId: userId,
      }),
    );
  } catch (error) {
    console.error("Failed to queue transaction categorization.", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
