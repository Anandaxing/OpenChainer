import type React from "react";
import { useEffect, useState } from "react";
import type { Phase } from "../types";

interface ProgressStepperProps {
	phase: Phase;
}

const ROTATING_STATUS_MESSAGES = [
	"Tracing the ground rail & VCC power buses…",
	"Detecting IC designators (U1, Q1, R1)…",
	"Analyzing AC vs DC signal domain paths…",
	"Synthesizing plain-language summary & warnings…",
];

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ phase }) => {
	const [statusIndex, setStatusIndex] = useState(0);

	useEffect(() => {
		if (phase !== "analyzing") return;
		const timer = setInterval(() => {
			setStatusIndex((prev) => (prev + 1) % ROTATING_STATUS_MESSAGES.length);
		}, 1200);
		return () => clearInterval(timer);
	}, [phase]);

	const isUploading = phase === "uploading";
	const isAnalyzing = phase === "analyzing";

	return (
		<div
			className={`p-5 rounded-xl border transition-all duration-700 ${
				isUploading
					? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
					: isAnalyzing
						? "bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/30 text-violet-950 dark:text-violet-100"
						: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
			}`}
		>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span
						className={`w-2.5 h-2.5 rounded-full ${
							isUploading
								? "bg-emerald-500 animate-ping"
								: isAnalyzing
									? "bg-violet-500 animate-ping"
									: "bg-zinc-400"
						}`}
					/>
					<h3 className="text-sm font-semibold font-mono tracking-tight">
						{isUploading ? "Uploading Schematic File..." : "AI Analysis in Progress..."}
					</h3>
				</div>
				<span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
					{isUploading ? "Step 1 of 2" : "Step 2 of 2"}
				</span>
			</div>

			{/* Stepper Progress Bar */}
			<div className="flex items-center gap-3 text-xs font-mono mb-4">
				{/* Step 1: Uploading */}
				<div
					className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
						isUploading
							? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold"
							: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
					}`}
				>
					<span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold shrink-0">
						{isUploading ? "1" : "✓"}
					</span>
					<span className="truncate">Uploading</span>
				</div>

				<div
					className={`w-6 h-0.5 transition-colors duration-500 ${
						isAnalyzing ? "bg-violet-500/60" : "bg-zinc-300 dark:bg-zinc-700"
					}`}
				/>

				{/* Step 2: AI Analyzing */}
				<div
					className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
						isAnalyzing
							? "bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300 font-semibold animate-pulse"
							: "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500"
					}`}
				>
					<span
						className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 ${
							isAnalyzing
								? "bg-violet-500/20 text-violet-600 dark:text-violet-300 animate-spin"
								: "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
						}`}
					>
						{isAnalyzing ? "◐" : "2"}
					</span>
					<span className="truncate">AI Analyzing</span>
				</div>
			</div>

			{/* Subtitle / Status Message with Shimmer Pulse */}
			<div className="relative overflow-hidden rounded-lg bg-zinc-950/5 dark:bg-zinc-950/40 p-3 text-xs font-mono">
				{isAnalyzing && (
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
				)}
				<p className="relative z-10 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
					<span className={isUploading ? "text-emerald-500" : "text-violet-500"}>&gt;</span>
					{isUploading
						? "Transferring image payload to secure vision processing engine..."
						: ROTATING_STATUS_MESSAGES[statusIndex]}
				</p>
			</div>
		</div>
	);
};
