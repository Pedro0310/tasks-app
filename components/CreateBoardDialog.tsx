"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
	boardColors,
	iconButton,
	inputClass,
	labelClass,
	primaryButton,
	secondaryButton,
} from "@/lib/ui";

export default function CreateBoardDialog({
	onClose,
	onCreate,
}: {
	onClose: () => void;
	onCreate: (board: { title: string; folder: string; color: string }) => Promise<boolean>;
}) {
	const [title, setTitle] = useState("");
	const [folder, setFolder] = useState("");
	const [color, setColor] = useState(boardColors[0].value);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") onClose();
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!title.trim()) return;

		setSaving(true);
		const created = await onCreate({ title: title.trim(), folder: folder.trim(), color });
		setSaving(false);
		if (created) onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
			<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

			<form
				onSubmit={handleSubmit}
				role="dialog"
				aria-modal="true"
				aria-labelledby="create-board-title"
				className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl"
			>
				<div className="mb-5 flex items-center justify-between">
					<h2 id="create-board-title" className="text-lg font-semibold text-fg">
						Nuevo tablero
					</h2>
					<button type="button" onClick={onClose} className={iconButton} aria-label="Cerrar">
						<X className="size-[18px]" />
					</button>
				</div>

				<div className="space-y-4">
					<label className="block">
						<span className={labelClass}>Título</span>
						<input
							autoFocus
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ej. Cálculo I — segundo semestre"
							className={inputClass}
						/>
					</label>

					<label className="block">
						<span className={labelClass}>
							Etiqueta <span className="font-normal text-muted">(opcional)</span>
						</span>
						<input
							value={folder}
							onChange={(e) => setFolder(e.target.value)}
							placeholder="Ej. Pregrado"
							className={inputClass}
						/>
					</label>

					<fieldset>
						<legend className={labelClass}>Color</legend>
						<div className="flex flex-wrap gap-2.5">
							{boardColors.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setColor(option.value)}
									aria-label={option.label}
									aria-pressed={color === option.value}
									title={option.label}
									className={`size-8 rounded-full transition ${option.bar} ${
										color === option.value
											? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
											: "hover:scale-110"
									}`}
								/>
							))}
						</div>
					</fieldset>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<button type="button" onClick={onClose} className={secondaryButton}>
						Cancelar
					</button>
					<button type="submit" disabled={!title.trim() || saving} className={primaryButton}>
						{saving ? "Creando…" : "Crear tablero"}
					</button>
				</div>
			</form>
		</div>
	);
}
