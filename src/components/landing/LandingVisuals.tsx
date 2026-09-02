import type React from "react";

export const LandingVisuals: React.FC = () => {
	return (
		<div className="relative w-full max-w-lg mx-auto flex items-center justify-center p-2">
			{/* Decorative ambient background glow */}
			<div className="absolute -inset-4 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

			<div className="relative grid grid-cols-2 gap-4 sm:gap-6 w-full items-center">
				{/* Image 1: Engineer Workbench (Taller, h-[420px]) */}
				<div className="relative group rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 transition-all duration-500 hover:scale-[1.02]">
					<div className="h-[360px] sm:h-[420px] w-full overflow-hidden">
						<img
							src="/assets/images/eng.jpg"
							alt="Electrical engineer working on circuit board at workbench"
							className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
							loading="eager"
						/>
					</div>

					{/* Theme matching gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent dark:from-zinc-950 dark:via-transparent dark:to-transparent opacity-90" />

					{/* Image Overlay Tag */}
					<div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
						<p className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
							AI Analysis Workbench
						</p>
						<p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
							Real-time schematic parsing
						</p>
					</div>
				</div>

				{/* Image 2: PCB Macro Shot (Slightly lower offset, h-[360px]) */}
				<div className="relative group rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 transition-all duration-500 hover:scale-[1.02] translate-y-4 sm:translate-y-6">
					<div className="h-[310px] sm:h-[360px] w-full overflow-hidden">
						<img
							src="/assets/images/pcb.jpg"
							alt="PCB circuit traces and microchip close-up macro shot"
							className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
							loading="eager"
						/>
					</div>

					{/* Theme matching gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent dark:from-zinc-950 dark:via-transparent dark:to-transparent opacity-90" />

					{/* Image Overlay Tag */}
					<div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
						<p className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
							PCB & Trace Inspection
						</p>
						<p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
							Power path & netlist AI
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
