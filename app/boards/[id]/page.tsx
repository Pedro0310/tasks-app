"use client";

import Link from "next/link";
import { FormEvent, use, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	increment,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
} from "firebase/firestore";
import { ArrowLeft, Plus, StickyNote } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { Board, Note } from "@/lib/types";
import {
	categories,
	compactInputClass,
	errorMessage,
	getBoardColor,
	primaryButton,
} from "@/lib/ui";
import NoteCard from "@/components/NoteCard";
import ThemeToggle from "@/components/ThemeToggle";
import Toast from "@/components/Toast";

export default function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id: boardId } = use(params);

	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const [board, setBoard] = useState<Board | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [notes, setNotes] = useState<Note[]>([]);

	const [noteTitle, setNoteTitle] = useState("");
	const [noteDescription, setNoteDescription] = useState("");
	const [noteCategory, setNoteCategory] = useState("Docencia");
	const [notePriority, setNotePriority] = useState("Media");
	const [noteDueDate, setNoteDueDate] = useState("");
	const [saving, setSaving] = useState(false);

	const [message, setMessage] = useState("");
	const clearMessage = useCallback(() => setMessage(""), []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (!user) return;

		async function loadBoard() {
			try {
				const boardSnap = await getDoc(doc(db, "boards", boardId));
				const data = boardSnap.data();

				if (!data || data.userId !== user?.uid) {
					setNotFound(true);
					return;
				}

				setBoard({
					id: boardSnap.id,
					title: data.title ?? "",
					color: data.color ?? "bg-orange-200",
					folder: data.folder ?? "",
					notes: data.notes ?? 0,
					userId: data.userId ?? "",
					isFavorite: data.isFavorite ?? false,
					isTrashed: data.isTrashed ?? false,
				});
			} catch {
				// Permission denied (someone else's board) is reported the same as missing.
				setNotFound(true);
			}
		}

		loadBoard();
	}, [boardId, user]);

	useEffect(() => {
		if (!user) return;

		const q = query(collection(db, "boards", boardId, "notes"), orderBy("createdAt", "desc"));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const items: Note[] = snapshot.docs.map((item) => {
					const data = item.data();
					return {
						id: item.id,
						title: data.title ?? "",
						description: data.description ?? "",
						category: data.category ?? "Docencia",
						priority: data.priority ?? "Media",
						dueDate: data.dueDate ?? "",
						completed: data.completed ?? false,
						boardId: data.boardId ?? "",
						userId: data.userId ?? "",
					};
				});

				setNotes(items);
			},
			() => setNotFound(true),
		);

		return () => unsubscribe();
	}, [boardId, user]);

	const pendingNotes = useMemo(() => notes.filter((note) => !note.completed), [notes]);
	const completedNotes = useMemo(() => notes.filter((note) => note.completed), [notes]);

	async function handleCreateNote(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!user || !noteTitle.trim()) return;

		try {
			setSaving(true);

			await addDoc(collection(db, "boards", boardId, "notes"), {
				title: noteTitle.trim(),
				description: noteDescription.trim(),
				category: noteCategory,
				priority: notePriority,
				dueDate: noteDueDate,
				completed: false,
				boardId,
				userId: user.uid,
				createdAt: serverTimestamp(),
			});

			await updateDoc(doc(db, "boards", boardId), {
				notes: increment(1),
			});

			setNoteTitle("");
			setNoteDescription("");
			setNoteDueDate("");
		} catch (error) {
			setMessage(errorMessage(error, "No se pudo crear la nota."));
		} finally {
			setSaving(false);
		}
	}

	async function toggleCompleted(note: Note) {
		try {
			await updateDoc(doc(db, "boards", boardId, "notes", note.id), {
				completed: !note.completed,
			});
		} catch (error) {
			setMessage(errorMessage(error, "No se pudo actualizar la nota."));
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await deleteDoc(doc(db, "boards", boardId, "notes", noteId));

			await updateDoc(doc(db, "boards", boardId), {
				notes: increment(-1),
			});

			setMessage("Nota eliminada.");
		} catch (error) {
			setMessage(errorMessage(error, "No se pudo eliminar la nota."));
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
				Cargando tablero…
			</div>
		);
	}

	if (!user || notFound) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
				<p className="text-fg">
					{user ? "Tablero no encontrado." : "Debes iniciar sesión para ver este tablero."}
				</p>
				<Link href="/" className={primaryButton}>
					{user ? "Volver a tableros" : "Iniciar sesión"}
				</Link>
			</div>
		);
	}

	const color = getBoardColor(board?.color ?? "");
	const total = notes.length;
	const progress = total ? Math.round((completedNotes.length / total) * 100) : 0;

	return (
		<div className="min-h-screen bg-bg">
			<header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 md:px-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
					>
						<ArrowLeft className="size-4" />
						Tableros
					</Link>
					<ThemeToggle />
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
				<div className="flex items-start gap-4">
					<div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${color.soft}`}>
						<StickyNote className="size-6" />
					</div>
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl font-semibold tracking-tight break-words text-fg md:text-3xl">
							{board?.title ?? "Cargando…"}
						</h1>
						<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
							{board?.folder ? (
								<span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs">{board.folder}</span>
							) : null}
							<span>
								{completedNotes.length} de {total} completadas
							</span>
						</div>
					</div>
				</div>

				<div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-2">
					<div
						className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
						style={{ width: `${progress}%` }}
					/>
				</div>

				<form
					onSubmit={handleCreateNote}
					className="mt-8 rounded-2xl border border-line bg-surface p-4 shadow-sm transition focus-within:border-accent/50 md:p-5"
				>
					<input
						value={noteTitle}
						onChange={(e) => setNoteTitle(e.target.value)}
						placeholder="Añade una nota…"
						aria-label="Título de la nota"
						className="w-full bg-transparent text-base font-medium text-fg outline-none placeholder:text-muted"
					/>
					<textarea
						value={noteDescription}
						onChange={(e) => setNoteDescription(e.target.value)}
						placeholder="Descripción (opcional)"
						aria-label="Descripción"
						rows={2}
						className="mt-2 w-full resize-none bg-transparent text-sm text-fg outline-none placeholder:text-muted"
					/>

					<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
						<input
							type="date"
							value={noteDueDate}
							onChange={(e) => setNoteDueDate(e.target.value)}
							aria-label="Fecha de entrega"
							className={compactInputClass}
						/>
						<select
							value={noteCategory}
							onChange={(e) => setNoteCategory(e.target.value)}
							aria-label="Categoría"
							className={compactInputClass}
						>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
						<select
							value={notePriority}
							onChange={(e) => setNotePriority(e.target.value)}
							aria-label="Prioridad"
							className={compactInputClass}
						>
							<option value="Alta">Prioridad alta</option>
							<option value="Media">Prioridad media</option>
							<option value="Baja">Prioridad baja</option>
						</select>

						<button
							type="submit"
							disabled={!noteTitle.trim() || saving}
							className={`${primaryButton} ml-auto py-2`}
						>
							<Plus className="size-4" />
							Añadir
						</button>
					</div>
				</form>

				<div className="mt-10 grid gap-8 lg:grid-cols-2">
					<NoteColumn
						title="Pendientes"
						notes={pendingNotes}
						emptyText="Nada pendiente por aquí."
						onToggle={toggleCompleted}
						onDelete={deleteNote}
					/>
					<NoteColumn
						title="Completadas"
						notes={completedNotes}
						emptyText="Las notas que completes aparecerán aquí."
						onToggle={toggleCompleted}
						onDelete={deleteNote}
					/>
				</div>
			</main>

			<Toast message={message} onClose={clearMessage} />
		</div>
	);
}

function NoteColumn({
	title,
	notes,
	emptyText,
	onToggle,
	onDelete,
}: {
	title: string;
	notes: Note[];
	emptyText: string;
	onToggle: (note: Note) => void;
	onDelete: (noteId: string) => void;
}) {
	return (
		<section>
			<h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
				{title}
				<span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs tabular-nums">{notes.length}</span>
			</h2>

			<div className="space-y-3">
				{notes.map((note) => (
					<NoteCard
						key={note.id}
						note={note}
						onToggle={() => onToggle(note)}
						onDelete={() => onDelete(note.id)}
					/>
				))}

				{notes.length === 0 ? (
					<p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
						{emptyText}
					</p>
				) : null}
			</div>
		</section>
	);
}
