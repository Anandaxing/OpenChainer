import type {
	AnalysisResult,
	CircuitHazard,
	CircuitTradeoffs,
	OperationalCycleStage,
} from "./types";

const PROMPT = `You are an expert electrical engineer, PCB designer, and circuit safety inspector.
Analyze the provided image carefully and determine if it is an electrical/electronic schematic diagram, circuit layout, or PCB trace diagram.

If it is NOT a schematic diagram or PCB layout (e.g., photo of a cat, person, landscape, general object, logo icon):
- Set "isSchematic": false
- Provide a summary explaining why it is not recognized as a schematic diagram.
- Fill other fields with concise explanatory placeholders.

If it IS a schematic or PCB diagram, follow these steps strictly:
1. IDENTIFY COMPONENTS & PURPOSE:
   - For EVERY component (resistors, capacitors, ICs, transistors, MOSFETs, diodes, inductors, transformers, switches, connectors):
     * "name": Component type/name (e.g. "N-Channel Power MOSFET", "Electrolytic Smoothing Capacitor").
     * "designator": Label found on schematic (e.g. R1, Q1, U1, C2).
     * "quantity": Count.
     * "purpose": State the EXACT functional purpose of this specific component in this circuit topology.
     * "details": Array of 2 to 4 bullet points detailing operational role, node connections (which pins or nets it connects to), and labeled value/rating (e.g. "10kΩ 1/4W", "100µF 50V").
     * "failureConsequence": Brief statement on what happens if this component fails, shorts, or opens.

2. OPERATIONAL CYCLE ("How This Circuit Operates"):
   - Deconstruct the circuit function into a sequential, cyclic 3-to-5 stage operational process:
     * Stage 1: Power Input & Conditioning (inrush limiting, fuse protection, rectifying, filter charging)
     * Stage 2: Switching, Oscillation, or Biasing (gate drive, base injection, PWM startup, IC enable)
     * Stage 3: Energy Transfer / Amplification (inductive storage, transformer primary flux, signal amplification)
     * Stage 4: Rectification & Output Delivery (freewheeling, secondary rectification, filtering, load delivery)
     * Stage 5: Regulation, Feedback & Protection Loop (voltage sensing, optocoupler/divider feedback, duty cycle modulation closing the cycle)
   - For each stage provide: "stageNumber", "name", "description" (clear operational explanation), "inputState", "outputState", and "keyComponents" (array of component designators).

3. ADVANTAGES & DISADVANTAGES:
   - "advantages": Array of 3 to 5 concise points defining engineering strengths (e.g. high efficiency, galvanic isolation, low component count, low BOM cost, wide input tolerance).
   - "disadvantages": Array of 3 to 5 concise points defining engineering limitations (e.g. high EMI emissions, output voltage ripple, lack of short-circuit protection, high switch voltage stress, thermal dissipation).

4. HAZARD & SAFETY WARNINGS:
   - Identify which parts are dangerous and can cause hazards:
     * "severity": "critical" | "warning" | "caution"
     * "category": "high_voltage_shock" | "stored_energy" | "thermal_burn" | "fire_overcurrent" | "isolation_breach" | "other"
     * "location": Specific component or node (e.g. "AC Mains Input Terminals & Bridge Rectifier", "Bulk Filter Capacitor C1", "MOSFET Q1 Heatsink")
     * "description": Specific hazard description (e.g. "Lethal 120V/230V AC shock hazard with exposed conductors", "Retains >300V DC dangerous charge after power disconnection")
     * "mitigation": Actionable safe handling or mitigation advice (e.g. "Use isolation transformer during testing; discharge capacitor through a 10k resistor before servicing").

5. POWER & DOMAIN MAPPING:
   - Locate power source(s) and voltage.
   - Trace power path into AC regions and DC regions with engineering reasoning.

6. UNCERTAINTIES & CAVEATS:
   - Flag any blurry traces, unreadable values, or unverified pinouts under "uncertainties". NEVER invent unverified connections.

Output MUST be strictly valid JSON matching this schema:
{
  "isSchematic": boolean,
  "summary": "string",
  "components": [
    {
      "name": "string",
      "designator": "string",
      "quantity": number,
      "purpose": "string",
      "details": ["string"],
      "failureConsequence": "string",
      "description": "string"
    }
  ],
  "power": { "source": "string", "voltage": "string", "notes": "string" },
  "acRegions": [ { "location": "string", "reasoning": "string" } ],
  "dcRegions": [ { "location": "string", "reasoning": "string" } ],
  "operationalCycle": [
    {
      "stageNumber": number,
      "name": "string",
      "description": "string",
      "inputState": "string",
      "outputState": "string",
      "keyComponents": ["string"]
    }
  ],
  "tradeoffs": {
    "advantages": ["string"],
    "disadvantages": ["string"]
  },
  "hazards": [
    {
      "severity": "critical" | "warning" | "caution",
      "category": "string",
      "location": "string",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "explanation": "string",
  "uncertainties": [ "string" ]
}`;

