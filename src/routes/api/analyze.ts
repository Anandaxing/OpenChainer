import { createHash } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { analyzeSchematic, normalizeAnalysisResult } from "../../lib/analyze";
import { checkRateLimit, getClientIp } from "../../lib/rateLimit";
import { logErrorOnce, logWarningOnce } from "../../lib/serverLogger";
import { supabase } from "../../lib/supabase";

async function withTimeout<T>(
	promise: PromiseLike<T>,
	ms: number,
	fallback: T,
): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<T>((resolve) => {
		timer = setTimeout(() => resolve(fallback), ms);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}

export const Route = createFileRoute("/api/analyze")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				try {
					// 🛡️ Rate Limiting: 10 requests / minute per IP
					const clientIp = getClientIp(request);
					const { allowed, retryAfter } = checkRateLimit(clientIp);

					if (!allowed) {
						logWarningOnce(
							`rate-limit-${clientIp}`,
							`Blocked request from IP ${clientIp}. Retry after ${retryAfter}s.`,
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

					let formData: FormData;
					try {
						formData = await request.formData();
					} catch {
						return Response.json(
							{
								error:
									"Failed to parse upload form data. The image may be corrupted or oversized.",
							},
							{ status: 400 },
						);
					}

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

					// 🆕 2. Cache lookup — before calling Gemini (enforce 7-day TTL cutoff with 3s timeout)
					const sevenDaysCutoff = new Date(
						Date.now() - 7 * 24 * 60 * 60 * 1000,
					).toISOString();

					const { data: cached, error: lookupError } = await withTimeout(
						supabase
							.from("analyses")
							.select("result")
							.eq("image_hash", imageHash)
							.gte("created_at", sevenDaysCutoff)
							.maybeSingle(),
						3000,
						{ data: null, error: null },
					);

					if (lookupError) {
						logErrorOnce(
							"cache-lookup-failed",
							"Cache lookup failed:",
							lookupError,
						);
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

					// 🆕 4. Save to cache (conflict-safe upsert, non-fatal on failure, 3s timeout)
					const { error: insertError } = await withTimeout(
						supabase
							.from("analyses")
							.upsert(
								{ image_hash: imageHash, result: normalized },
								{ onConflict: "image_hash" },
							),
						3000,
						{ error: null },
					);

					if (insertError) {
						logErrorOnce(
							"cache-write-failed",
							"Cache write failed:",
							insertError,
						);
					}

					return Response.json({ ...normalized, isCached: false });
				} catch (err: unknown) {
					const message =
						err instanceof Error
							? err.message
							: "Analysis failed. Please try again.";
					logErrorOnce(
						`handler-error-${message}`,
						"Schematic analysis handler error:",
						err,
					);
					return Response.json({ error: message }, { status: 500 });
				}
			},
		},
	},
});
