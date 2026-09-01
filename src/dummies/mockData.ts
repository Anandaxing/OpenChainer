import type { AnalysisResult } from "../types";

/**
 * DUMMY DATA FOR SCHEMATIC ANALYSIS TESTING
 * Highlighted variable for easy tracing and replacement in future backend integration phases.
 */
export const DUMMY_SCHEMATIC_ANALYSIS_RESULT: AnalysisResult = {
	id: "dummy-analysis-001",
	filename: "sample_555_timer_circuit.png",
	fileSizeFormatted: "1.2 MB",
	imageUrl:
		"https://placehold.co/600x450/18181b/10b981?text=555+Timer+Circuit+Schematic",
	isSchematic: true,
	isCached: false,
	summary:
		"A classic astable multivibrator circuit based on the NE555 timer IC. It generates a continuous square-wave pulse sequence ideal for LED blinking or clock signal generation.",
	components: [
		{
			designator: "U1",
			name: "NE555 Timer IC",
			description: "8-pin DIP precision timing circuit",
		},
		{
			designator: "R1",
			name: "10kΩ Resistor",
			description: "Pull-up resistor for timing capacitor charge path",
		},
		{
			designator: "R2",
			name: "47kΩ Resistor",
			description: "Discharge timing resistor",
		},
		{
			designator: "C1",
			name: "10µF Electrolytic Capacitor",
			description: "Main timing capacitor defining pulse frequency (~1.3Hz)",
		},
		{
			designator: "C2",
			name: "0.01µF Ceramic Capacitor",
			description:
				"Control voltage decoupling capacitor to prevent noise trigger",
		},
		{
			designator: "D1",
			name: "Green 5mm LED",
			description: "Output status indicator connected to Pin 3",
		},
	],
	powerSource: {
		type: "Regulated DC Adapter / 9V Battery",
		voltage: "5V - 15V DC (Nominal 9V)",
	},
	acDcMap: {
		acDetails:
			"No AC mains input present. Circuit runs strictly on pure DC voltage input.",
		dcDetails:
			"9V DC input regulated internally across pin 8 (VCC) and pin 1 (GND). Output switches between 0V and ~7.2V DC high state.",
	},
	educationDetail:
		"The 555 timer in astable mode continuously toggles its output Pin 3 between high and low logic states. Capacitor C1 charges through (R1 + R2) until reaching 2/3 VCC, triggering Pin 6 (Threshold) to turn on the internal discharge transistor (Pin 7). C1 then discharges through R2 into Pin 7 until voltage drops below 1/3 VCC.",
	uncertainties: [
		"R2 value color code is slightly blurred; verified as 47kΩ based on standard astable ratio tolerances.",
		"Confirm polarity orientation of C1 before connecting power source to avoid reverse biasing.",
		"Decoupling capacitor C2 is recommended close to U1 pin 5 to filter high-frequency rail noise.",
	],
	analyzedAt: new Date().toISOString(),
};

/**
 * DUMMY DATA FOR NON-SCHEMATIC IMAGE TESTING
 * Used when an uploaded image is identified as a photo or non-circuit graphic.
 */
export const DUMMY_NON_SCHEMATIC_ANALYSIS_RESULT: AnalysisResult = {
	id: "dummy-analysis-002",
	filename: "photo_on_desk.jpg",
	fileSizeFormatted: "2.8 MB",
	imageUrl:
		"https://placehold.co/600x450/18181b/f59e0b?text=Non-Schematic+Photo+Detected",
	isSchematic: false,
	isCached: false,
	summary:
		"The uploaded image appears to be a physical component photo or workbench view rather than a clear circuit schematic line diagram.",
	components: [],
	powerSource: {
		type: "Unknown",
		voltage: "N/A",
	},
	acDcMap: {
		acDetails: "Cannot determine power domain from physical photograph.",
		dcDetails: "Upload a clean schematic or diagram for AC/DC mapping.",
	},
	educationDetail:
		"Schematic analyzers work best when given clean line drawings, CAD exports, or high-contrast printed circuit diagrams rather than glossy physical board photos.",
	uncertainties: [
		"Component traces are obscured by component bodies and reflection.",
		"Please capture or convert your circuit into a clean schematic diagram view.",
	],
	analyzedAt: new Date().toISOString(),
};

/**
 * DUMMY SAMPLE SVG SCHEMATIC IMAGE (Data URL)
 * Lightweight inline schematic for instant testing without external network access.
 */
export const DUMMY_SAMPLE_SCHEMATIC_DATA_URL =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:%2309090b;font-family:monospace;"><rect width="600" height="400" fill="%2309090b"/><path d="M 50,50 L 550,50 L 550,350 L 50,350 Z" stroke="%2327272a" stroke-width="2" fill="none"/><rect x="220" y="130" width="160" height="140" rx="8" fill="%2318181b" stroke="%2310b981" stroke-width="2"/><text x="300" y="180" text-anchor="middle" fill="%2310b981" font-size="18" font-weight="bold">U1: NE555</text><text x="300" y="210" text-anchor="middle" fill="%23a1a1aa" font-size="12">TIMING IC</text><path d="M 100,200 L 220,200" stroke="%2310b981" stroke-width="3"/><path d="M 380,200 L 500,200" stroke="%2310b981" stroke-width="3"/><circle cx="100" cy="200" r="6" fill="%2310b981"/><circle cx="500" cy="200" r="6" fill="%2310b981"/><text x="100" y="180" text-anchor="middle" fill="%23f59e0b" font-size="12">VCC (+9V)</text><text x="500" y="180" text-anchor="middle" fill="%230284c7" font-size="12">OUT (Pin 3)</text><text x="300" y="340" text-anchor="middle" fill="%2371717a" font-size="12">[DUMMY TEST SCHEMATIC]</text></svg>';