/**
 * Safely extracts and parses JSON from raw LLM responses.
 * Handles markdown code fences (```json ... ```), preambles, and postambles.
 */
export function extractJson<T = unknown>(text: string): T {
	if (!text || typeof text !== "string") {
		throw new Error("extractJson received empty or non-string input");
	}

	// 1. If wrapped in markdown code fences, extract the fence content first
	const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	const candidate = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

	// 2. Try direct JSON parse on candidate block
	try {
		return JSON.parse(candidate) as T;
	} catch {
		// Fall through to boundary extraction
	}

	// 3. Find outermost JSON object boundaries: first '{' to last '}'
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");

	if (start !== -1 && end !== -1 && start < end) {
		const jsonSlice = candidate.slice(start, end + 1);
		try {
			return JSON.parse(jsonSlice) as T;
		} catch {
			// Fall through
		}
	}

	// 4. Fallback: strip all backticks and search whole string
	const stripped = text
		.replace(/```(?:json)?/gi, "")
		.replace(/```/g, "")
		.trim();
	const strippedStart = stripped.indexOf("{");
	const strippedEnd = stripped.lastIndexOf("}");

	if (
		strippedStart !== -1 &&
		strippedEnd !== -1 &&
		strippedStart < strippedEnd
	) {
		return JSON.parse(stripped.slice(strippedStart, strippedEnd + 1)) as T;
	}

	throw new Error(
		`No valid JSON object found in response: "${text.slice(0, 120)}..."`,
	);
}

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
	const powerVoltage = raw.power?.voltage || raw.powerSource?.voltage || "N/A";

	const cachedValue = raw.cached ?? raw.isCached ?? false;
	const explanationText =
		raw.explanation || raw.educationDetail || raw.summary || "";

	// Robust operational cycle fallback
	const operationalCycle: OperationalCycleStage[] =
		Array.isArray(raw.operationalCycle) && raw.operationalCycle.length > 0
			? raw.operationalCycle.map((stage, idx) => ({
					stageNumber: stage.stageNumber ?? idx + 1,
					name: stage.name || `Operational Stage ${idx + 1}`,
					description: stage.description || "Active circuit operation.",
					inputState: stage.inputState || undefined,
					outputState: stage.outputState || undefined,
					keyComponents: Array.isArray(stage.keyComponents)
						? stage.keyComponents
						: undefined,
				}))
			: [
					{
						stageNumber: 1,
						name: "Primary Operation",
						description:
							explanationText ||
							"Circuit operates according to standard schematic topology.",
					},
				];

	// Robust tradeoffs fallback
	const tradeoffs: CircuitTradeoffs = {
		advantages: Array.isArray(raw.tradeoffs?.advantages)
			? raw.tradeoffs.advantages.filter(Boolean)
			: [],
		disadvantages: Array.isArray(raw.tradeoffs?.disadvantages)
			? raw.tradeoffs.disadvantages.filter(Boolean)
			: [],
	};

	// Robust hazards fallback
	const hazards: CircuitHazard[] = Array.isArray(raw.hazards)
		? raw.hazards.map((h) => ({
				severity:
					h.severity === "critical" ||
					h.severity === "warning" ||
					h.severity === "caution"
						? h.severity
						: "warning",
				category: h.category || "other",
				location: h.location || "General Circuit",
				description: h.description || "Potential electrical hazard.",
				mitigation:
					h.mitigation || "Follow standard laboratory safety procedures.",
			}))
		: [];

	return {
		id: raw.id || `analysis-${Date.now()}`,
		filename: raw.filename || filename,
		fileSizeFormatted: raw.fileSizeFormatted || "Uploaded File",
		imageUrl: raw.imageUrl || "",
		isSchematic: raw.isSchematic ?? true,
		cached: cachedValue,
		isCached: cachedValue,
		provider: raw.provider || "Gemini AI",
		summary: raw.summary || "No summary provided.",
		components: (raw.components || []).map((c) => {
			const desc = c.description || "";
			const purpose = c.purpose || desc || "Circuit component";
			const details =
				Array.isArray(c.details) && c.details.length > 0
					? c.details
					: desc
						? [desc]
						: [];
			return {
				name: c.name || "Unknown Component",
				designator: c.designator || "—",
				quantity: c.quantity || 1,
				description: desc || purpose,
				purpose,
				details,
				failureConsequence: c.failureConsequence || undefined,
			};
		}),
		power: raw.power || {
			source: powerSourceType,
			voltage: powerVoltage,
			notes: "",
		},
		acRegions: raw.acRegions || [],
		dcRegions: raw.dcRegions || [],
		explanation: explanationText,
		uncertainties: raw.uncertainties || [],
		powerSource: {
			type: powerSourceType,
			voltage: powerVoltage,
		},
		acDcMap: raw.acDcMap || {
			acDetails: acText,
			dcDetails: dcText,
		},
		educationDetail: explanationText,
		operationalCycle,
		tradeoffs,
		hazards,
		analyzedAt: raw.analyzedAt || new Date().toISOString(),
	};
}

