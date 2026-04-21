"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
	addDoc,
	collection,
	doc,
	getDoc,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type BoardData = {
	id: string;
	title: string;
	color: string;
	folder: string;
	notes: number;
	userId: string;
	isFavorite: boolean;
	isTrashed: boolean;
};

type Note = {
	id: string;
	title: string;
	description: string;
	category: string;
	priority: string;
	dueDate: string;
	completed: boolean;
	boardId: string;
	userId: string;
};

export default function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const [boardId, setBoardId] = useState("");
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const [board, setBoard] = useState<BoardData | null>(null);
	const [notes, setNotes] = useState<Note[]>([]);

	const [noteTitle, setNoteTitle] = useState("");
	const [noteDescription, setNoteDescription] = useState("");
	const [noteCategory, setNoteCategory] = useState("Docencia");
	const [notePriority, setNotePriority] = useState("Media");
	const [noteDueDate, setNoteDueDate] = useState("");

	const [message, setMessage] = useState("");

	useEffect(() => {
		params.then((resolved) => setBoardId(resolved.id));
	}, [params]);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (!boardId || !user) return;

		async function loadBoard() {
			try {
				const boardRef = doc(db, "boards", boardId);
				const boardSnap = await getDoc(boardRef);

				if (boardSnap.exists()) {
					const data = boardSnap.data();
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
				}
			} catch (error: any) {
				setMessage(error.message || "No se pudo cargar el tablero.");
			}
		}

		loadBoard();
	}, [boardId, user]);

	useEffect(() => {
		if (!boardId || !user) return;

		const q = query(collection(db, "boards", boardId, "notes"), orderBy("createdAt", "desc"));

		const unsubscribe = onSnapshot(q, (snapshot) => {
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
		});

		return () => unsubscribe();
	}, [boardId, user]);

	const pendingNotes = useMemo(() => notes.filter((note) => !note.completed), [notes]);

	const completedNotes = useMemo(() => notes.filter((note) => note.completed), [notes]);

	async function handleCreateNote() {
		if (!user || !boardId) return;
		if (!noteTitle.trim()) return;

		try {
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
				notes: notes.length + 1,
			});

			setNoteTitle("");
			setNoteDescription("");
			setNoteCategory("Docencia");
			setNotePriority("Media");
			setNoteDueDate("");
			setMessage("Nota creada correctamente.");
		} catch (error: any) {
			setMessage(error.message || "No se pudo crear la nota.");
		}
	}

	async function toggleCompleted(note: Note) {
		try {
			await updateDoc(doc(db, "boards", boardId, "notes", note.id), {
				completed: !note.completed,
			});
		} catch (error: any) {
			setMessage(error.message || "No se pudo actualizar la nota.");
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await deleteDoc(doc(db, "boards", boardId, "notes", noteId));

			await updateDoc(doc(db, "boards", boardId), {
				notes: Math.max(notes.length - 1, 0),
			});

			setMessage("Nota eliminada correctamente.");
		} catch (error: any) {
			setMessage(error.message || "No se pudo eliminar la nota.");
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
				Cargando tablero...
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
				Debes iniciar sesión para ver este tablero.
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-6">
			<div className="max-w-6xl mx-auto">
				<div className="mb-6">
					<Link href="/" className="inline-block mb-4 text-sm text-violet-700 hover:underline">
						← Volver a tableros
					</Link>

					<div className={`rounded-2xl p-5 shadow-sm ${board?.color ?? "bg-orange-200"}`}>
						<h1 className="text-2xl font-bold text-gray-900">{board?.title ?? "Tablero"}</h1>
						<p className="text-sm text-gray-800 mt-2">{board?.folder || "Sin etiqueta"}</p>
					</div>
				</div>

				<div className="bg-white border rounded-2xl p-4 mb-6 shadow-sm">
					<h2 className="font-semibold text-gray-900 mb-4">Crear nueva nota</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<input
							value={noteTitle}
							onChange={(e) => setNoteTitle(e.target.value)}
							placeholder="Título de la nota"
							className="border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400 bg-white"
						/>

						<input
							value={noteDueDate}
							onChange={(e) => setNoteDueDate(e.target.value)}
							type="date"
							className="border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 bg-white"
						/>

						<select
							value={noteCategory}
							onChange={(e) => setNoteCategory(e.target.value)}
							className="border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 bg-white"
						>
							<option value="Docencia">Docencia</option>
							<option value="Investigación">Investigación</option>
							<option value="Gestión">Gestión</option>
							<option value="Tutorías">Tutorías</option>
						</select>

						<select
							value={notePriority}
							onChange={(e) => setNotePriority(e.target.value)}
							className="border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 bg-white"
						>
							<option value="Alta">Alta</option>
							<option value="Media">Media</option>
							<option value="Baja">Baja</option>
						</select>
					</div>

					<textarea
						value={noteDescription}
						onChange={(e) => setNoteDescription(e.target.value)}
						placeholder="Descripción"
						className="mt-3 w-full border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400 bg-white min-h-[110px]"
					/>

					<div className="mt-4">
						<button
							onClick={handleCreateNote}
							className="bg-violet-600 text-white rounded-xl px-4 py-2 hover:opacity-90"
						>
							Guardar nota
						</button>
					</div>
				</div>

				{message ? (
					<div className="mb-4 bg-white border rounded-xl px-4 py-3 text-sm text-gray-900">
						{message}
					</div>
				) : null}

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<section>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">Pendientes</h3>

						<div className="space-y-3">
							{pendingNotes.map((note) => (
								<NoteCard
									key={note.id}
									note={note}
									onToggle={() => toggleCompleted(note)}
									onDelete={() => deleteNote(note.id)}
								/>
							))}

							{pendingNotes.length === 0 ? (
								<div className="bg-white border rounded-2xl p-4 text-gray-700">
									No hay notas pendientes.
								</div>
							) : null}
						</div>
					</section>

					<section>
						<h3 className="text-lg font-semibold text-gray-900 mb-3">Completadas</h3>

						<div className="space-y-3">
							{completedNotes.map((note) => (
								<NoteCard
									key={note.id}
									note={note}
									onToggle={() => toggleCompleted(note)}
									onDelete={() => deleteNote(note.id)}
								/>
							))}

							{completedNotes.length === 0 ? (
								<div className="bg-white border rounded-2xl p-4 text-gray-700">
									No hay notas completadas.
								</div>
							) : null}
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}

function NoteCard({
	note,
	onToggle,
	onDelete,
}: {
	note: Note;
	onToggle: () => void;
	onDelete: () => void;
}) {
	const priorityStyles: Record<string, string> = {
		Alta: "bg-red-100 text-red-700",
		Media: "bg-yellow-100 text-yellow-800",
		Baja: "bg-green-100 text-green-700",
	};

	return (
		<div className="bg-white border rounded-2xl p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h4 className="font-semibold text-gray-900 text-lg">{note.title}</h4>
					{note.description ? (
						<p className="mt-1 text-sm text-gray-700">{note.description}</p>
					) : null}
				</div>

				<button
					onClick={onDelete}
					className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:opacity-90"
				>
					Eliminar
				</button>
			</div>

			<div className="mt-4 flex flex-wrap gap-2 text-sm">
				<span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800">{note.category}</span>
				<span
					className={`px-3 py-1 rounded-full ${
						priorityStyles[note.priority] ?? "bg-gray-100 text-gray-800"
					}`}
				>
					{note.priority}
				</span>
				{note.dueDate ? (
					<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">{note.dueDate}</span>
				) : null}
			</div>

			<div className="mt-4">
				<button
					onClick={onToggle}
					className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:opacity-90"
				>
					{note.completed ? "Marcar como pendiente" : "Marcar como completada"}
				</button>
			</div>
		</div>
	);
}
