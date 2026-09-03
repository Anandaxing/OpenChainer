export type AnalysisState =
	| "idle"
	| "file_selected"
	| "uploading"
	| "analyzing"
	| "success"
	| "error";

export type Phase = AnalysisState;

export interface ComponentItem {
	designator: string; // e.g. "R1", "Q2", "C5"
	name: string; // e.g. "10kΩ Resistor"
	description?: string;
}

export interface PowerSourceInfo {
	type: string; // e.g. "Regulated DC Adapter / Battery"
	voltage: string; // e.g. "5V - 12V DC"
}

export interface AcDcMap {
	acDetails: string;
	dcDetails: string;
}

export interface AnalysisResult {
	id: string;
	filename: string;
	fileSizeFormatted: string;
	imageUrl: string;
	isSchematic: boolean;
	isCached?: boolean;
	cached?: boolean;
	provider?: string;
	summary: string;
	components: ComponentItem[];
	powerSource: PowerSourceInfo;
	acDcMap: AcDcMap;
	educationDetail: string;
	uncertainties: string[];
	analyzedAt: string;
}

export interface HistoryEntry {
	id: string;
	filename: string;
	thumbnailUrl: string; // 240px WebP base64 data URL
	analyzedAt: string;
	result: AnalysisResult;
}
