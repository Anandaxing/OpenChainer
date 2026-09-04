import { Link } from "@tanstack/react-router";
import type React from "react";
import { ThemeToggle } from "../ThemeToggle";

export const LandingHeader: React.FC = () => {
	const scrollToWorkspace = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		const workspaceEl = document.getElementById("workspace");
		if (workspaceEl) {
			workspaceEl.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-4 py-3 transition-colors shadow-sm dark:shadow-none">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{/* Logo */}
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
							<span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
								Open
								<span className="text-emerald-500 dark:text-emerald-300 font-mono font-bold">
									Chainer
								</span>
							</span>
							<span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded">
								v1.0.0
							</span>
						</div>
					</div>
				</Link>

				{/* Right Controls */}
				<div className="flex items-center gap-3 sm:gap-4">
					<a
						href="#workspace"
						onClick={scrollToWorkspace}
						className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 transition-colors"
					>
						<span>Workbench</span>
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
							/>
						</svg>
					</a>

					<ThemeToggle />
				</div>
			</div>
		</header>
	);
};
