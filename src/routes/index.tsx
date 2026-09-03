import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnalyzingPreview } from "../components/AnalyzingPreview";
import { ErrorCard } from "../components/ErrorCard";
import { HistoryStrip } from "../components/HistoryStrip";
import { LandingFooter } from "../components/landing/LandingFooter";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingVisuals } from "../components/landing/LandingVisuals";
import { ProgressStepper } from "../components/ProgressStepper";
import { ResultPanel } from "../components/ResultSections";
import { UploadZone } from "../components/UploadZone";
import { DUMMY_SCHEMATIC_ANALYSIS_RESULT } from "../dummies/mockData";
import type { AnalysisResult, AnalysisState, HistoryEntry } from "../types";
import {
	clearLocalHistory,
	getLocalHistory,
	saveToLocalHistory,
} from "../utils/history";

export const Route = createFileRoute("/")({ component: SinglePageApp });

function SinglePageApp() {
	// Landing page entrance animation state
	const [isVisible, setIsVisible] = useState(false);

	// Analyzer state machine state
	const [state, setState] = useState<AnalysisState>("idle");
	const [selectedSource, setSelectedSource] = useState<File | string | null>(
		null,
	);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [filename, setFilename] = useState<string>("schematic_upload.png");
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
		null,
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isNonSchematicError, setIsNonSchematicError] = useState(false);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [retryCountdown, setRetryCountdown] = useState<number>(0);

	// Mount entrance animation & load history
	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), 50);
		setHistory(getLocalHistory());
		return () => clearTimeout(timer);
	}, []);

	// Real-time countdown timer for rate-limiting
	useEffect(() => {
		if (retryCountdown <= 0) return;
		const timer = setInterval(() => {
			setRetryCountdown((prev) => Math.max(0, prev - 1));
		}, 1000);
		return () => clearInterval(timer);
	}, [retryCountdown]);

	// Convert base64 data URL string to a File object for re-analysis via API
	const dataUrlToFile = async (
		dataUrl: string,
		defaultFilename = "schematic.png",
	): Promise<File> => {
		const res = await fetch(dataUrl);
		const blob = await res.blob();
		return new File([blob], defaultFilename, {
			type: blob.type || "image/png",
		});
	};

	// Select image source for analysis
	const handleSelectFile = (source: File | string) => {
		setSelectedSource(source);
		setErrorMessage(null);
		setIsNonSchematicError(false);

		if (typeof source === "string") {
			setPreviewUrl(source);
			setFilename("sample_schematic.svg");
		} else {
			setFilename(source.name);
			const url = URL.createObjectURL(source);
			setPreviewUrl(url);
		}

		setState("file_selected");
	};

	// Execute analysis flow via /api/analyze
	const runAnalysis = async (sourceToAnalyze: File | string | null) => {
		if (!sourceToAnalyze) return;

		setState("uploading");
		setErrorMessage(null);
		setIsNonSchematicError(false);

		try {
			let result: AnalysisResult;
			let fileToUpload: File | null = null;

			if (sourceToAnalyze instanceof File) {
				fileToUpload = sourceToAnalyze;
			} else if (
				typeof sourceToAnalyze === "string" &&
				sourceToAnalyze.startsWith("data:")
			) {
				fileToUpload = await dataUrlToFile(
					sourceToAnalyze,
					filename || "schematic.png",
				);
			}

			if (fileToUpload) {
				setState("analyzing");
				const formData = new FormData();
				formData.append("image", fileToUpload);

				const res = await fetch("/api/analyze", {
					method: "POST",
					body: formData,
				});

				const data = await res.json();
				if (!res.ok) {
					if (res.status === 429) {
						const retrySeconds = Number(
							data.retryAfter || res.headers.get("Retry-After") || 60,
						);
						setRetryCountdown(retrySeconds);
						throw new Error(
							`Too many requests. Please wait ${retrySeconds} second${Number(retrySeconds) === 1 ? "" : "s"} before analyzing another schematic.`,
						);
					}
					throw new Error(
						data.error || `Analysis failed (Status ${res.status})`,
					);
				}
				result = data;
			} else {
				// Sample preset image fallback
				setState("analyzing");
				await new Promise((resolve) => setTimeout(resolve, 800));
				result = {
					...DUMMY_SCHEMATIC_ANALYSIS_RESULT,
					id: `res-${Date.now().toString(36)}`,
					filename: "sample_schematic.svg",
					analyzedAt: new Date().toISOString(),
					imageUrl: previewUrl || DUMMY_SCHEMATIC_ANALYSIS_RESULT.imageUrl,
					isCached: false,
					cached: false,
					provider: "Sample Preset (Demo)",
				};
			}

			if (!result.isSchematic) {
				setIsNonSchematicError(true);
				setErrorMessage(
					result.summary ||
						"The uploaded image does not appear to be a valid schematic or PCB layout.",
				);
				setState("error");
				return;
			}

			result.imageUrl = previewUrl || result.imageUrl || "";
			setAnalysisResult(result);
			setState("success");

			const updatedHistory = await saveToLocalHistory(result, sourceToAnalyze);
			setHistory(updatedHistory);
		} catch (err: unknown) {
			console.error("Analysis failed:", err);
			setIsNonSchematicError(false);
			setErrorMessage(
				err instanceof Error
					? err.message
					: "Failed to analyze schematic image.",
			);
			setState("error");
		}
	};

	const handleClearHistory = () => {
		clearLocalHistory();
		setHistory([]);
	};

	const handleSelectHistoryEntry = (entry: HistoryEntry) => {
		const source = entry.thumbnailUrl || entry.result.imageUrl || "";
		setSelectedSource(source);
		setPreviewUrl(source);
		setFilename(entry.filename);
		setAnalysisResult(entry.result);
		setState("success");
	};

	const resetToIdle = () => {
		setState("idle");
		setSelectedSource(null);
		setPreviewUrl(null);
		setAnalysisResult(null);
		setErrorMessage(null);
		setIsNonSchematicError(false);
	};

	return (
		<div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col pcb-grid-pattern transition-colors">
			<LandingHeader />

			{/* SECTION 1: Top Hero & Visual Showcase Landing Page (Full Viewport) */}
			<section className="min-h-[calc(65vh-4rem)] flex items-center justify-center max-w-7xl w-full mx-auto p-6 sm:p-8 lg:p-12 border-b border-zinc-200/60 dark:border-zinc-800/60">
				<div
					className={`w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 transform ${
						isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
					}`}
				>
					{/* Left Column: Hero Text & CTAs */}
					<div className="flex justify-center lg:justify-start">
						<LandingHero />
					</div>

					{/* Right Column: Visual Showcase */}
					<div className="flex justify-center lg:justify-end">
						<LandingVisuals />
					</div>
				</div>
			</section>

			{/* SECTION 2: Bottom Workbench & Schematic Analyzer */}
			<section
				id="workspace"
				className="w-full max-w-7xl mx-auto p-6 sm:p-8 lg:p-12 scroll-mt-16 min-h-[90vh]"
			>
				<div className="text-center space-y-2 mb-8">
					<h2 className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
						Schematic Analysis Workbench
					</h2>
					<p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
						Select and upload your circuit diagram below to trigger instant AI
						parsing.
					</p>
				</div>

				{/* State 1: IDLE - Upload Zone + History */}
				{state === "idle" && (
					<div className="max-w-3xl mx-auto space-y-6">
						<UploadZone
							onFileSelect={(file) => {
								handleSelectFile(file);
								runAnalysis(file);
							}}
							onError={(err) => {
								setErrorMessage(err);
								setState("error");
							}}
						/>

						<HistoryStrip
							entries={history}
							onSelectEntry={handleSelectHistoryEntry}
							onClearHistory={handleClearHistory}
						/>
					</div>
				)}

				{/* State 2, 3, 4: FILE_SELECTED / UPLOADING / ANALYZING / SUCCESS / ERROR */}
				{state !== "idle" && (
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
						{/* LEFT COLUMN: Image Preview & State Machine Control */}
						<div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
							{previewUrl && (
								<div className="space-y-3">
									{state === "analyzing" || state === "uploading" ? (
										<div className="space-y-4">
											<AnalyzingPreview
												previewUrl={previewUrl}
												filename={filename}
											/>
											<ProgressStepper phase={state} />
										</div>
									) : (
										<div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-lg">
											<div className="relative max-h-[340px] flex items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-950">
												<img
													src={previewUrl}
													alt={filename}
													className="w-full h-full object-contain max-h-[340px]"
												/>
											</div>
											<div className="p-3 flex items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800/80 mt-2">
												<div className="truncate">
													<p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
														{filename}
													</p>
													<p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
														Image Loaded
													</p>
												</div>
												<div className="flex items-center gap-1.5 shrink-0">
													<button
														type="button"
														onClick={resetToIdle}
														className="px-2.5 py-1 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 rounded border border-zinc-300 dark:border-zinc-700 min-h-[44px]"
													>
														Change
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
							)}

							{/* Mobile Sticky CTA Trigger */}
							{state === "file_selected" && (
								<div className="fixed bottom-0 inset-x-0 p-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 z-50 lg:static lg:bg-transparent lg:border-0 lg:p-0">
									<button
										type="button"
										onClick={() => runAnalysis(selectedSource)}
										className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all min-h-[44px] flex items-center justify-center gap-2"
									>
										⚡ Analyze Schematic Now
									</button>
								</div>
							)}
						</div>

						{/* RIGHT COLUMN: Results Panel / Error State */}
						<div className="lg:col-span-8 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1">
							{state === "success" && analysisResult && (
								<div className="space-y-4">
									<ResultPanel
										result={analysisResult}
										onReanalyze={() => runAnalysis(selectedSource)}
										onChangeFile={resetToIdle}
									/>

									<div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between shadow-sm dark:shadow-none">
										<span>
											Active Provider:{" "}
											<code className="text-emerald-700 dark:text-emerald-400">
												{analysisResult.provider || "Gemini AI"}
											</code>
										</span>
										<span className="text-zinc-500 dark:text-zinc-500">
											{analysisResult.isCached || analysisResult.cached
												? "Cached (Supabase)"
												: "Live Analysis"}
										</span>
									</div>
								</div>
							)}

							{state === "error" && (
								<ErrorCard
									errorMessage={
										errorMessage ||
										"An error occurred while processing the schematic."
									}
									isNonSchematic={isNonSchematicError}
									retryCountdown={retryCountdown}
									onTryAgain={() => runAnalysis(selectedSource)}
									onChooseAnother={resetToIdle}
								/>
							)}
						</div>
					</div>
				)}
			</section>

			<LandingFooter />
		</div>
	);
}
