import { CalendarDays } from "lucide-react";
import { categoryDots, formatDueDate, getPriorityStyle, isOverdue } from "@/lib/ui";

export function Chip({ className = "", children }: { className?: string; children: React.ReactNode }) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
		>
			{children}
		</span>
	);
}

export function PriorityChip({ priority }: { priority: string }) {
	const style = getPriorityStyle(priority);
	return (
		<Chip className={style.chip}>
			<span className={`size-1.5 rounded-full ${style.dot}`} />
			{priority}
		</Chip>
	);
}

export function CategoryChip({ category }: { category: string }) {
	return (
		<Chip className="bg-surface-2 text-muted">
			<span className={`size-1.5 rounded-full ${categoryDots[category] ?? "bg-zinc-400"}`} />
			{category}
		</Chip>
	);
}

export function DueDateChip({ dueDate, completed }: { dueDate: string; completed: boolean }) {
	const overdue = isOverdue(dueDate, completed);
	return (
		<Chip
			className={overdue ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-surface-2 text-muted"}
		>
			<CalendarDays className="size-3" />
			{formatDueDate(dueDate)}
			{overdue ? " · vencida" : ""}
		</Chip>
	);
}
