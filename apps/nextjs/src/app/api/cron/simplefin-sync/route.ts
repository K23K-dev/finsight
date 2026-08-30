import { syncSimpleFinUser } from "@finsight/api";
import { db } from "@finsight/db/client";
import { Connection } from "@finsight/db/schema";

import { env } from "~/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    console.error("CRON_SECRET is not configured.");
    return Response.json({ error: "Cron is not configured." }, { status: 503 });
  }

  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const connections = await db
    .select({ userId: Connection.userId })
    .from(Connection);
  let succeeded = 0;
  let degraded = 0;
  let failed = 0;

  for (const { userId } of connections) {
    try {
      const result = await syncSimpleFinUser(db, userId);
      if (result.providerErrors.length > 0) {
        degraded += 1;
      } else {
        succeeded += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("Daily SimpleFin sync failed.", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return Response.json(
    { attempted: connections.length, succeeded, degraded, failed },
    { status: degraded === 0 && failed === 0 ? 200 : 500 },
  );
}
