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
		<div className="space-y-2 pt-4 border-t border-zinc-800/60">
			<div className="flex items-center justify-between text-xs font-mono text-zinc-400">
				<span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-300">
					<span>🕒</span> RECENT — this device ({entries.length}/10)
				</span>
				<button
					type="button"
					onClick={onClearHistory}
					className="text-zinc-500 hover:text-red-400 transition-colors text-[11px] underline underline-offset-2"
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
						className="group flex-shrink-0 w-28 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-emerald-500/50 hover:bg-zinc-800 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
					>
						<div className="h-16 w-full bg-zinc-950 flex items-center justify-center overflow-hidden relative">
							<img
								src={entry.thumbnailUrl}
								alt={entry.filename}
								className="w-full h-full object-cover group-hover:scale-105 transition-transform"
							/>
							<span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 py-0.2 bg-zinc-950/80 text-emerald-400 rounded">
								⚡ Cache
							</span>
						</div>
						<div className="p-1.5 space-y-0.5">
							<p className="text-[11px] font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">
								{entry.filename}
							</p>
							<p className="text-[9px] font-mono text-zinc-500">
								{new Date(entry.analyzedAt).toLocaleDateString()}
							</p>
						</div>
					</button>
				))}
			</div>
		</div>
	);
};
