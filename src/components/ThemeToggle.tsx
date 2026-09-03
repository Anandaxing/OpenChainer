import type React from "react";
import { useEffect, useRef, useState } from "react";
import { type Theme, useTheme } from "../context/ThemeContext";
import { LuSun } from "react-icons/lu";
import { FiMoon } from "react-icons/fi";
import { PiLaptopBold } from "react-icons/pi";

export const ThemeToggle: React.FC = () => {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
		{ value: "light", label: "Light", icon: <LuSun /> },
		{ value: "dark", label: "Dark", icon:  <FiMoon />},
		{ value: "system", label: "System", icon: <PiLaptopBold />},
	];

	const currentOption = options.find((o) => o.value === theme) || options[2];

	return (
		<div className="relative inline-block text-left" ref={menuRef}>
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				aria-label={`Current theme: ${theme}. Click to change theme.`}
				aria-expanded={isOpen}
				className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]"
			>
				<span>{resolvedTheme === "dark" ? <FiMoon /> : <LuSun />}</span>
				<span className="capitalize hidden sm:inline">
					{currentOption.label}
				</span>
				<span className="text-[10px] text-zinc-400">▼</span>
			</button>

			{isOpen && (
				<div
					role="menu"
					aria-orientation="vertical"
					className="absolute right-0 mt-2 w-32 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-50 focus:outline-none"
				>
					{options.map((opt) => {
						const isActive = theme === opt.value;
						return (
							<button
								key={opt.value}
								type="button"
								role="menuitem"
								onClick={() => {
									setTheme(opt.value);
									setIsOpen(false);
								}}
								className={`cursor-pointer w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-medium transition-colors ${
									isActive
										? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold"
										: "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
								}`}
							>
								<span className="flex items-center gap-2">
									<span>{opt.icon}</span>
									<span>{opt.label}</span>
								</span>
								{isActive && <span className="text-emerald-500">✓</span>}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
