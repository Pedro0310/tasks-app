import Link from "next/link";
import { Check } from "lucide-react";
import type { NoteSummary } from "@/lib/types";
import { CategoryChip, DueDateChip, PriorityChip } from "./Chips";

// A read-only note row that links to its board. Used by the calendar and folder views.
export default function NoteSummaryItem({
	note,
	showDate = true,
}: {
	note: NoteSummary;
	showDate?: boolean;
}) {
	return (
		<Link
			href={`/boards/${note.boardId}`}
			className="flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-accent/40 hover:shadow-md"
		>
			<span
				className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
					note.completed ? "border-accent bg-accent text-white" : "border-line"
				}`}
			>
				{note.completed ? <Check className="size-3" strokeWidth={3} /> : null}
			</span>

			<div className="min-w-0 flex-1">
				<p
					className={`truncate font-medium ${note.completed ? "text-muted line-through" : "text-fg"}`}
				>
					{note.title}
				</p>
				<p className="mt-0.5 truncate text-sm text-muted">{note.boardTitle}</p>

				<div className="mt-3 flex flex-wrap gap-1.5">
					<PriorityChip priority={note.priority} />
					{showDate && note.dueDate ? (
						<DueDateChip dueDate={note.dueDate} completed={note.completed} />
					) : null}
					<CategoryChip category={note.category} />
				</div>
			</div>
		</Link>
	);
}
