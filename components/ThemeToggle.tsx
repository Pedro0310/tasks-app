"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { iconButton } from "@/lib/ui";

// The theme lives on <html class="dark">, so every toggle on the page stays in sync.
function subscribe(onChange: () => void) {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
	return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export default function ThemeToggle({ className = "" }: { className?: string }) {
	const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

	function toggleTheme() {
		const next = !isDark;
		document.documentElement.classList.toggle("dark", next);
		try {
			localStorage.setItem("theme", next ? "dark" : "light");
		} catch {
			// Storage can be unavailable (private mode); the theme still applies for this visit.
		}
	}

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={`${iconButton} ${className}`}
			aria-label={label}
			title={label}
		>
			{isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
		</button>
	);
}
