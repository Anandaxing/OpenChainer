import type React from "react";
import { useState } from "react";
import { AiOutlineMessage } from "react-icons/ai";
import { FiAlertTriangle, FiCheck, FiCopy, FiX } from "react-icons/fi";
import { LuCopyCheck, LuFileJson, LuShieldAlert } from "react-icons/lu";
import { RiLoopRightLine } from "react-icons/ri";
import type { AnalysisResult } from "../lib/types";

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
		const sections: string[] = [
			`OpenChainer Analysis - ${result.filename || "Circuit Schematic"}`,
			`Provider: ${result.provider || "AI Vision Engine"}`,
			"",
			`Summary:\n${result.summary}`,
		];

		if (result.hazards && result.hazards.length > 0) {
			sections.push(
				"",
				"Safety & Hazards:",
				...result.hazards.map(
					(h) =>
						`• [${h.severity.toUpperCase()}] ${h.location}: ${h.description} (Mitigation: ${h.mitigation})`,
				),
			);
		}

		if (result.operationalCycle && result.operationalCycle.length > 0) {
			sections.push(
				"",
				"Operational Cycle:",
				...result.operationalCycle.map(
					(s) => `• Stage ${s.stageNumber} (${s.name}): ${s.description}`,
				),
			);
		}

		if (
			result.tradeoffs &&
			(result.tradeoffs.advantages.length > 0 ||
				result.tradeoffs.disadvantages.length > 0)
		) {
			sections.push("", "Circuit Evaluation:");
			if (result.tradeoffs.advantages.length > 0) {
				sections.push(
					"Advantages:",
					...result.tradeoffs.advantages.map((a) => `  + ${a}`),
				);
			}
			if (result.tradeoffs.disadvantages.length > 0) {
				sections.push(
					"Disadvantages:",
					...result.tradeoffs.disadvantages.map((d) => `  - ${d}`),
				);
			}
		}

		sections.push(
			"",
			"Identified Components:",
			...result.components.map((c) => {
				const purposeStr = c.purpose ? ` — Purpose: ${c.purpose}` : "";
				return `• ${c.designator}: ${c.name}${purposeStr}`;
			}),
		);

		if (result.powerSource) {
			sections.push(
				"",
				`Power Source: ${result.powerSource.type} (${result.powerSource.voltage})`,
			);
		}

		navigator.clipboard.writeText(sections.join("\n"));
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

	const hasHazards = Boolean(result.hazards && result.hazards.length > 0);
	const hasOperationalCycle = Boolean(
		result.operationalCycle && result.operationalCycle.length > 0,
	);
	const hasTradeoffs = Boolean(
		result.tradeoffs &&
			(result.tradeoffs.advantages.length > 0 ||
				result.tradeoffs.disadvantages.length > 0),
	);

	return (
		<div className="space-y-6">
			{/* Panel Header & Cache / Provider Badge */}
			<div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							Schematic Analysis Report
						</h2>
						{result.isCached && (
							<span className="px-2.5 py-0.5 text-[11px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
								⚡ Served from cache
							</span>
						)}
						{result.provider && (
							<span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-md">
								{result.provider}
							</span>
						)}
					</div>
					<p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
						ID: {result.id} · Analyzed{" "}
						{new Date(result.analyzedAt || Date.now()).toLocaleTimeString()}
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
							className="flex items-center gap-[4px] px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-300 dark:border-emerald-500/30 min-h-[44px]"
						>
							<RiLoopRightLine /> Reanalyze
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

			{/* SECTION 2 (NEW): High Priority Safety Hazard Detection */}
			{hasHazards && (
				<section className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-400/80 dark:border-rose-500/50 space-y-3 shadow-sm dark:shadow-none">
					<div className="flex items-center justify-between">
						<h3 className="text-xs font-mono uppercase tracking-wider text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1.5">
							<LuShieldAlert className="text-rose-600 dark:text-rose-400 text-base" />
							<span>Safety & Hazard Warnings ({result.hazards?.length})</span>
						</h3>
						<span className="text-[10px] font-mono font-bold uppercase bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-700">
							Action Required
						</span>
					</div>

					<div className="grid grid-cols-1 gap-2.5">
						{result.hazards?.map((hazard, idx) => {
							const isCritical = hazard.severity === "critical";
							const isWarning = hazard.severity === "warning";
							const badgeBg = isCritical
								? "bg-rose-600 text-white"
								: isWarning
									? "bg-amber-600 text-white"
									: "bg-yellow-600 text-white";

							return (
								<div
									key={`hazard-${idx}-${hazard.location}`}
									className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 space-y-1.5"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span
												className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${badgeBg}`}
											>
												{hazard.severity}
											</span>
											<span className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
												{hazard.location}
											</span>
										</div>
									</div>

									<p className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
										{hazard.description}
									</p>

									<div className="pt-1 text-[11px] font-mono text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
										<span className="font-bold shrink-0">Mitigation:</span>
										<span>{hazard.mitigation}</span>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* SECTION 3 (ENHANCED): How This Circuit Operates — Operational Cycle */}
			<section className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm dark:shadow-none">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1.5">
						<span>🔄</span> How This Circuit Operates (Operational Cycle)
					</h3>
					{hasOperationalCycle && (
						<span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
							{result.operationalCycle?.length} Stages
						</span>
					)}
				</div>

				{hasOperationalCycle ? (
					<div className="space-y-3">
						<div className="grid grid-cols-1 gap-2.5">
							{result.operationalCycle?.map((stage) => (
								<div
									key={`stage-${stage.stageNumber}-${stage.name}`}
									className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
												{stage.stageNumber}
											</span>
											<span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
												{stage.name}
											</span>
										</div>

										{stage.keyComponents && stage.keyComponents.length > 0 && (
											<div className="flex flex-wrap items-center gap-1">
												{stage.keyComponents.map((compKey) => (
													<span
														key={compKey}
														className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800"
													>
														{compKey}
													</span>
												))}
											</div>
										)}
									</div>

									<p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
										{stage.description}
									</p>

									{(stage.inputState || stage.outputState) && (
										<div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
											{stage.inputState && (
												<span className="bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
													In: {stage.inputState}
												</span>
											)}
											{stage.inputState && stage.outputState && <span>→</span>}
											{stage.outputState && (
												<span className="bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
													Out: {stage.outputState}
												</span>
											)}
										</div>
									)}
								</div>
							))}
						</div>

						<div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] font-mono text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
							<span>🔁</span>
							<span>
								Closed-Loop Feedback: The operational cycle continuously regulates voltage, current, and stability under dynamic load changes.
							</span>
						</div>
					</div>
				) : (
					<p className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
						{result.educationDetail}
					</p>
				)}
			</section>

			{/* SECTION 4 (NEW): Circuit Evaluation — Advantages vs Disadvantages */}
			{hasTradeoffs && (
				<section className="space-y-2">
					<h3 className="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
						<span>⚖️</span> Circuit Architectural Evaluation
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{/* Advantages Card */}
						<div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-500/30 space-y-2">
							<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400">
								<FiCheck className="text-sm font-bold" />
								<span>Engineering Advantages</span>
							</div>
							<ul className="space-y-1.5 pl-1">
								{result.tradeoffs?.advantages.map((adv, idx) => (
									<li
										key={`adv-${idx}-${adv.slice(0, 15)}`}
										className="text-xs text-emerald-950 dark:text-emerald-200/90 flex items-start gap-2"
									>
										<span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
											•
										</span>
										<span>{adv}</span>
									</li>
								))}
							</ul>
						</div>

						{/* Disadvantages Card */}
						<div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-500/30 space-y-2">
							<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-800 dark:text-amber-400">
								<FiX className="text-sm font-bold" />
								<span>Trade-offs & Constraints</span>
							</div>
							<ul className="space-y-1.5 pl-1">
								{result.tradeoffs?.disadvantages.map((dis, idx) => (
									<li
										key={`dis-${idx}-${dis.slice(0, 15)}`}
										className="text-xs text-amber-950 dark:text-amber-200/90 flex items-start gap-2"
									>
										<span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">
											•
										</span>
										<span>{dis}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</section>
			)}

			{/* SECTION 5 (ENHANCED): Components list with explicit Purpose & Points */}
			<section className="space-y-2.5">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
						<span>🧩</span> Identified Components ({result.components.length})
					</h3>
					<span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
						Purpose & Details
					</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{result.components.map((comp) => (
						<div
							key={comp.designator || comp.name}
							className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm dark:shadow-none"
						>
							<div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
								<div className="flex items-center gap-2">
									<span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
										{comp.designator || "—"}
									</span>
									<span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
										{comp.name}
									</span>
								</div>

								{comp.quantity && comp.quantity > 1 && (
									<span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
										Qty: {comp.quantity}
									</span>
								)}
							</div>

							{comp.purpose && (
								<div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
									<span className="font-semibold text-emerald-800 dark:text-emerald-400 font-mono text-[11px] block">
										Purpose:
									</span>
									<p>{comp.purpose}</p>
								</div>
							)}

							{comp.details && comp.details.length > 0 && (
								<ul className="space-y-1 pl-1 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400 font-sans">
									{comp.details.map((detail, dIdx) => (
										<li
											key={`detail-${dIdx}-${detail.slice(0, 10)}`}
											className="flex items-start gap-1.5"
										>
											<span className="text-zinc-400 dark:text-zinc-500 font-bold shrink-0">
												•
											</span>
											<span>{detail}</span>
										</li>
									))}
								</ul>
							)}

							{comp.failureConsequence && (
								<div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-amber-700 dark:text-amber-400 flex items-start gap-1">
									<span className="font-bold shrink-0">Failure Risk:</span>
									<span>{comp.failureConsequence}</span>
								</div>
							)}
						</div>
					))}
				</div>
			</section>

			{/* SECTION 6: Power source */}
			<section className="p-3.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2.5">
					<span className="text-lg">🔌</span>
					<div>
						<div className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">
							Power Source Requirements
						</div>
						<div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{result.powerSource?.type || result.power?.source || "Standard DC Rail"}
						</div>
					</div>
				</div>
				<div className="px-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
					{result.powerSource?.voltage || result.power?.voltage || "N/A"}
				</div>
			</section>

			{/* SECTION 7: AC/DC map */}
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
							{result.acDcMap?.acDetails || "No AC domains identified."}
						</p>
					</div>

					{/* Sky DC Card */}
					<div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-300 dark:border-sky-500/30 space-y-1">
						<div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-700 dark:text-sky-400">
							<span>🔋</span> DC Domain Stage
						</div>
						<p className="text-xs text-sky-950 dark:text-sky-200/90 leading-relaxed font-sans">
							{result.acDcMap?.dcDetails || "Standard direct current logic rails."}
						</p>
					</div>
				</div>
			</section>

			{/* SECTION 8: ⚠ "CHECK THIS" uncertainty list */}
			{result.uncertainties && result.uncertainties.length > 0 && (
				<section className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-500/50 space-y-2">
					<div className="flex items-center justify-between">
						<h3 className="text-xs font-mono uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1.5">
							<FiAlertTriangle />
							<span>CHECK THIS — AI Verification Caveats</span>
						</h3>
						<span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
							ALWAYS VISIBLE
						</span>
					</div>
					<ul className="space-y-1.5 pl-1">
						{result.uncertainties.map((warning, idx) => (
							<li
								key={`unc-${idx}-${warning.slice(0, 15)}`}
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
			)}

			{/* SECTION 9: Actions */}
			<section className="flex flex-wrap items-center justify-between gap-3 pt-2">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleCopySummary}
						className="cursor-pointer px-3 py-2 rounded-lg bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors min-h-[44px] shadow-sm dark:shadow-none"
					>
						{copied ? (
							<>
								<LuCopyCheck /> Copied
							</>
						) : (
							<>
								<FiCopy /> Copy Analysis
							</>
						)}
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
						<span className="flex items-center gap-[4px]">
							<AiOutlineMessage /> Ask AI Assistant
						</span>
						<span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
							Coming soon...
						</span>
					</button>
				</div>
			</section>
		</div>
	);
};

