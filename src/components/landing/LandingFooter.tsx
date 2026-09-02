import type React from "react";

export const LandingFooter: React.FC = () => {
	return (
		<footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono transition-colors">
			OpenChainer &copy; {new Date().getFullYear()} — Open-Source Circuit
			Schematic & PCB Analyzer
		</footer>
	);
};
