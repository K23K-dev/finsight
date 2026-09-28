import type { Context, SQSEvent } from "aws-lambda";

import { categorizeNextBatch } from "@finsight/api/pipeline";
import { db } from "@finsight/db/client";

import { logEvent, parseUserJob } from "../jobs";

// Caps one job's Bedrock spend. Leftovers are picked up by the next sync's job.
const MAX_BATCHES = 25;
const MIN_REMAINING_MS = 60_000;

/** Categorizes one user's pending expenses per message (batch size 1). */
export async function handler(event: SQSEvent, context: Context) {
  for (const record of event.Records) {
    const { userId } = parseUserJob(record);
    const totals = { batches: 0, examined: 0, categorized: 0, abstained: 0 };

    try {
      while (
        totals.batches < MAX_BATCHES &&
        context.getRemainingTimeInMillis() > MIN_REMAINING_MS
      ) {
        const result = await categorizeNextBatch(db, userId);
        if (result.examined === 0) break;

        totals.batches += 1;
        totals.examined += result.examined;
        totals.categorized += result.categorized;
        totals.abstained += result.abstained;
      }
    } catch (error) {
      // Finished batches are already saved, so a retry resumes where this stopped.
      logEvent("categorize.failed", {
        userId,
        ...totals,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    logEvent("categorize.completed", { userId, ...totals });
  }
}
