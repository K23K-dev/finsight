import type { SQSEvent } from "aws-lambda";
import { TRPCError } from "@trpc/server";

import {
  enqueueCategorization,
  syncSimpleFinUser,
} from "@finsight/api/pipeline";
import { db } from "@finsight/db/client";

import { logEvent, parseUserJob } from "../jobs";

// Retrying can't fix these: the user has no connection or needs to relink.
const PERMANENT_ERRORS = new Set([
  "NOT_FOUND",
  "PRECONDITION_FAILED",
  "FORBIDDEN",
]);

/** Syncs one user per message (the event source uses a batch size of 1). */
export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const { userId } = parseUserJob(record);

    try {
      const result = await syncSimpleFinUser(db, userId);
      logEvent("sync.completed", {
        userId,
        accounts: result.accountsSynced,
        transactions: result.transactionsSynced,
        providerErrors: result.providerErrors.length,
      });
      await enqueueCategorization(userId);
    } catch (error) {
      const code = error instanceof TRPCError ? error.code : "UNKNOWN";
      if (PERMANENT_ERRORS.has(code)) {
        logEvent("sync.skipped", { userId, code });
        continue;
      }

      // Rethrowing returns the message to SQS, which retries it, then dead-letters it.
      logEvent("sync.failed", { userId, code });
      throw error;
    }
  }
}