// Helper to extract environment variable safely across server & bundler contexts
function getEnvVar(key: string): string | undefined {
	if (typeof process !== "undefined" && process.env?.[key]) {
		return process.env[key];
	}
	if (typeof import.meta !== "undefined" && import.meta.env?.[key]) {
		return import.meta.env[key];
	}
	return undefined;
}

// -----------------------------------------------------------------------------
// 1. Google Gemini Provider
// -----------------------------------------------------------------------------
const GEMINI_CANDIDATE_MODELS = [
	"gemini-3.6-flash",
	"gemini-3.8-flash",
	"gemini-flash-latest",
	"gemini-3.5-flash",
];

async function analyzeWithGemini(
	base64: string,
	mimeType: string,
): Promise<AnalysisResult> {
	const apiKey = getEnvVar("GEMINI_API_KEY");
	const baseUrl =
		getEnvVar("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com";

	if (!apiKey) {
		throw new Error("GEMINI_API_KEY environment variable is not configured.");
	}

	let lastErrorText = "";

	for (const model of GEMINI_CANDIDATE_MODELS) {
		const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
					signal: AbortSignal.timeout(20000),
				});

				if (!res.ok) {
					lastErrorText = await res.text();

					// Fail-fast on auth, quota, or rate limits to immediately trigger secondary fallback
					if (
						res.status === 401 ||
						res.status === 403 ||
						res.status === 429 ||
						(res.status === 400 &&
							/API_KEY_INVALID|invalid.*api.*key|key.*not.*valid/i.test(
								lastErrorText,
							))
					) {
						console.warn(
							`[Gemini Provider] Fatal status ${res.status}, failing fast across all Gemini models: ${lastErrorText}`,
						);
						throw new Error(
							`Gemini API fatal error (${res.status}): ${lastErrorText || "Authentication or quota failure"}`,
						);
					}

					if (res.status === 503 && attempt === 0) {
						await new Promise((r) => setTimeout(r, 1000));
						continue;
					}
					console.warn(
						`[Gemini Provider] Model ${model} returned status ${res.status}, trying next model...`,
					);
					break;
				}

				const data = await res.json();
				const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

				if (!responseText) {
					break;
				}

				const parsed = extractJson<Partial<AnalysisResult>>(responseText);
				parsed.provider = `Gemini (${model})`;
				return normalizeAnalysisResult(parsed);
			} catch (err) {
				// If it's our fail-fast error, rethrow immediately to escape candidate models
				if (
					err instanceof Error &&
					err.message.startsWith("Gemini API fatal error")
				) {
					throw err;
				}
				console.warn(
					`[Gemini Provider] Error attempting model ${model} (attempt ${attempt + 1}):`,
					err,
				);
			}
		}
	}

	throw new Error(
		`Gemini API failed: ${lastErrorText || "No response from candidate models"}`,
	);
}

// -----------------------------------------------------------------------------
// 2. Groq LPU / Vision Provider
// -----------------------------------------------------------------------------
const GROQ_CANDIDATE_MODELS = [
	"llama-3.2-11b-vision-preview",
	"llama-3.2-90b-vision-preview",
];

