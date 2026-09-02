import type { AnalysisResult } from "./types";

const PROMPT = `You are an expert electrical engineer and schematic diagram analyzer.
Analyze the provided image carefully and determine if it is an electrical/electronic schematic diagram, circuit layout, or PCB trace diagram.

If it is NOT a schematic diagram or PCB layout (e.g., photo of a cat, person, landscape, general object, logo icon):
- Set "isSchematic": false
- Provide a summary explaining why it is not recognized as a schematic diagram.
- Fill other fields with concise explanatory placeholders.

If it IS a schematic or PCB diagram, follow these steps strictly:
1. LIST every component (e.g. resistors, capacitors, ICs, transistors, MOSFETs, diodes, switches, connectors) with their names, designators (e.g. R1, Q1, U1), quantity, and functional description.
2. LOCATE power source(s) (e.g. 5V USB, 12V DC Adapter, 9V Battery, AC Mains, Voltage Regulator). Specify source name, voltage if labeled, and operational notes.
3. TRACE power path — identify AC regions (alternating current, transformer primaries, mains) and DC regions (direct current, rectified rails, logic supply lines) with detailed engineering reasoning.
4. EXPLAIN the circuit function in clear, plain language (both a concise summary and a detailed explanation).
5. FLAG any uncertainties — if any trace, connection, or label is blurry, ambiguous, or unreadable, list it explicitly under uncertainties. NEVER invent unverified connections.

Output MUST be strictly valid JSON matching this schema:
{
  "isSchematic": boolean,
  "summary": "string",
  "components": [
    { "name": "string", "designator": "string", "quantity": number, "description": "string" }
  ],
  "power": { "source": "string", "voltage": "string", "notes": "string" },
  "acRegions": [ { "location": "string", "reasoning": "string" } ],
  "dcRegions": [ { "location": "string", "reasoning": "string" } ],
  "explanation": "string",
  "uncertainties": [ "string" ]
}`;

export function normalizeAnalysisResult(
	raw: Partial<AnalysisResult>,
	filename = "schematic_upload.png",
): AnalysisResult {
	const acText =
		raw.acRegions && raw.acRegions.length > 0
			? raw.acRegions.map((r) => `${r.location}: ${r.reasoning}`).join("\n")
			: "No AC regions detected in schematic.";

	const dcText =
		raw.dcRegions && raw.dcRegions.length > 0
			? raw.dcRegions.map((r) => `${r.location}: ${r.reasoning}`).join("\n")
			: "No DC regions detected in schematic.";

	const powerSourceType =
		raw.power?.source || raw.powerSource?.type || "Unknown Power Source";
	const powerVoltage =
		raw.power?.voltage || raw.powerSource?.voltage || "N/A";

	return {
		id: raw.id || `analysis-${Date.now()}`,
		filename: raw.filename || filename,
		fileSizeFormatted: raw.fileSizeFormatted || "Uploaded File",
		imageUrl: raw.imageUrl || "",
		isSchematic: raw.isSchematic ?? true,
		cached: raw.cached ?? false,
		provider: raw.provider || "Gemini AI",
		summary: raw.summary || "No summary provided.",
		components: (raw.components || []).map((c) => ({
			name: c.name || "Unknown Component",
			designator: c.designator || "—",
			quantity: c.quantity || 1,
			description: c.description || "",
		})),
		power: raw.power || {
			source: powerSourceType,
			voltage: powerVoltage,
			notes: "",
		},
		acRegions: raw.acRegions || [],
		dcRegions: raw.dcRegions || [],
		explanation: raw.explanation || raw.educationDetail || "",
		uncertainties: raw.uncertainties || [],
		powerSource: {
			type: powerSourceType,
			voltage: powerVoltage,
		},
		acDcMap: raw.acDcMap || {
			acDetails: acText,
			dcDetails: dcText,
		},
		educationDetail:
			raw.explanation || raw.educationDetail || raw.summary || "",
		analyzedAt: raw.analyzedAt || new Date().toISOString(),
	};
}

const CANDIDATE_MODELS = [
	"gemini-2.5-flash",
	"gemini-3.6-flash",
	"gemini-3.7-flash",
	"gemini-flash-latest",
	"gemini-2.5-flash-lite",
];

export async function analyzeSchematic(
	base64: string,
	mimeType: string,
): Promise<AnalysisResult> {
	const apiKey =
		process.env.GEMINI_API_KEY ||
		(typeof import.meta !== "undefined" && import.meta.env?.GEMINI_API_KEY);

	if (!apiKey) {
		throw new Error(
			"GEMINI_API_KEY environment variable is missing. Please set it in .env.local.",
		);
	}

	let lastErrorText = "";

	for (const model of CANDIDATE_MODELS) {
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						contents: [
							{
								parts: [
									{ text: PROMPT },
									{ inline_data: { mime_type: mimeType, data: base64 } },
								],
							},
						],
						generationConfig: {
							response_mime_type: "application/json",
						},
					}),
				});

				if (!res.ok) {
					lastErrorText = await res.text();
					if (res.status === 503 && attempt === 0) {
						await new Promise((r) => setTimeout(r, 1000));
						continue;
					}
					console.warn(`Model ${model} returned status ${res.status}, trying next model...`);
					break;
				}

				const data = await res.json();
				const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

				if (!responseText) {
					break;
				}

				const parsed = JSON.parse(responseText) as Partial<AnalysisResult>;
				parsed.provider = `Gemini (${model})`;
				return normalizeAnalysisResult(parsed);
			} catch (err) {
				console.warn(`Error attempting model ${model} (attempt ${attempt + 1}):`, err);
			}
		}
	}

	throw new Error(`Gemini API error: ${lastErrorText || "No valid response from candidate models"}`);
}
