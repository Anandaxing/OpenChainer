import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "../context/ThemeContext";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "OpenChainer — AI Circuit Schematic & PCB Analyzer",
			},
			{
				name: "description",
				content:
					"Open-source AI-powered circuit schematic and PCB analyzer. Upload schematics or PCB photos for real-time net tracing, component detection, and anomaly checks.",
			},
			{
				name: "keywords",
				content:
					"circuit schematic analyzer, PCB analyzer, AI circuit analysis, electronics diagnostics, electronics workbench, open-source hardware, multimodal LLM, Gemini AI",
			},
			{
				name: "author",
				content: "Ananda Adiputra",
			},
			{
				name: "theme-color",
				content: "#09090b",
			},
			// Open Graph / Facebook
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:url",
				content: "https://open-chainer.vercel.app/",
			},
			{
				property: "og:title",
				content: "OpenChainer — AI Circuit Schematic & PCB Analyzer",
			},
			{
				property: "og:description",
				content:
					"Open-source visual AI diagnostics for circuits and PCBs. Instant component identification, net analysis, and design verification.",
			},
			{
				property: "og:image",
				content:
					"https://open-chainer.vercel.app/assets/images/open_chainer_thumbnail.svg",
			},
			{
				property: "og:image:alt",
				content: "OpenChainer Workbench Preview",
			},
			{
				property: "og:site_name",
				content: "OpenChainer",
			},
			// Twitter / X
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "OpenChainer — AI Circuit Schematic & PCB Analyzer",
			},
			{
				name: "twitter:description",
				content:
					"Open-source visual AI diagnostics for circuits and PCBs. Instant component identification, net analysis, and design verification.",
			},
			{
				name: "twitter:image",
				content:
					"https://open-chainer.vercel.app/assets/images/open_chainer_thumbnail.svg",
			},
		],
		links: [
			{
				rel: "canonical",
				href: "https://open-chainer.vercel.app/",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/assets/images/icon.svg",
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "WebApplication",
					name: "OpenChainer",
					url: "https://open-chainer.vercel.app/",
					description:
						"Open-source AI-powered circuit schematic and PCB analyzer. Upload schematics or PCB images for real-time net tracing, component detection, and anomaly checks.",
					applicationCategory: "DeveloperApplication",
					operatingSystem: "Any",
					offers: {
						"@type": "Offer",
						price: "0",
						priceCurrency: "USD",
					},
					author: {
						"@type": "Person",
						name: "Ananda Adiputra",
						url: "https://github.com/Anandaxing",
					},
				}),
			},
		],
	}),
	notFoundComponent: NotFoundComponent,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}

function NotFoundComponent() {
	return (
		<div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pcb-grid-pattern">
			<header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/80 backdrop-blur px-4 py-3">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<Link to="/" className="flex items-center gap-3 group">
						<div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/60 transition-colors">
							<img
								src="/assets/images/icon.svg"
								alt="OpenChainer Logo"
								className="w-full h-full object-contain"
							/>
						</div>
						<span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
							Open
							<span className="text-emerald-500 dark:text-emerald-300 font-mono font-bold">
								Chainer
							</span>
						</span>
					</Link>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center p-6">
				<div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl backdrop-blur">
					<div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-mono text-xl font-bold">
						404
					</div>

					<div className="space-y-2">
						<h2 className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
							Trace Not Found
						</h2>
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							The schematic node or page you are looking for does not exist or
							has been disconnected from the circuit board.
						</p>
					</div>

					<div className="pt-2">
						<Link
							to="/"
							className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20"
						>
							Return to Workbench
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