async function analyzeWithGroq(
	base64: string,
	mimeType: string,
): Promise<AnalysisResult> {
	const apiKey = getEnvVar("GROQ_API_KEY");
	const baseUrl =
		getEnvVar("GROQ_BASE_URL") || "https://api.groq.com/openai/v1";

	if (!apiKey) {
		throw new Error("GROQ_API_KEY environment variable is not configured.");
	}

	let lastErrorText = "";

	for (const model of GROQ_CANDIDATE_MODELS) {
		const url = `${baseUrl}/chat/completions`;

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model,
					messages: [
						{
							role: "user",
							content: [
								{ type: "text", text: PROMPT },
								{
									type: "image_url",
									image_url: { url: `data:${mimeType};base64,${base64}` },
								},
							],
						},
					],
					// Note: response_format is omitted because Groq vision models do not support json_object
				}),
				signal: AbortSignal.timeout(20000),
			});

			if (!res.ok) {
				lastErrorText = await res.text();

				// Fail-fast on fatal auth, rate limit, or decommissioned errors
				if (
					res.status === 401 ||
					res.status === 403 ||
					res.status === 429 ||
					res.status === 404 ||
					lastErrorText.includes("model_decommissioned")
				) {
					console.warn(
						`[Groq Provider] Fatal status ${res.status}, failing fast across all Groq models: ${lastErrorText}`,
					);
					throw new Error(
						`Groq API fatal error (${res.status}): ${lastErrorText || "Authentication or model decommissioned failure"}`,
					);
				}

				console.warn(
					`[Groq Provider] Model ${model} returned status ${res.status}, trying next model...`,
				);
				continue;
			}

			const data = await res.json();
			const responseText = data.choices?.[0]?.message?.content;

			if (!responseText) {
				continue;
			}

			const parsed = extractJson<Partial<AnalysisResult>>(responseText);
			parsed.provider = `Groq (${model})`;
			return normalizeAnalysisResult(parsed);
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.startsWith("Groq API fatal error")
			) {
				throw err;
			}
			console.warn(`[Groq Provider] Error attempting model ${model}:`, err);
		}
	}

	throw new Error(
		`Groq API failed: ${lastErrorText || "No response from candidate models"}`,
	);
}

// -----------------------------------------------------------------------------
// 3. OpenRouter Free Models Provider
// -----------------------------------------------------------------------------
const OPENROUTER_CANDIDATE_MODELS = [
	"minimax/minimax-m3:free",
	"google/gemma-4-26b-a4b-it:free",
	"google/gemma-4-31b-it:free",
	"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

async function analyzeWithOpenRouter(
	base64: string,
	mimeType: string,
): Promise<AnalysisResult> {
	const apiKey = getEnvVar("OPENROUTER_API_KEY");
	const baseUrl =
		getEnvVar("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1";

	if (!apiKey) {
		throw new Error(
			"OPENROUTER_API_KEY environment variable is not configured.",
		);
	}

	let lastErrorText = "";

	for (const model of OPENROUTER_CANDIDATE_MODELS) {
		const url = `${baseUrl}/chat/completions`;

		try {
			const res = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"HTTP-Referer": "https://openchainer.org",
					"X-Title": "OpenChainer",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model,
					messages: [
						{
							role: "user",
							content: [
								{ type: "text", text: PROMPT },
								{
									type: "image_url",
									image_url: { url: `data:${mimeType};base64,${base64}` },
								},
							],
						},
					],
					// Note: response_format is omitted for maximum open-weights model compatibility
				}),
				signal: AbortSignal.timeout(20000),
			});

			if (!res.ok) {
				lastErrorText = await res.text();

				// Fail-fast on fatal auth or rate limit errors
				if (res.status === 401 || res.status === 403 || res.status === 429) {
					console.warn(
						`[OpenRouter Provider] Fatal status ${res.status}, failing fast across all OpenRouter models: ${lastErrorText}`,
					);
					throw new Error(
						`OpenRouter API fatal error (${res.status}): ${lastErrorText || "Authentication or rate limit failure"}`,
					);
				}

				console.warn(
					`[OpenRouter Provider] Model ${model} returned status ${res.status}, trying next model...`,
				);
				continue;
			}

			const data = await res.json();
			const responseText = data.choices?.[0]?.message?.content;

			if (!responseText) {
				continue;
			}

			const parsed = extractJson<Partial<AnalysisResult>>(responseText);
			parsed.provider = `OpenRouter (${model})`;
			return normalizeAnalysisResult(parsed);
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.startsWith("OpenRouter API fatal error")
			) {
				throw err;
			}
			console.warn(
				`[OpenRouter Provider] Error attempting model ${model}:`,
				err,
			);
		}
	}

	throw new Error(
		`OpenRouter API failed: ${lastErrorText || "No response from candidate models"}`,
	);
}

