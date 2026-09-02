import type React from "react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";

export const Header: React.FC = () => {
	return (
		<header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-4 py-3 transition-colors shadow-sm dark:shadow-none">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link to="/" className="flex items-center gap-3 group">
						<div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/60 transition-colors">
							<img
								src="/assets/images/icon.svg"
								alt="OpenChainer Logo"
								className="w-full h-full object-contain"
							/>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
									Open
									<span className="text-emerald-500 dark:text-emerald-300 font-mono font-bold">
										Chainer
									</span>
								</h1>
								<span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded">
									Workbench v1.0
								</span>
							</div>
							<p className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:block">
								AI-Powered Circuit Schematic & PCB Layout Analyzer
							</p>
						</div>
					</Link>
				</div>

				<div className="flex items-center gap-3">
					<div className="hidden sm:flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-full">
						<span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
						<span className="font-mono text-[11px]">System Ready</span>
					</div>

					{/* Theme Toggle Component */}
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
};
