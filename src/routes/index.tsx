import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LandingFooter } from "../components/landing/LandingFooter";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingVisuals } from "../components/landing/LandingVisuals";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Subtle entrance animation trigger on mount
		const timer = setTimeout(() => setIsVisible(true), 50);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col pcb-grid-pattern transition-colors">
			<LandingHeader />

			{/* Main Split-Screen Hero Container */}
			<main className="flex-1 flex items-center justify-center max-w-7xl w-full mx-auto p-6 sm:p-8 lg:p-12">
				<div
					className={`w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 transform ${
						isVisible
							? "opacity-100 translate-y-0"
							: "opacity-0 translate-y-4"
					}`}
				>
					{/* Left Column: Hero Text & CTAs */}
					<div className="flex justify-center lg:justify-start">
						<LandingHero />
					</div>

					{/* Right Column: Staggered Visual Showcase */}
					<div className="flex justify-center lg:justify-end">
						<LandingVisuals />
					</div>
				</div>
			</main>

			<LandingFooter />
		</div>
	);
}
