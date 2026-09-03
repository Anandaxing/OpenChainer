export interface ComponentItem {
	name: string;
	designator?: string;
	quantity?: number;
	description?: string;
}

export interface PowerInfo {
	source: string;
	voltage?: string;
	notes?: string;
}

export interface RegionInfo {
	location: string;
	reasoning: string;
}

export interface PowerSourceInfo {
	type: string;
	voltage: string;
}

export interface AcDcMap {
	acDetails: string;
	dcDetails: string;
}

export interface AnalysisResult {
	id?: string;
	filename?: string;
	fileSizeFormatted?: string;
	imageUrl?: string;
	isSchematic: boolean;
	cached?: boolean;
	isCached?: boolean;
	provider?: string;
	summary: string;
	components: ComponentItem[];
	power: PowerInfo;
	acRegions: RegionInfo[];
	dcRegions: RegionInfo[];
	explanation: string;
	uncertainties: string[];
	analyzedAt?: string;

	// UI Compatibility properties
	powerSource?: PowerSourceInfo;
	acDcMap?: AcDcMap;
	educationDetail?: string;
}
