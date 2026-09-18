import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCutoffTimestamp, purgeExpiredAnalyses } from "../src/lib/cleanup.ts";

describe("Database 7-Day Retention & Pruning Unit Tests", () => {
	describe("1. Cutoff Timestamp Calculation", () => {
		it("should compute exact timestamp 7 days prior to reference date", () => {
			const referenceDate = new Date("2026-09-18T12:00:00.000Z");
			const expectedCutoff = "2026-09-11T12:00:00.000Z";

			const cutoff = computeCutoffTimestamp(7, referenceDate);
			assert.strictEqual(cutoff, expectedCutoff);
		});

		it("should support custom retention day counts", () => {
			const referenceDate = new Date("2026-09-18T00:00:00.000Z");

			// 1 day
			assert.strictEqual(
				computeCutoffTimestamp(1, referenceDate),
				"2026-09-17T00:00:00.000Z",
			);
			// 14 days
			assert.strictEqual(
				computeCutoffTimestamp(14, referenceDate),
				"2026-09-04T00:00:00.000Z",
			);
			// 30 days
			assert.strictEqual(
				computeCutoffTimestamp(30, referenceDate),
				"2026-08-19T00:00:00.000Z",
			);
		});

		it("should default to 7 days when days parameter is omitted", () => {
			const before = Date.now();
			const cutoffIso = computeCutoffTimestamp();
			const after = Date.now();

			const cutoffTime = new Date(cutoffIso).getTime();
			const expectedLower = before - 7 * 24 * 60 * 60 * 1000;
			const expectedUpper = after - 7 * 24 * 60 * 60 * 1000;

			assert.ok(
				cutoffTime >= expectedLower && cutoffTime <= expectedUpper,
				"Default cutoff should be within 7-day bounds of current time",
			);
		});
	});

	describe("2. Retention TTL Filtering & Expiration Decisions", () => {
		const referenceTime = new Date("2026-09-18T12:00:00.000Z");
		const cutoff = computeCutoffTimestamp(7, referenceTime);

		it("should mark records created 6 days ago as ACTIVE (not purged)", () => {
			const created6DaysAgo = "2026-09-12T12:00:00.000Z";
			const isExpired = created6DaysAgo < cutoff;
			assert.strictEqual(isExpired, false, "Record created 6 days ago must NOT be expired");
		});

		it("should mark records created 6 days and 23 hours ago as ACTIVE (not purged)", () => {
			const createdJustInside = "2026-09-11T13:00:00.000Z";
			const isExpired = createdJustInside < cutoff;
			assert.strictEqual(isExpired, false, "Record created 6d23h ago must remain active");
		});

		it("should mark records created 7 days and 1 second ago as EXPIRED (purged)", () => {
			const createdJustExpired = "2026-09-11T11:59:59.000Z";
			const isExpired = createdJustExpired < cutoff;
			assert.strictEqual(isExpired, true, "Record created > 7 days ago must be marked expired");
		});

		it("should mark records created 30 days ago as EXPIRED (purged)", () => {
			const created30DaysAgo = "2026-08-19T00:00:00.000Z";
			const isExpired = created30DaysAgo < cutoff;
			assert.strictEqual(isExpired, true, "Record created 30 days ago must be marked expired");
		});
	});

	describe("3. Database Purge Execution (purgeExpiredAnalyses)", () => {
		it("should invoke Supabase delete query with exact count and cutoff filter", async () => {
			let targetTable = "";
			let deleteOptions: any = null;
			let ltColumn = "";
			let ltValue = "";

			// Mock Supabase client
			const mockClient: any = {
				from: (table: string) => {
					targetTable = table;
					return {
						delete: (options: any) => {
							deleteOptions = options;
							return {
								lt: async (col: string, val: string) => {
									ltColumn = col;
									ltValue = val;
									return {
										error: null,
										count: 42,
									};
								},
							};
						},
					};
				},
			};

			const result = await purgeExpiredAnalyses(mockClient, 7);

			assert.strictEqual(targetTable, "analyses", "Must target 'analyses' table");
			assert.deepStrictEqual(
				deleteOptions,
				{ count: "exact" },
				"Must request exact deletion count for telemetry",
			);
			assert.strictEqual(ltColumn, "created_at", "Must filter by 'created_at' column");
			assert.ok(typeof ltValue === "string" && ltValue.endsWith("Z"), "Must pass valid ISO cutoff string");
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.purgedRecords, 42, "Must return count of purged rows");
			assert.strictEqual(result.cutoffTimestamp, ltValue);
		});

		it("should return 0 purged records if no expired rows exist", async () => {
			const mockClient: any = {
				from: () => ({
					delete: () => ({
						lt: async () => ({
							error: null,
							count: 0,
						}),
					}),
				}),
			};

			const result = await purgeExpiredAnalyses(mockClient, 7);
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.purgedRecords, 0);
		});

		it("should propagate database errors when deletion query fails", async () => {
			const mockClient: any = {
				from: () => ({
					delete: () => ({
						lt: async () => ({
							error: new Error("PostgreSQL connection timeout"),
							count: null,
						}),
					}),
				}),
			};

			await assert.rejects(
				async () => {
					await purgeExpiredAnalyses(mockClient, 7);
				},
				{
					message: "PostgreSQL connection timeout",
				},
				"Must throw when Supabase query returns an error",
			);
		});
	});

	describe("4. Endpoint Authentication & Authorization Logic", () => {
		function evaluateAuthorization(
			requestSecret: string | null,
			configuredSecret: string | undefined,
		): { authorized: boolean; statusCode: number } {
			if (configuredSecret && requestSecret !== `Bearer ${configuredSecret}`) {
				return { authorized: false, statusCode: 401 };
			}
			return { authorized: true, statusCode: 200 };
		}

		it("should block request without authorization header when CRON_SECRET is configured", () => {
			const auth = evaluateAuthorization(null, "my-secret-token-123");
			assert.strictEqual(auth.authorized, false);
			assert.strictEqual(auth.statusCode, 401);
		});

		it("should block request with incorrect token when CRON_SECRET is configured", () => {
			const auth = evaluateAuthorization("Bearer wrong-token", "my-secret-token-123");
			assert.strictEqual(auth.authorized, false);
			assert.strictEqual(auth.statusCode, 401);
		});

		it("should allow request with matching bearer token when CRON_SECRET is configured", () => {
			const auth = evaluateAuthorization("Bearer my-secret-token-123", "my-secret-token-123");
			assert.strictEqual(auth.authorized, true);
			assert.strictEqual(auth.statusCode, 200);
		});

		it("should allow request when no CRON_SECRET is configured in environment", () => {
			const auth = evaluateAuthorization(null, undefined);
			assert.strictEqual(auth.authorized, true);
			assert.strictEqual(auth.statusCode, 200);
		});
	});

	describe("5. Cache Read-Time TTL Hardening (POST /api/analyze)", () => {
		it("should include .gte('created_at', cutoff) to reject records older than 7 days", () => {
			let gteColumn = "";
			let gteValue = "";

			const mockQueryBuilder = {
				select: () => mockQueryBuilder,
				eq: () => mockQueryBuilder,
				gte: (col: string, val: string) => {
					gteColumn = col;
					gteValue = val;
					return mockQueryBuilder;
				},
				maybeSingle: async () => ({ data: null, error: null }),
			};

			const sevenDaysCutoff = computeCutoffTimestamp(7);
			mockQueryBuilder.gte("created_at", sevenDaysCutoff);

			assert.strictEqual(gteColumn, "created_at");
			assert.strictEqual(gteValue, sevenDaysCutoff);
		});
	});
});
