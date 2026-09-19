export interface ComponentItem {
	name: string;
	designator?: string;
	quantity?: number;
	description?: string;
	purpose?: string;
	details?: string[];
	failureConsequence?: string;
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

export interface OperationalCycleStage {
	stageNumber: number;
	name: string;
	description: string;
	inputState?: string;
	outputState?: string;
	keyComponents?: string[];
}

export interface CircuitTradeoffs {
	advantages: string[];
	disadvantages: string[];
}

export interface CircuitHazard {
	severity: "critical" | "warning" | "caution";
	category?:
		| "high_voltage_shock"
		| "stored_energy"
		| "thermal_burn"
		| "fire_overcurrent"
		| "isolation_breach"
		| "other"
		| string;
	location: string;
	description: string;
	mitigation: string;
}

export interface LLMProviderStatus {
	providerName: string;
	isConfigured: boolean;
	activeModel?: string;
	latencyMs?: number;
	status: "operational" | "degraded" | "unavailable";
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

	// Rich Engineering Analysis Additions
	operationalCycle?: OperationalCycleStage[];
	tradeoffs?: CircuitTradeoffs;
	hazards?: CircuitHazard[];
	providerStatus?: LLMProviderStatus;
}

