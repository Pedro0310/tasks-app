// Shared styles and small helpers used across pages and components.

export const inputClass =
	"w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";

export const compactInputClass =
	"rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export const labelClass = "mb-1.5 block text-sm font-medium text-fg";

export const primaryButton =
	"inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export const secondaryButton =
	"inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-surface-2";

export const dangerButton =
	"inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-500";

export const iconButton =
	"inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg";

export const categories = ["Docencia", "Investigación", "Gestión", "Tutorías"];

export const categoryDots: Record<string, string> = {
	Docencia: "bg-sky-500",
	Investigación: "bg-fuchsia-500",
	Gestión: "bg-orange-500",
	Tutorías: "bg-teal-500",
};

// `value` is the legacy Tailwind class stored in Firestore, kept so existing boards still match.
export const boardColors = [
	{
		value: "bg-orange-200",
		label: "Naranja",
		bar: "bg-orange-400",
		soft: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
	},
	{
		value: "bg-green-200",
		label: "Verde",
		bar: "bg-emerald-400",
		soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
	},
	{
		value: "bg-purple-200",
		label: "Morado",
		bar: "bg-violet-400",
		soft: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
	},
	{
		value: "bg-blue-200",
		label: "Azul",
		bar: "bg-sky-400",
		soft: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
	},
	{
		value: "bg-pink-200",
		label: "Rosado",
		bar: "bg-pink-400",
		soft: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
	},
	{
		value: "bg-yellow-200",
		label: "Amarillo",
		bar: "bg-amber-300",
		soft: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
	},
];

export function getBoardColor(value: string) {
	return boardColors.find((color) => color.value === value) ?? boardColors[0];
}

const priorityStyles: Record<string, { chip: string; dot: string }> = {
	Alta: { chip: "bg-red-500/10 text-red-700 dark:text-red-300", dot: "bg-red-500" },
	Media: { chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
	Baja: { chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export function getPriorityStyle(priority: string) {
	return priorityStyles[priority] ?? priorityStyles.Media;
}

export const monthNames = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

const monthShort = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

const weekdayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Local-time YYYY-MM-DD, matching the value stored by <input type="date">.
// toISOString() would convert to UTC and shift the day in timezones ahead of UTC.
export function toDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
	const [year, month, day] = dateKey.split("-").map(Number);
	return new Date(year, month - 1, day);
}

// "12 oct", or "12 oct 2027" when it isn't the current year.
export function formatDueDate(dateKey: string) {
	const date = parseDateKey(dateKey);
	const base = `${date.getDate()} ${monthShort[date.getMonth()]}`;
	return date.getFullYear() === new Date().getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

// "Martes, 30 de septiembre"
export function formatLongDate(dateKey: string) {
	const date = parseDateKey(dateKey);
	return `${weekdayNames[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()].toLowerCase()}`;
}

export function isOverdue(dueDate: string, completed: boolean) {
	return !completed && dueDate !== "" && dueDate < toDateKey(new Date());
}

export function errorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export function errorCode(error: unknown) {
	return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}
