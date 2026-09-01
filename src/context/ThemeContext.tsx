import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = "openchainer_theme_preference_v1";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [theme, setThemeState] = useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

	// Initialize theme preference from localStorage on mount
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const savedTheme = localStorage.getItem(
				THEME_STORAGE_KEY,
			) as Theme | null;
			if (
				savedTheme &&
				(savedTheme === "light" ||
					savedTheme === "dark" ||
					savedTheme === "system")
			) {
				setThemeState(savedTheme);
			}
		} catch (err) {
			console.error("Failed to read theme from localStorage:", err);
		}
	}, []);

	// Apply theme changes to document root and handle system preference changes
	useEffect(() => {
		if (typeof window === "undefined") return;

		const root = document.documentElement;

		const getSystemTheme = (): "light" | "dark" => {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		};

		const applyTheme = () => {
			const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
			setResolvedTheme(effectiveTheme);

			if (effectiveTheme === "dark") {
				root.classList.add("dark");
				root.style.colorScheme = "dark";
			} else {
				root.classList.remove("dark");
				root.style.colorScheme = "light";
			}
		};

		applyTheme();

		// Listen for system theme changes if theme is set to 'system'
		if (theme === "system") {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const handleChange = () => applyTheme();
			mediaQuery.addEventListener("change", handleChange);
			return () => mediaQuery.removeEventListener("change", handleChange);
		}
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, newTheme);
		} catch (err) {
			console.error("Failed to save theme to localStorage:", err);
		}
	};

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
