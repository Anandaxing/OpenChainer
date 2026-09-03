import { createHash } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { analyzeSchematic, normalizeAnalysisResult } from "../../lib/analyze";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/api/analyze")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				try {
					// 🛡️ Rate Limiting: 10 requests / minute per IP
					const clientIp = getClientIp(request);
					const { allowed, retryAfter } = checkRateLimit(clientIp);

					if (!allowed) {
						console.warn(
							`[RateLimit] Blocked request from IP ${clientIp}. Retry after ${retryAfter}s.`,
						);
						return Response.json(
							{
								error: "Too many requests. Please wait before trying again.",
								retryAfter,
							},
							{
								status: 429,
								headers: {
									"Retry-After": String(retryAfter),
								},
							},
						);
					}

					const formData = await request.formData();
					const image = formData.get("image");

					if (!image || !(image instanceof File)) {
						return Response.json(
							{ error: "No schematic image file provided" },
							{ status: 400 },
						);
					}

					if (image.size > 10 * 1024 * 1024) {
						return Response.json(
							{ error: "File exceeds maximum 10MB limit" },
							{ status: 413 },
						);
					}

					const arrayBuffer = await image.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);

					// 🆕 1. Hash the image CONTENT
					const imageHash = createHash("sha256").update(buffer).digest("hex");

					// 🆕 2. Cache lookup — before calling Gemini
					const { data: cached, error: lookupError } = await supabase
						.from("analyses")
						.select("result")
						.eq("image_hash", imageHash)
						.maybeSingle();

					if (lookupError) {
						console.error("Cache lookup failed:", lookupError);
						// don't fail the request — just treat as a miss
					}

					if (cached) {
						return Response.json({ ...cached.result, isCached: true });
					}

					// 3. Cache miss → Gemini
					const base64 = buffer.toString("base64");
					const result = await analyzeSchematic(base64, image.type);

					const formattedSize =
						image.size < 1024 * 1024
							? `${(image.size / 1024).toFixed(1)} KB`
							: `${(image.size / (1024 * 1024)).toFixed(1)} MB`;

					const normalized = normalizeAnalysisResult(result, image.name);
					normalized.fileSizeFormatted = formattedSize;
					normalized.filename = image.name;
					normalized.analyzedAt = new Date().toISOString();

					// 🆕 4. Save to cache (non-fatal on failure)
					const { error: insertError } = await supabase
						.from("analyses")
						.insert({ image_hash: imageHash, result: normalized });

					if (insertError) {
						console.error("Cache write failed:", insertError);
					}

					return Response.json({ ...normalized, isCached: false });
				} catch (err: unknown) {
					console.error("Schematic analysis handler error:", err);
					const message =
						err instanceof Error
							? err.message
							: "Analysis failed. Please try again.";
					return Response.json({ error: message }, { status: 500 });
				}
			},
		},
	},
});
