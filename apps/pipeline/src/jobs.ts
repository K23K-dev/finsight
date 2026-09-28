import type { SQSRecord } from "aws-lambda";
import { z } from "zod";

const userJobSchema = z.object({ userId: z.string().min(1) });

/** Every pipeline message targets a single user. */
export function parseUserJob(record: SQSRecord) {
  return userJobSchema.parse(JSON.parse(record.body));
}

/** One JSON line per event, so CloudWatch Logs Insights can filter on fields. */
export function logEvent(event: string, fields: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...fields }));
}
