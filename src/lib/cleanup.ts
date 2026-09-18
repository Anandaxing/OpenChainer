import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase.ts";

export interface CleanupResult {
	success: boolean;
	purgedRecords: number;
	cutoffTimestamp: string;
}

/**
 * Computes an ISO timestamp representing N days prior to a given reference time.
 */
export function computeCutoffTimestamp(
	days = 7,
	referenceDate: Date = new Date(),
): string {
	return new Date(
		referenceDate.getTime() - days * 24 * 60 * 60 * 1000,
	).toISOString();
}

/**
 * Deletes records from the `analyses` table whose `created_at` timestamp is older
 * than the computed cutoff (default 7 days).
 */
export async function purgeExpiredAnalyses(
	client: SupabaseClient = supabase,
	days = 7,
): Promise<CleanupResult> {
	const cutoffTimestamp = computeCutoffTimestamp(days);

	const { error, count } = await client
		.from("analyses")
		.delete({ count: "exact" })
		.lt("created_at", cutoffTimestamp);

	if (error) {
		throw error;
	}

	return {
		success: true,
		purgedRecords: count ?? 0,
		cutoffTimestamp,
	};
}
