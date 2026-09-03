import type React from "react";
import { FaRegFileImage } from "react-icons/fa";
import { RiCheckLine, RiLoopRightLine, RiTimeLine } from "react-icons/ri";

interface ErrorCardProps {
	errorMessage: string;
	actionableTip?: string;
	isNonSchematic?: boolean;
	isRateLimited?: boolean;
	retryCountdown?: number;
	onTryAgain: () => void;
	onChooseAnother: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
	errorMessage,
	actionableTip = "Ensure your photo is taken directly under bright light with high contrast line visibility.",
	isNonSchematic = false,
	isRateLimited = false,
	retryCountdown = 0,
	onTryAgain,
	onChooseAnother,
}) => {
	const isCountingDown = isRateLimited && retryCountdown > 0;
	const isRateLimitReady = isRateLimited && retryCountdown === 0;

	// Determine border & background styling based on state
	let containerStyle =
		"border border-red-300 dark:border-red-500/30 bg-white dark:bg-zinc-900";
	let iconBoxStyle =
		"bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400";
	let iconNode: React.ReactNode = isNonSchematic ? "📷" : "⚠";
	let titleText = isNonSchematic
		? "Non-Schematic Image Detected"
		: "Analysis Failed";
	let descriptionText = errorMessage;

	if (isCountingDown) {
		containerStyle =
			"border border-amber-300 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10";
		iconBoxStyle =
			"bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400";
		iconNode = <RiTimeLine className="text-lg" />;
		titleText = "Rate Limit Reached";
		descriptionText = `Please wait ${retryCountdown} second${retryCountdown === 1 ? "" : "s"} before analyzing another schematic.`;
	} else if (isRateLimitReady) {
		containerStyle =
			"border border-emerald-400 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20";
		iconBoxStyle =
			"bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400";
		iconNode = <RiCheckLine className="text-lg font-bold" />;
		titleText = "Ready to Request";
		descriptionText =
			"Rate limit cooldown period complete. You are now able to make another request.";
	}

	return (
		<div
			className={`p-5 sm:p-6 rounded-xl space-y-4 shadow-sm dark:shadow-none transition-colors ${containerStyle}`}
		>
			<div className="flex items-start gap-3">
				<div
					className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${iconBoxStyle}`}
				>
					{iconNode}
				</div>
				<div className="space-y-1">
					<h3
						className={`text-base font-bold ${
							isRateLimitReady
								? "text-emerald-700 dark:text-emerald-400"
								: isCountingDown
									? "text-amber-800 dark:text-amber-300"
									: "text-zinc-900 dark:text-zinc-100"
						}`}
					>
						{titleText}
					</h3>
					<p
						className={`text-sm ${
							isRateLimitReady
								? "text-emerald-800 dark:text-emerald-300/90"
								: isCountingDown
									? "text-amber-700 dark:text-amber-300/90"
									: "text-red-600 dark:text-red-300/90"
						}`}
					>
						{descriptionText}
					</p>
				</div>
			</div>

			{/* Actionable Tip Box */}
			<div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1">
				<div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
					💡 Photo Tip / Recommended Action
				</div>
				<p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
					{isRateLimitReady
						? "Click 'Try Again' below to resubmit your schematic analysis."
						: actionableTip}
				</p>
			</div>

			{/* Non-schematic tips checklist if photo detected */}
			{isNonSchematic && (
				<div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 border-t border-zinc-200 dark:border-zinc-800 pt-3">
					<p className="font-semibold text-zinc-800 dark:text-zinc-300">
						Tips for capturing legible schematics:
					</p>
					<ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
						<li>
							Flatten folded schematic paper blueprints under clean white light
						</li>
						<li>
							Export directly from KiCad, Eagle, EasyEDA, or Altium as PNG/SVG
						</li>
						<li>Avoid glossy reflections or shadows across IC pin labels</li>
					</ul>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex flex-wrap items-center gap-3 pt-2">
				<button
					type="button"
					disabled={isCountingDown}
					onClick={onTryAgain}
					className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[44px] ${
						isCountingDown
							? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-zinc-700"
							: "cursor-pointer bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
					}`}
				>
					<RiLoopRightLine className={isCountingDown ? "animate-spin" : ""} />
					{isCountingDown ? `Try Again in ${retryCountdown}s` : "Try Again"}
				</button>
				<button
					type="button"
					onClick={onChooseAnother}
					className="cursor-pointer flex items-center gap-[4px] px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700 min-h-[44px]"
				>
					<FaRegFileImage /> Choose Another File
				</button>
			</div>
		</div>
	);
};
