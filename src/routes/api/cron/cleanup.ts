import { createFileRoute } from "@tanstack/react-router";
import { logErrorOnce, logWarningOnce } from "../../../lib/serverLogger";
import { supabase } from "../../../lib/supabase";

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
					// 2. Compute 7-day retention cutoff timestamp
					const cutoff = new Date(
						Date.now() - 7 * 24 * 60 * 60 * 1000,
					).toISOString();

					// 3. Delete records older than 7 days
					const { error, count } = await supabase
						.from("analyses")
						.delete({ count: "exact" })
						.lt("created_at", cutoff);

					if (error) {
						logErrorOnce(
							"cleanup-cron-error",
							"Supabase 7-day cleanup error:",
							error,
						);
						return Response.json({ error: error.message }, { status: 500 });
					}

					console.log(
						`[Maintenance] Purged ${count ?? 0} analyses older than 7 days (cutoff: ${cutoff}).`,
					);

					return Response.json({
						success: true,
						purgedRecords: count ?? 0,
						cutoffTimestamp: cutoff,
					});
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
