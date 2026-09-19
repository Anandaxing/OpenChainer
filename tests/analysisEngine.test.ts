import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	extractJson,
	getLLMProvidersAvailability,
	normalizeAnalysisResult,
} from "../src/lib/analyze.ts";
import type { AnalysisResult } from "../src/lib/types.ts";

describe("Circuit Analysis Engine & Schema Specification Tests (#27)", () => {
	describe("1. Component Purpose & Point Formation Normalization", () => {
		it("should preserve purpose, details points, and failure consequence when provided", () => {
			const raw: Partial<AnalysisResult> = {
				isSchematic: true,
				summary: "Flyback Converter Schematic",
				components: [
					{
						name: "Power MOSFET",
						designator: "Q1",
						quantity: 1,
						purpose: "High-speed primary side switching to charge transformer magnetic core",
						details: [
							"Connected between primary coil negative terminal and ground",
							"Gate driven by PWM controller pin 6 through 10Ω resistor",
							"Rated 600V, 10A (STP10NK60Z)",
						],
						failureConsequence: "If shorted, draws excessive current and blows input fuse F1",
					},
					{
						name: "Bulk Smoothing Capacitor",
						designator: "C1",
						quantity: 1,
						purpose: "Filters rectified 100Hz/120Hz AC ripple into DC bus",
						details: [
							"Connected across bridge rectifier DC output terminals",
							"Rated 400V, 150µF 105°C low-ESR electrolytic",
						],
						failureConsequence: "If open, causes high DC bus ripple and controller resets",
					},
				],
			};

			const normalized = normalizeAnalysisResult(raw, "flyback.png");

			assert.strictEqual(normalized.components.length, 2);
			const q1 = normalized.components[0];
			assert.strictEqual(q1.designator, "Q1");
			assert.strictEqual(
				q1.purpose,
				"High-speed primary side switching to charge transformer magnetic core",
			);
			assert.ok(Array.isArray(q1.details));
			assert.strictEqual(q1.details?.length, 3);
			assert.strictEqual(
				q1.failureConsequence,
				"If shorted, draws excessive current and blows input fuse F1",
			);
		});

		it("should backward-compatibly synthesize purpose and details from legacy description", () => {
			const legacy: Partial<AnalysisResult> = {
				isSchematic: true,
				components: [
					{
						name: "Resistor",
						designator: "R1",
						quantity: 1,
						description: "10k ohm pull-up resistor connected to VCC",
					},
				],
			};

			const normalized = normalizeAnalysisResult(legacy);
			const r1 = normalized.components[0];

			assert.strictEqual(r1.designator, "R1");
			assert.strictEqual(r1.purpose, "10k ohm pull-up resistor connected to VCC");
			assert.deepStrictEqual(r1.details, [
				"10k ohm pull-up resistor connected to VCC",
			]);
			assert.strictEqual(r1.failureConsequence, undefined);
		});
	});

	describe("2. Operational Cycle Extraction & Fallbacks", () => {
		it("should normalize structured multi-stage operational cycle", () => {
			const raw: Partial<AnalysisResult> = {
				isSchematic: true,
				operationalCycle: [
					{
						stageNumber: 1,
						name: "Input Rectification & Inrush Limiting",
						description: "AC mains passes through NTC thermistor and bridge rectifier to charge C1",
						inputState: "230V AC RMS",
						outputState: "325V DC Unregulated Bus",
						keyComponents: ["NTC1", "BR1", "C1"],
					},
					{
						stageNumber: 2,
						name: "Primary Switching & Magnetization",
						description: "PWM controller turns Q1 ON, charging transformer T1 primary inductance",
						inputState: "325V DC Bus",
						outputState: "Increasing primary ramp current",
						keyComponents: ["U1", "Q1", "T1"],
					},
					{
						stageNumber: 3,
						name: "Flyback Energy Discharge",
						description: "Q1 turns OFF; transformer polarity reverses and dumps energy through D1",
						inputState: "Stored magnetic energy",
						outputState: "12V DC Rectified Pulse",
						keyComponents: ["T1", "D1", "C2"],
					},
					{
						stageNumber: 4,
						name: "Closed-Loop Voltage Feedback",
						description: "TL431 and optocoupler modulate PWM duty cycle to maintain steady 12V output",
						inputState: "12V DC Output Sense",
						outputState: "Feedback pin voltage modulation",
						keyComponents: ["U2", "U3"],
					},
				],
			};

			const normalized = normalizeAnalysisResult(raw);

			assert.ok(Array.isArray(normalized.operationalCycle));
			assert.strictEqual(normalized.operationalCycle?.length, 4);
			assert.strictEqual(normalized.operationalCycle?.[0].stageNumber, 1);
			assert.strictEqual(
				normalized.operationalCycle?.[0].name,
				"Input Rectification & Inrush Limiting",
			);
			assert.deepStrictEqual(normalized.operationalCycle?.[0].keyComponents, [
				"NTC1",
				"BR1",
				"C1",
			]);
		});

		it("should provide default single operational stage for legacy records missing operationalCycle", () => {
			const legacy: Partial<AnalysisResult> = {
				isSchematic: true,
				explanation: "The circuit steps down 12V to 5V using a buck switching regulator.",
			};

			const normalized = normalizeAnalysisResult(legacy);

			assert.ok(Array.isArray(normalized.operationalCycle));
			assert.strictEqual(normalized.operationalCycle?.length, 1);
			assert.strictEqual(normalized.operationalCycle?.[0].stageNumber, 1);
			assert.strictEqual(
				normalized.operationalCycle?.[0].description,
				"The circuit steps down 12V to 5V using a buck switching regulator.",
			);
		});
	});

	describe("3. Circuit Architectural Evaluation (Advantages & Disadvantages)", () => {
		it("should preserve advantages and disadvantages points", () => {
			const raw: Partial<AnalysisResult> = {
				isSchematic: true,
				tradeoffs: {
					advantages: [
						"Galvanic isolation protects downstream microcontrollers",
						"Wide input AC range (85V - 265V AC)",
						"Low standby power consumption (<100mW)",
					],
					disadvantages: [
						"High peak switch voltage stress on MOSFET Q1 requires snubber",
						"Electromagnetic interference requires dedicated input EMI filter",
						"Higher output ripple compared to linear regulators",
					],
				},
			};

			const normalized = normalizeAnalysisResult(raw);

			assert.ok(normalized.tradeoffs);
			assert.strictEqual(normalized.tradeoffs?.advantages.length, 3);
			assert.strictEqual(normalized.tradeoffs?.disadvantages.length, 3);
			assert.strictEqual(
				normalized.tradeoffs?.advantages[0],
				"Galvanic isolation protects downstream microcontrollers",
			);
		});

		it("should default empty arrays for legacy records missing tradeoffs", () => {
			const legacy: Partial<AnalysisResult> = {
				isSchematic: true,
			};

			const normalized = normalizeAnalysisResult(legacy);

			assert.ok(normalized.tradeoffs);
			assert.deepStrictEqual(normalized.tradeoffs?.advantages, []);
			assert.deepStrictEqual(normalized.tradeoffs?.disadvantages, []);
		});
	});

	describe("4. Circuit Hazards & Safety Warnings", () => {
		it("should normalize critical, warning, and caution hazard categories", () => {
			const raw: Partial<AnalysisResult> = {
				isSchematic: true,
				hazards: [
					{
						severity: "critical",
						category: "high_voltage_shock",
						location: "AC Mains Input Terminal J1 & Bridge Rectifier BR1",
						description: "Live 230V AC present across exposed copper pads with severe shock risk",
						mitigation: "Always disconnect mains and use 1:1 isolation transformer during debugging",
					},
					{
						severity: "warning",
						category: "stored_energy",
						location: "Bulk Filter Capacitor C1",
						description: "Can retain up to 350V DC lethal charge minutes after power removal",
						mitigation: "Discharge capacitor using a 10k 5W resistor before touching primary components",
					},
					{
						severity: "caution",
						category: "thermal_burn",
						location: "MOSFET Q1 Heatsink",
						description: "Heatsink reaches >75°C under sustained full load",
						mitigation: "Allow thermal cool-down period before physical inspection",
					},
				],
			};

			const normalized = normalizeAnalysisResult(raw);

			assert.ok(Array.isArray(normalized.hazards));
			assert.strictEqual(normalized.hazards?.length, 3);

			const criticalHazard = normalized.hazards?.[0];
			assert.strictEqual(criticalHazard?.severity, "critical");
			assert.strictEqual(criticalHazard?.category, "high_voltage_shock");
			assert.ok(criticalHazard?.description.includes("230V AC"));
			assert.ok(criticalHazard?.mitigation.includes("isolation transformer"));
		});

		it("should default to empty array for legacy records missing hazards", () => {
			const legacy: Partial<AnalysisResult> = {
				isSchematic: true,
			};

			const normalized = normalizeAnalysisResult(legacy);

			assert.ok(Array.isArray(normalized.hazards));
			assert.strictEqual(normalized.hazards?.length, 0);
		});
	});

	describe("5. JSON Extraction Resilience", () => {
		it("should extract JSON embedded in markdown code blocks with commentary", () => {
			const rawText = `Here is the comprehensive circuit analysis:
\`\`\`json
{
  "isSchematic": true,
  "summary": "555 Timer Astable Multivibrator",
  "components": [
    {
      "name": "555 Timer IC",
      "designator": "U1",
      "quantity": 1,
      "purpose": "Generates continuous square wave oscillation",
      "details": ["Pin 2 and 6 tied to RC timing node", "Pin 3 drives output stage"],
      "failureConsequence": "Oscillation stops"
    }
  ],
  "power": { "source": "DC Power Supply", "voltage": "9V" },
  "acRegions": [],
  "dcRegions": [{ "location": "Entire board", "reasoning": "Powered by single 9V rail" }],
  "explanation": "Generates 1kHz clock pulses.",
  "uncertainties": []
}
\`\`\`
Hope this helps your engineering project!`;

			const parsed = extractJson<Partial<AnalysisResult>>(rawText);
			assert.strictEqual(parsed.isSchematic, true);
			assert.strictEqual(parsed.summary, "555 Timer Astable Multivibrator");
			assert.strictEqual(parsed.components?.[0]?.name, "555 Timer IC");
		});

		it("should extract outermost raw JSON without code fences", () => {
			const rawText = `Analysis Output: {"isSchematic":false,"summary":"Cat photo","components":[],"power":{"source":"N/A"},"acRegions":[],"dcRegions":[],"explanation":"","uncertainties":[]}`;
			const parsed = extractJson<Partial<AnalysisResult>>(rawText);
			assert.strictEqual(parsed.isSchematic, false);
			assert.strictEqual(parsed.summary, "Cat photo");
		});
	});

	describe("6. Multi-LLM Availability Checks", () => {
		it("should inspect LLM provider configuration status across all three tiers", () => {
			const statuses = getLLMProvidersAvailability();

			assert.strictEqual(statuses.length, 3);
			const [gemini, groq, openRouter] = statuses;

			assert.strictEqual(gemini.providerName, "Google Gemini");
			assert.strictEqual(groq.providerName, "Groq LPU");
			assert.strictEqual(openRouter.providerName, "OpenRouter");

			for (const status of statuses) {
				assert.ok(typeof status.isConfigured === "boolean");
				assert.ok(
					status.status === "operational" || status.status === "unavailable",
				);
			}
		});
	});

	describe("7. AI Fallback Engine Resilience & Error Discrimination Tests (#29)", () => {
		it("should configure active production models for Google Gemini", async () => {
			const { GEMINI_CANDIDATE_MODELS } = await import("../src/lib/analyze.ts");
			assert.ok(GEMINI_CANDIDATE_MODELS.includes("gemini-2.5-flash"));
			assert.ok(GEMINI_CANDIDATE_MODELS.includes("gemini-2.0-flash"));
			assert.ok(GEMINI_CANDIDATE_MODELS.includes("gemini-1.5-flash"));
			assert.ok(GEMINI_CANDIDATE_MODELS.includes("gemini-flash-latest"));
			// Speculative non-existent versions must not be present
			assert.strictEqual(GEMINI_CANDIDATE_MODELS.includes("gemini-3.6-flash"), false);
			assert.strictEqual(GEMINI_CANDIDATE_MODELS.includes("gemini-3.8-flash"), false);
		});

		it("should exclude decommissioned preview models from Groq catalog", async () => {
			const { GROQ_CANDIDATE_MODELS } = await import("../src/lib/analyze.ts");
			assert.strictEqual(
				GROQ_CANDIDATE_MODELS.includes("llama-3.2-11b-vision-preview"),
				false,
				"Decommissioned llama-3.2-11b-vision-preview must not be in Groq candidate models",
			);
			assert.ok(GROQ_CANDIDATE_MODELS.length > 0);
		});

		it("should configure free multimodal vision models and router on OpenRouter", async () => {
			const { OPENROUTER_CANDIDATE_MODELS } = await import("../src/lib/analyze.ts");
			assert.ok(
				OPENROUTER_CANDIDATE_MODELS.includes(
					"meta-llama/llama-3.2-11b-vision-instruct:free",
				) || OPENROUTER_CANDIDATE_MODELS.includes("openrouter/free"),
			);
		});

		it("should distinguish transient model errors from fatal auth errors", () => {
			const isFatalAuth = (status: number) => status === 401 || status === 403;
			const isDecommissioned = (text: string) =>
				text.includes("model_decommissioned") || text.includes("decommissioned");
			const isUpstreamSharedRateLimit = (text: string) =>
				text.includes("upstream_provider_shared_pool") ||
				text.includes("rate-limited upstream");

			// 401/403 are fatal
			assert.strictEqual(isFatalAuth(401), true);
			assert.strictEqual(isFatalAuth(403), true);
			assert.strictEqual(isFatalAuth(400), false);
			assert.strictEqual(isFatalAuth(429), false);
			assert.strictEqual(isFatalAuth(503), false);

			// Model decommissioned is model-level (not fatal to provider)
			assert.strictEqual(
				isDecommissioned('{"code":"model_decommissioned"}'),
				true,
			);

			// Upstream shared pool 429 is model-level (not fatal to provider)
			assert.strictEqual(
				isUpstreamSharedRateLimit(
					'{"metadata":{"limit_source":"upstream_provider_shared_pool"}}',
				),
				true,
			);
		});
	});
});

