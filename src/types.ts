import type { AnalysisResult } from "./lib/types";

export type AnalysisState =
	| "idle"
	| "file_selected"
	| "uploading"
	| "analyzing"
	| "success"
	| "error";

export type {
	AcDcMap,
	AnalysisResult,
	ComponentItem,
	PowerInfo,
	PowerSourceInfo,
	RegionInfo,
} from "./lib/types";

export interface HistoryEntry {
	id: string;
	filename: string;
	thumbnailUrl: string; // 240px WebP base64 data URL
	analyzedAt: string;
	result: AnalysisResult;
}
