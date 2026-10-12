"use client";

import { CalendarDays, LayoutGrid, LogOut, Star, Trash2, X, type LucideIcon } from "lucide-react";
import type { Filter } from "@/lib/types";
import { categories, categoryDots, iconButton } from "@/lib/ui";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const navItems: { key: Filter; label: string; icon: LucideIcon }[] = [
	{ key: "all", label: "Todos los tableros", icon: LayoutGrid },
	{ key: "favorites", label: "Favoritos", icon: Star },
	{ key: "calendar", label: "Calendario", icon: CalendarDays },
	{ key: "trash", label: "Papelera", icon: Trash2 },
];

export default function Sidebar({
	activeFilter,
	selectedFolder,
	userEmail,
	counts,
	onSelectFilter,
	onSelectFolder,
	onLogout,
	onClose,
}: {
	activeFilter: Filter;
	selectedFolder: string;
	userEmail: string;
	counts: Partial<Record<Filter, number>>;
	onSelectFilter: (filter: Filter) => void;
	onSelectFolder: (folder: string) => void;
	onLogout: () => void;
	onClose?: () => void;
}) {
	return (
		<div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
			<div className="flex items-center justify-between px-2 pt-1">
				<div className="flex items-center gap-2.5">
					<Logo />
					<span className="font-semibold tracking-tight text-fg">Gestor de Tareas</span>
				</div>
				{onClose ? (
					<button type="button" onClick={onClose} className={iconButton} aria-label="Cerrar menú">
						<X className="size-[18px]" />
					</button>
				) : null}
			</div>

			<nav className="space-y-0.5">
				{navItems.map(({ key, label, icon: Icon }) => (
					<SidebarButton
						key={key}
						active={!selectedFolder && activeFilter === key}
						onClick={() => onSelectFilter(key)}
					>
						<Icon className="size-4" />
						<span className="flex-1">{label}</span>
						{counts[key] !== undefined ? (
							<span className="text-xs text-muted tabular-nums">{counts[key]}</span>
						) : null}
					</SidebarButton>
				))}
			</nav>

			<div>
				<p className="mb-2 px-3 text-xs font-medium tracking-wider text-muted uppercase">Carpetas</p>
				<div className="space-y-0.5">
					{categories.map((folder) => (
						<SidebarButton
							key={folder}
							active={selectedFolder === folder}
							onClick={() => onSelectFolder(folder)}
						>
							<span className={`size-2 rounded-full ${categoryDots[folder]}`} />
							<span className="flex-1">{folder}</span>
						</SidebarButton>
					))}
				</div>
			</div>

			<div className="mt-auto flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 p-2">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
					{userEmail.charAt(0).toUpperCase()}
				</div>
				<p className="min-w-0 flex-1 truncate text-sm text-fg" title={userEmail}>
					{userEmail}
				</p>
				<ThemeToggle />
				<button
					type="button"
					onClick={onLogout}
					className={iconButton}
					aria-label="Cerrar sesión"
					title="Cerrar sesión"
				>
					<LogOut className="size-[18px]" />
				</button>
			</div>
		</div>
	);
}

function SidebarButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
				active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"
			}`}
		>
			{children}
		</button>
	);
}
