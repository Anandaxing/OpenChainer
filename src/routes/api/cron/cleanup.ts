import { createFileRoute } from "@tanstack/react-router";
import { purgeExpiredAnalyses } from "../../../lib/cleanup";
import { logErrorOnce, logWarningOnce } from "../../../lib/serverLogger";

export const Route = createFileRoute("/api/cron/cleanup")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				// 1. Authorization: verify secret if CRON_SECRET is configured
				const authHeader = request.headers.get("authorization");
				const expectedSecret = process.env.CRON_SECRET;

				if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
					logWarningOnce(
						"unauthorized-cron",
						"Blocked unauthorized cleanup cron trigger attempt",
					);
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				try {
					// 2. Execute 7-day purging operation
					const result = await purgeExpiredAnalyses();

					console.log(
						`[Maintenance] Purged ${result.purgedRecords} analyses older than 7 days (cutoff: ${result.cutoffTimestamp}).`,
					);

					return Response.json(result);
				} catch (err: unknown) {
					const message =
						err instanceof Error ? err.message : "Unknown error during cleanup";
					logErrorOnce("cleanup-cron-exception", "Cron exception:", err);
					return Response.json({ error: message }, { status: 500 });
				}
			},
		},
	},
});
