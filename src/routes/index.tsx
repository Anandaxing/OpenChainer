import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnalyzingPreview } from "../components/AnalyzingPreview";
import { ErrorCard } from "../components/ErrorCard";
import { Header } from "../components/Header";
import { HistoryStrip } from "../components/HistoryStrip";
import { ProgressStepper } from "../components/ProgressStepper";
import { ResultPanel } from "../components/ResultSections";
import { UploadZone } from "../components/UploadZone";
// DUMMY TEST DATA IMPORTS (Clearly highlighted for easy tracing and backend swapping)
import {
	DUMMY_NON_SCHEMATIC_ANALYSIS_RESULT,
	DUMMY_SCHEMATIC_ANALYSIS_RESULT,
} from "../dummies/mockData";
import type { AnalysisResult, AnalysisState, HistoryEntry, Phase } from "../types";

import {
	clearLocalHistory,
	getLocalHistory,
	saveToLocalHistory,
} from "../utils/history";

export const Route = createFileRoute("/")({ component: DashboardPage });

function DashboardPage() {
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

	// Load history on mount
	useEffect(() => {
		setHistory(getLocalHistory());
	}, []);

	// Create preview URL when file/source selected
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

	// Simulated analysis flow (idle -> file_selected -> uploading -> analyzing -> success/error)
	const runAnalysis = async (sourceToAnalyze: File | string | null) => {
		if (!sourceToAnalyze) return;

		setState("uploading");

		// Simulate upload delay
		setTimeout(() => {
			setState("analyzing");

			// Simulate analysis delay
			setTimeout(async () => {
				// If file name has 'non-schematic' or 'photo', use DUMMY_NON_SCHEMATIC_ANALYSIS_RESULT
				const isPhoto =
					typeof sourceToAnalyze !== "string" &&
					sourceToAnalyze.name.toLowerCase().includes("photo");

				if (isPhoto) {
					// Trigger non-schematic photo error card using DUMMY_NON_SCHEMATIC_ANALYSIS_RESULT
					setIsNonSchematicError(true);
					setErrorMessage(DUMMY_NON_SCHEMATIC_ANALYSIS_RESULT.summary);
					setState("error");
					return;
				}

				// Trace dummy variable call: DUMMY_SCHEMATIC_ANALYSIS_RESULT
				const result: AnalysisResult = {
					...DUMMY_SCHEMATIC_ANALYSIS_RESULT,
					id: `res-${Date.now().toString(36)}`,
					filename:
						typeof sourceToAnalyze === "string"
							? "sample_schematic.svg"
							: sourceToAnalyze.name,
					analyzedAt: new Date().toISOString(),
					imageUrl: previewUrl || DUMMY_SCHEMATIC_ANALYSIS_RESULT.imageUrl,
					isCached: false,
				};

				setAnalysisResult(result);
				setState("success");

				// Save to localStorage history (capped at 10 items)
				const updatedHistory = await saveToLocalHistory(
					result,
					sourceToAnalyze,
				);
				setHistory(updatedHistory);
			}, 2200);
		}, 800);
	};

	const handleClearHistory = () => {
		clearLocalHistory();
		setHistory([]);
	};

	const handleSelectHistoryEntry = (entry: HistoryEntry) => {
		setPreviewUrl(entry.thumbnailUrl);
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
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col pcb-grid-pattern transition-colors">
			<Header />

			{/* Main Single-Page Dashboard Container */}
			<main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
				{/* State 1: IDLE - Upload Zone + History */}
				{state === "idle" && (
					<div className="max-w-3xl mx-auto space-y-6">
						<UploadZone
							onFileSelect={(file) => {
								handleSelectFile(file);
								// Auto trigger analysis
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
						{/* LEFT COLUMN (Desktop 4/12 = 1/3 width): Image Preview & State Machine Control */}
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

						{/* RIGHT COLUMN (Desktop 8/12 = 2/3 width): Results Panel / Error State */}
						<div className="lg:col-span-8 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1">
							{state === "success" && analysisResult && (
								<div className="space-y-4">
									<ResultPanel
										result={analysisResult}
										onReanalyze={() => runAnalysis(selectedSource)}
										onChangeFile={resetToIdle}
									/>

									{/* Dev Callout explicitly highlighting the dummy variable called */}
									<div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between shadow-sm dark:shadow-none">
										<span>
											Active Data Source:{" "}
											<code className="text-emerald-700 dark:text-emerald-400">
												DUMMY_SCHEMATIC_ANALYSIS_RESULT
											</code>
										</span>
										<span className="text-zinc-500 dark:text-zinc-500">
											src/dummies/mockData.ts
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
									onTryAgain={() => runAnalysis(selectedSource)}
									onChooseAnother={resetToIdle}
								/>
							)}
						</div>
					</div>
				)}
			</main>

			{/* Global Footer */}
			<footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
				OpenChainer &copy; {new Date().getFullYear()} — Open Schematic Analysis
				Workbench
			</footer>
		</div>
	);
}
