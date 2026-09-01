import type React from "react";

export const Header: React.FC = () => {
	return (
		<header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-4 py-3">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-lg shadow-[0_0_12px_rgba(16,185,129,0.2)]">
						⚡
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-lg font-bold tracking-tight text-zinc-100 font-mono">
								OpenChainer
							</h1>
							<span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
								Workbench v1.0
							</span>
						</div>
						<p className="text-xs text-zinc-400 hidden sm:block">
							AI-Powered Circuit Schematic & PCB Layout Analyzer
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
						<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						<span className="font-mono text-[11px]">System Ready</span>
					</div>
				</div>
			</div>
		</header>
	);
};
