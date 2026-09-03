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
export async function analyzeSchematic(
	base64: string,
	mimeType: string,
): Promise<AnalysisResult> {
	const errors: string[] = [];

	// Step 1: Attempt Google Gemini (Primary)
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

	// Step 2: Fallback to Groq (Secondary)
	try {
		console.log("[Fallback Pipeline] Attempting Secondary Provider: Groq");
		return await analyzeWithGroq(base64, mimeType);
	} catch (groqError: unknown) {
		const msg =
			groqError instanceof Error ? groqError.message : String(groqError);
		console.warn("[Fallback Pipeline] Secondary Groq failed:", msg);
		errors.push(`Groq: ${msg}`);
	}

	// Step 3: Fallback to OpenRouter (Tertiary)
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

	// If all providers in the fallback chain fail
	throw new Error(
		`All AI Providers Failed. Summary of errors:\n- ${errors.join("\n- ")}`,
	);
}
