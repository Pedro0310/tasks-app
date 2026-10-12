"use client";

import Link from "next/link";
import { useState } from "react";
import { RotateCcw, Star, StickyNote, Trash2 } from "lucide-react";
import type { Board } from "@/lib/types";
import { getBoardColor, iconButton } from "@/lib/ui";

export default function BoardCard({
	board,
	onFavorite,
	onTrash,
	onRestore,
	onDeleteForever,
}: {
	board: Board;
	onFavorite: () => void;
	onTrash: () => void;
	onRestore: () => void;
	onDeleteForever: () => void;
}) {
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const color = getBoardColor(board.color);
	const noteCount = Math.max(board.notes, 0);

	return (
		<div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
			<div className={`h-1.5 ${color.bar}`} />

			<div className="flex flex-1 flex-col p-4">
				<div className="flex items-start justify-between gap-2">
					<div className={`flex size-10 items-center justify-center rounded-xl ${color.soft}`}>
						<StickyNote className="size-5" />
					</div>

					{!board.isTrashed ? (
						<div className="relative z-10 flex">
							<button
								type="button"
								onClick={onTrash}
								className={`${iconButton} transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`}
								aria-label="Mover a la papelera"
								title="Mover a la papelera"
							>
								<Trash2 className="size-4" />
							</button>
							<button
								type="button"
								onClick={onFavorite}
								className={iconButton}
								aria-label={board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
								title={board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
							>
								<Star
									className={`size-4 ${board.isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
								/>
							</button>
						</div>
					) : null}
				</div>

				{board.isTrashed ? (
					<h3 className="mt-4 line-clamp-2 font-semibold text-fg">{board.title}</h3>
				) : (
					// The ::after overlay makes the whole card clickable; the buttons above sit on top (z-10).
					<Link
						href={`/boards/${board.id}`}
						className="mt-4 line-clamp-2 font-semibold text-fg after:absolute after:inset-0"
					>
						{board.title}
					</Link>
				)}

				<div className="mt-auto flex items-center justify-between gap-2 pt-4 text-sm text-muted">
					<span>
						{noteCount} {noteCount === 1 ? "nota" : "notas"}
					</span>
					{board.folder ? (
						<span className="truncate rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">
							{board.folder}
						</span>
					) : null}
				</div>

				{board.isTrashed ? (
					<div className="mt-4 flex gap-2 border-t border-line pt-4">
						{confirmingDelete ? (
							<>
								<span className="flex-1 self-center text-xs text-muted">¿Eliminar para siempre?</span>
								<button
									type="button"
									onClick={() => setConfirmingDelete(false)}
									className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
								>
									Cancelar
								</button>
								<button
									type="button"
									onClick={onDeleteForever}
									className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-500"
								>
									Eliminar
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={onRestore}
									className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-surface-2"
								>
									<RotateCcw className="size-3.5" />
									Restaurar
								</button>
								<button
									type="button"
									onClick={() => setConfirmingDelete(true)}
									className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
								>
									<Trash2 className="size-3.5" />
									Eliminar
								</button>
							</>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
}
