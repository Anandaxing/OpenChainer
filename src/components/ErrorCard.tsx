import type React from "react";

interface ErrorCardProps {
	errorMessage: string;
	actionableTip?: string;
	isNonSchematic?: boolean;
	onTryAgain: () => void;
	onChooseAnother: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
	errorMessage,
	actionableTip = "Ensure your photo is taken directly under bright light with high contrast line visibility.",
	isNonSchematic = false,
	onTryAgain,
	onChooseAnother,
}) => {
	return (
		<div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-500/30 space-y-4 shadow-sm dark:shadow-none">
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold shrink-0">
					{isNonSchematic ? "📷" : "⚠"}
				</div>
				<div className="space-y-1">
					<h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
						{isNonSchematic
							? "Non-Schematic Image Detected"
							: "Analysis Failed"}
					</h3>
					<p className="text-sm text-red-600 dark:text-red-300/90">
						{errorMessage}
					</p>
				</div>
			</div>

			{/* Actionable Tip Box */}
			<div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1">
				<div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
					💡 Photo Tip / Recommended Action
				</div>
				<p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
					{actionableTip}
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
					onClick={onTryAgain}
					className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors min-h-[44px]"
				>
					🔄 Try Again
				</button>
				<button
					type="button"
					onClick={onChooseAnother}
					className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-300 dark:border-zinc-700 min-h-[44px]"
				>
					📁 Choose Another File
				</button>
			</div>
		</div>
	);
};
