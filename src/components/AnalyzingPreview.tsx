import type React from "react";
import { useEffect, useState } from "react";

interface AnalyzingPreviewProps {
	previewUrl: string;
	filename?: string;
}

const ROTATING_STATUS_MESSAGES = [
	"Tracing the ground rail & VCC power buses…",
	"Detecting IC designators (U1, Q1, R1)…",
	"Analyzing AC vs DC signal domain paths…",
	"Synthesizing plain-language summary & warnings…",
];

export const AnalyzingPreview: React.FC<AnalyzingPreviewProps> = ({
	previewUrl,
	filename = "schematic_input.png",
}) => {
	const [statusIndex, setStatusIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setStatusIndex((prev) => (prev + 1) % ROTATING_STATUS_MESSAGES.length);
		}, 900);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="space-y-4">
			{/* Locked Image Preview Box with Laser Scan Animation */}
			<div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl max-h-[380px] flex items-center justify-center">
				<img
					src={previewUrl}
					alt={filename}
					className="w-full h-full object-contain max-h-[380px] opacity-90 dark:opacity-85 filter contrast-105"
				/>

				{/* Animated Laser Scanning Overlay Line */}
				<div className="absolute inset-x-0 h-1 bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_15px_#10b981] animate-scan-line z-10 pointer-events-none" />

				{/* Semi-transparent overlay */}
				<div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />

				{/* Filename Tag */}
				<div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-md bg-white/90 dark:bg-zinc-950/80 backdrop-blur text-[11px] font-mono text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
					{filename}
				</div>
			</div>

			{/* Progress Stepper & Rotating Status Banner */}
			<div className="p-4 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm dark:shadow-none">
				<div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
					<span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
						<span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
						AI Schematic Processing
					</span>
					<span>75%</span>
				</div>

				{/* Progress Stepper Indicators */}
				<div className="flex items-center gap-2 text-xs">
					<div className="flex-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
						<span className="font-bold">✓</span>
						<span>Upload</span>
					</div>
					<div className="w-6 h-px bg-emerald-500/50" />
					<div className="flex-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
						<span className="animate-spin text-emerald-500 dark:text-emerald-400">
							◐
						</span>
						<span>Scan</span>
					</div>
					<div className="w-6 h-px bg-zinc-300 dark:bg-zinc-700" />
					<div className="flex-1 flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
						<span>○</span>
						<span>Parse</span>
					</div>
				</div>

				{/* Status Message */}
				<p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 min-h-[20px] transition-all">
					<span className="text-emerald-600 dark:text-emerald-400 mr-1">
						&gt;
					</span>
					{ROTATING_STATUS_MESSAGES[statusIndex]}
				</p>
			</div>
		</div>
	);
};
