import type React from "react";
import { useState } from "react";
import type { AnalysisResult } from "../types";
import { FiCopy } from "react-icons/fi";
import { LuCopyCheck } from "react-icons/lu";
import { LuFileJson } from "react-icons/lu";
import { AiOutlineMessage } from "react-icons/ai";

interface ResultPanelProps {
	result: AnalysisResult;
	onReanalyze?: () => void;
	onChangeFile?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
	result,
	onReanalyze,
	onChangeFile,
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopySummary = () => {
		const text = `OpenChainer Analysis - ${result.filename}\n\nSummary:\n${result.summary}\n\nComponents:\n${result.components.map((c) => `${c.designator}: ${c.name}`).join("\n")}\n\nPower Source:\n${result.powerSource.type} (${result.powerSource.voltage})`;
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownloadJson = () => {
		const dataStr =
			"data:text/json;charset=utf-8," +
			encodeURIComponent(JSON.stringify(result, null, 2));
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", dataStr);
		downloadAnchor.setAttribute("download", `openchainer_${result.id}.json`);
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		downloadAnchor.remove();
	};

	if (!result.isSchematic) {
		return (
			<div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 text-center space-y-4">
				<div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
					⚠️
				</div>
				<div className="space-y-1">
					<h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
						This doesn't look like a schematic
					</h3>
					<p className="text-xs text-amber-800 dark:text-amber-300/90 max-w-md mx-auto">
						{result.summary}
					</p>
				</div>
				{onChangeFile && (
					<button
						type="button"
						onClick={onChangeFile}
						className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors min-h-[44px]"
					>
						Try another image
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Panel Header & Cache Badge */}
			<div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							Schematic Analysis Report
						</h2>
						{result.isCached && (
							<span className="px-2.5 py-0.5 text-[11px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
								⚡ Served from cache
							</span>
						)}
					</div>
					<p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
						ID: {result.id} · Analyzed{" "}
						{new Date(result.analyzedAt).toLocaleTimeString()}
					</p>
				</div>

				<div className="flex items-center gap-2">
					{onChangeFile && (
						<button
							type="button"
							onClick={onChangeFile}
							className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700 min-h-[44px]"
						>
							Choose another
						</button>
					)}
					{onReanalyze && (
						<button
							type="button"
							onClick={onReanalyze}
							className="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-500/30 min-h-[44px]"
						>
							🔄 Reanalyze
						</button>
					)}
				</div>
			</div>

			{/* SECTION 1: Plain-language summary */}
			<section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-sm dark:shadow-none">
				<h3 className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
					<span>📋</span> Circuit Overview
				</h3>
				<p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
					{result.summary}
				</p>
			</section>

			{/* SECTION 2: Components list */}
			<section className="space-y-2">
				<h3 className="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
					<span>🧩</span> Identified Components ({result.components.length})
				</h3>
				<div className="flex flex-wrap gap-2">
					{result.components.map((comp) => (
						<div
							key={comp.designator}
							className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs flex items-center gap-2 transition-colors shadow-sm dark:shadow-none"
						>
							<span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
								{comp.designator}
							</span>
							<span className="text-zinc-800 dark:text-zinc-200 font-medium">
								{comp.name}
							</span>
						</div>
					))}
				</div>
			</section>

			{/* SECTION 3: Power source */}
			<section className="p-3.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2.5">
					<span className="text-lg">🔌</span>
					<div>
						<div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">
							Power Source Requirements
						</div>
						<div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{result.powerSource.type}
						</div>
					</div>
				</div>
				<div className="px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
					{result.powerSource.voltage}
				</div>
			</section>

			{/* SECTION 4: AC/DC map */}
			<section className="space-y-2">
				<h3 className="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
					<span>⚡</span> AC / DC Domain Mapping
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{/* Amber AC Card */}
					<div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 space-y-1">
						<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
							<span>⚡</span> AC Domain Stage
						</div>
						<p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-sans">
							{result.acDcMap.acDetails}
						</p>
					</div>

					{/* Sky DC Card */}
					<div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-300 dark:border-sky-500/30 space-y-1">
						<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-700 dark:text-sky-400">
							<span>🔋</span> DC Domain Stage
						</div>
						<p className="text-xs text-sky-950 dark:text-sky-200/90 leading-relaxed font-sans">
							{result.acDcMap.dcDetails}
						</p>
					</div>
				</div>
			</section>

			{/* SECTION 5: Education detail */}
			<section className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-sm dark:shadow-none">
				<h3 className="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1.5">
					<span>🎓</span> How This Circuit Operates
				</h3>
				<p className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
					{result.educationDetail}
				</p>
			</section>

			{/* SECTION 6: ⚠ "CHECK THIS" uncertainty list */}
			<section className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-500/50 space-y-2">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-mono uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1.5">
						<span>⚠</span> CHECK THIS — AI Verification Caveats
					</h3>
					<span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
						ALWAYS VISIBLE
					</span>
				</div>
				<ul className="space-y-1.5 pl-1">
					{result.uncertainties.map((warning) => (
						<li
							key={warning.slice(0, 20)}
							className="text-xs text-amber-950 dark:text-amber-200/90 flex items-start gap-2"
						>
							<span className="text-amber-600 dark:text-amber-500 font-bold shrink-0">
								•
							</span>
							<span>{warning}</span>
						</li>
					))}
				</ul>
			</section>

			{/* SECTION 7: Actions */}
			<section className="flex flex-wrap items-center justify-between gap-3 pt-2">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleCopySummary}
						className="cursor-pointer px-3 py-2 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors min-h-[44px] shadow-sm dark:shadow-none"
					>
						{copied ? (<>
							<LuCopyCheck /> Copied
						</>) : (<>
							<FiCopy /> Copy Analysis
						</>)}
					</button>
					<button
						type="button"
						onClick={handleDownloadJson}
						className="cursor-pointer px-3 py-2 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors min-h-[44px] shadow-sm dark:shadow-none"
					>
						<LuFileJson /> Download JSON
					</button>
				</div>

				{/* Disabled Chat button */}
				<div className="relative group">
					<button
						disabled
						type="button"
						className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center gap-2 min-h-[44px]"
					>
						<span className="flex items-center gap-[4px]"><AiOutlineMessage /> Ask AI Assistant</span>
						<span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
							Coming soon...
						</span>
					</button>
				</div>
			</section>
		</div>
	);
};
