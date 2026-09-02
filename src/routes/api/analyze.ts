import { createFileRoute } from "@tanstack/react-router";
import { analyzeSchematic, normalizeAnalysisResult } from "../../lib/analyze";

export const Route = createFileRoute("/api/analyze")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
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
					const base64 = buffer.toString("base64");

					const result = await analyzeSchematic(base64, image.type);

					const formattedSize =
						image.size < 1024 * 1024
							? `${(image.size / 1024).toFixed(1)} KB`
							: `${(image.size / (1024 * 1024)).toFixed(1)} MB`;

					const normalized = normalizeAnalysisResult(result, image.name);
					normalized.fileSizeFormatted = formattedSize;
					normalized.filename = image.name;

					return Response.json(normalized);
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
