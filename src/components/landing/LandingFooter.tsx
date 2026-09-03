import type React from "react";

export const LandingFooter: React.FC = () => {
	return (
		<footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
			OpenChainer {new Date().getFullYear()} v1.0.0 - <a className="text-xs font-mono font-semibold text-zinc-700 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors" target="_blank" href="https://github.com/Anandaxing">Anandaxing</a> — Open-Source Circuit
			Schematic & PCB Analyzer
		</footer>
	);
};
