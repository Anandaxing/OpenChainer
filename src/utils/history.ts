import type { AnalysisResult, HistoryEntry } from "../types";
import { generateThumbnail } from "./thumbnail";

const HISTORY_STORAGE_KEY = "openchainer_recent_history_v1";
const MAX_HISTORY_ITEMS = 10;

export function getLocalHistory(): HistoryEntry[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		console.error("Failed to parse local history:", err);
		return [];
	}
}

export async function saveToLocalHistory(
	result: AnalysisResult,
	imageSource: File | string,
): Promise<HistoryEntry[]> {
	if (typeof window === "undefined") return [];

	try {
		const thumbnailUrl = await generateThumbnail(imageSource);
		const newEntry: HistoryEntry = {
			id: result.id,
			filename: result.filename,
			thumbnailUrl,
			analyzedAt: result.analyzedAt,
			result: {
				...result,
				isCached: true,
			},
		};

		const existing = getLocalHistory().filter((item) => item.id !== result.id);
		const updated = [newEntry, ...existing].slice(0, MAX_HISTORY_ITEMS);

		localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
		return updated;
	} catch (err) {
		console.error("Failed to save entry to local history:", err);
		return getLocalHistory();
	}
}

export function clearLocalHistory(): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(HISTORY_STORAGE_KEY);
	} catch (err) {
		console.error("Failed to clear local history:", err);
	}
}