// -----------------------------------------------------------------------------
// Orchestrator: Multi-Provider Fallback Chain (Gemini -> Groq -> OpenRouter)
// -----------------------------------------------------------------------------

export function getLLMProvidersAvailability(): import("./types").LLMProviderStatus[] {
	return [
		{
			providerName: "Google Gemini",
			isConfigured: Boolean(getEnvVar("GEMINI_API_KEY")),
			activeModel: GEMINI_CANDIDATE_MODELS[0],
			status: getEnvVar("GEMINI_API_KEY") ? "operational" : "unavailable",
		},
		{
			providerName: "Groq LPU",
			isConfigured: Boolean(getEnvVar("GROQ_API_KEY")),
			activeModel: GROQ_CANDIDATE_MODELS[0],
			status: getEnvVar("GROQ_API_KEY") ? "operational" : "unavailable",
		},
		{
			providerName: "OpenRouter",
			isConfigured: Boolean(getEnvVar("OPENROUTER_API_KEY")),
			activeModel: OPENROUTER_CANDIDATE_MODELS[0],
			status: getEnvVar("OPENROUTER_API_KEY") ? "operational" : "unavailable",
		},
	];
}

export async function analyzeSchematic(
	base64: string,
	mimeType: string,
): Promise<AnalysisResult> {
	const errors: string[] = [];

	// Step 1: Attempt Google Gemini (Primary)
	const geminiKey = getEnvVar("GEMINI_API_KEY");
	if (geminiKey) {
		try {
			console.log(
				"[Fallback Pipeline] Attempting Primary Provider: Google Gemini",
			);
			return await analyzeWithGemini(base64, mimeType);
		} catch (geminiError: unknown) {
			const msg =
				geminiError instanceof Error ? geminiError.message : String(geminiError);
			console.warn("[Fallback Pipeline] Primary Gemini failed:", msg);
			errors.push(`Gemini: ${msg}`);
		}
	} else {
		console.log(
			"[Fallback Pipeline] Gemini not configured (no GEMINI_API_KEY), skipping.",
		);
		errors.push("Gemini: GEMINI_API_KEY environment variable is not configured.");
	}

	// Step 2: Fallback to Groq (Secondary)
	const groqKey = getEnvVar("GROQ_API_KEY");
	if (groqKey) {
		try {
			console.log("[Fallback Pipeline] Attempting Secondary Provider: Groq");
			return await analyzeWithGroq(base64, mimeType);
		} catch (groqError: unknown) {
			const msg =
				groqError instanceof Error ? groqError.message : String(groqError);
			console.warn("[Fallback Pipeline] Secondary Groq failed:", msg);
			errors.push(`Groq: ${msg}`);
		}
	} else {
		console.log(
			"[Fallback Pipeline] Groq not configured (no GROQ_API_KEY), skipping.",
		);
		errors.push("Groq: GROQ_API_KEY environment variable is not configured.");
	}

	// Step 3: Fallback to OpenRouter (Tertiary)
	const openRouterKey = getEnvVar("OPENROUTER_API_KEY");
	if (openRouterKey) {
		try {
			console.log("[Fallback Pipeline] Attempting Tertiary Provider: OpenRouter");
			return await analyzeWithOpenRouter(base64, mimeType);
		} catch (openRouterError: unknown) {
			const msg =
				openRouterError instanceof Error
					? openRouterError.message
					: String(openRouterError);
			console.warn("[Fallback Pipeline] Tertiary OpenRouter failed:", msg);
			errors.push(`OpenRouter: ${msg}`);
		}
	} else {
		console.log(
			"[Fallback Pipeline] OpenRouter not configured (no OPENROUTER_API_KEY), skipping.",
		);
		errors.push(
			"OpenRouter: OPENROUTER_API_KEY environment variable is not configured.",
		);
	}

	// If all providers in the fallback chain fail
	throw new Error(
		`All AI Providers Failed. Summary of errors:\n- ${errors.join("\n- ")}`,
	);
}

