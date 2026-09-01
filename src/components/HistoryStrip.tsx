import type React from "react";
import type { HistoryEntry } from "../types";

interface HistoryStripProps {
	entries: HistoryEntry[];
	onSelectEntry: (entry: HistoryEntry) => void;
	onClearHistory: () => void;
}

export const HistoryStrip: React.FC<HistoryStripProps> = ({
	entries,
	onSelectEntry,
	onClearHistory,
}) => {
	if (entries.length === 0) return null;

	return (
		<div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
			<div className="flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
				<span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
					<span>🕒</span> RECENT — this device ({entries.length}/10)
				</span>
				<button
					type="button"
					onClick={onClearHistory}
					className="text-zinc-500 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors text-[11px] underline underline-offset-2"
				>
					Clear history
				</button>
			</div>

			{/* Horizontal Scroll Strip */}
			<div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
				{entries.map((entry) => (
					<button
						key={entry.id}
						type="button"
						onClick={() => onSelectEntry(entry)}
						className="group flex-shrink-0 w-28 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm dark:shadow-none"
					>
						<div className="h-16 w-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden relative">
							<img
								src={entry.thumbnailUrl}
								alt={entry.filename}
								className="w-full h-full object-cover group-hover:scale-105 transition-transform"
							/>
							<span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 py-0.2 bg-white/90 dark:bg-zinc-950/80 text-emerald-700 dark:text-emerald-400 rounded border border-zinc-200 dark:border-zinc-800">
								⚡ Cache
							</span>
						</div>
						<div className="p-1.5 space-y-0.5">
							<p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
								{entry.filename}
							</p>
							<p className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
								{new Date(entry.analyzedAt).toLocaleDateString()}
							</p>
						</div>
					</button>
				))}
			</div>
		</div>
	);
};
