import { Link } from "@tanstack/react-router";
import type React from "react";

export const LandingHero: React.FC = () => {
	return (
		<div className="flex flex-col justify-center space-y-6 max-w-xl">
			{/* Tagline Badge */}
			<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium w-fit">
				<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
				<span>100% Open-Source AI Schematic Intelligence</span>
			</div>

			{/* Hero Title */}
			<h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-zinc-50 leading-[1.1]">
				OPEN
				<span className="text-emerald-500 dark:text-emerald-400">CHAINER</span>
			</h1>

			{/* Subtitle */}
			<p className="text-lg sm:text-xl font-medium text-zinc-700 dark:text-zinc-300 leading-snug">
				An open-source AI tool for analyzing electrical schematic diagrams and
				PCB layouts.
			</p>

			{/* Paragraph */}
			<p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
				Upload any schematic or circuit board image to receive instant
				AI-powered component identification, AC/DC power path tracing, and
				plain-language circuit explanations. Perfect for engineers, makers, and
				hardware enthusiasts.
			</p>

			{/* CTA Buttons */}
			<div className="flex flex-wrap items-center gap-4 pt-2">
				{/* Primary Button: Get Started */}
				<Link
					to="/app"
					className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all min-h-[44px] flex items-center justify-center gap-2.5 group"
				>
					<span>Get Started</span>
					<svg
						className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth="2.5"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
						/>
					</svg>
				</Link>

				{/* Secondary Button: Contribute */}
				<a
					href="https://github.com/Anandaxing/open-chainer"
					target="_blank"
					rel="noopener noreferrer"
					className="px-6 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700/80 font-semibold text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2.5 shadow-sm"
				>
					<svg
						className="w-4 h-4 fill-current text-zinc-800 dark:text-zinc-200"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
						/>
					</svg>
					<span>Contribute</span>
				</a>
			</div>
		</div>
	);
};
