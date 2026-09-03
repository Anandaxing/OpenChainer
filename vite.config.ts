import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/types";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools({
			consolePiping: {
				enabled: false,
			},
		}),
		tailwindcss(),
		tanstackStart(),
		nitro(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
	],
	server: {
		allowedHosts: ["chrome-broadways-send.ngrok-free.dev"],
	},
});

export default config;
