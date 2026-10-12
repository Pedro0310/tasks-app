"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Note } from "@/lib/types";
import { iconButton } from "@/lib/ui";
import { CategoryChip, DueDateChip, PriorityChip } from "./Chips";

export default function NoteCard({
	note,
	onToggle,
	onDelete,
}: {
	note: Note;
	onToggle: () => void;
	onDelete: () => void;
}) {
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	return (
		<div className="group flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
			<button
				type="button"
				onClick={onToggle}
				aria-label={note.completed ? "Marcar como pendiente" : "Marcar como completada"}
				title={note.completed ? "Marcar como pendiente" : "Marcar como completada"}
				className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
					note.completed
						? "border-accent bg-accent text-white"
						: "border-line hover:border-accent hover:bg-accent-soft"
				}`}
			>
				{note.completed ? <Check className="size-3" strokeWidth={3} /> : null}
			</button>

			<div className="min-w-0 flex-1">
				<p
					className={`font-medium break-words ${note.completed ? "text-muted line-through" : "text-fg"}`}
				>
					{note.title}
				</p>
				{note.description ? (
					<p className="mt-1 text-sm break-words whitespace-pre-line text-muted">{note.description}</p>
				) : null}

				<div className="mt-3 flex flex-wrap gap-1.5">
					<PriorityChip priority={note.priority} />
					{note.dueDate ? <DueDateChip dueDate={note.dueDate} completed={note.completed} /> : null}
					<CategoryChip category={note.category} />
				</div>

				{confirmingDelete ? (
					<div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
						<span className="flex-1 text-xs text-muted">¿Eliminar esta nota?</span>
						<button
							type="button"
							onClick={() => setConfirmingDelete(false)}
							className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={onDelete}
							className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
						>
							Eliminar
						</button>
					</div>
				) : null}
			</div>

			{!confirmingDelete ? (
				<button
					type="button"
					onClick={() => setConfirmingDelete(true)}
					className={`${iconButton} -mt-1.5 -mr-1.5 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:text-red-400`}
					aria-label="Eliminar nota"
					title="Eliminar nota"
				>
					<Trash2 className="size-4" />
				</button>
			) : null}
		</div>
	);
}
