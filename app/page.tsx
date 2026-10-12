"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
	addDoc,
	collection,
	doc,
	getDocs,
	onSnapshot,
	query,
	serverTimestamp,
	updateDoc,
	where,
	writeBatch,
} from "firebase/firestore";
import { Inbox, LayoutGrid, Menu, Plus, Search, Star, Trash2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { Board, Filter, NoteSummary } from "@/lib/types";
import { errorMessage, iconButton, inputClass, primaryButton } from "@/lib/ui";
import AuthScreen from "@/components/AuthScreen";
import BoardCard from "@/components/BoardCard";
import CalendarView from "@/components/CalendarView";
import CreateBoardDialog from "@/components/CreateBoardDialog";
import EmptyState from "@/components/EmptyState";
import NoteSummaryItem from "@/components/NoteSummaryItem";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import Toast from "@/components/Toast";

const viewHeaders: Record<Filter, { title: string; subtitle: string }> = {
	all: { title: "Todos los tableros", subtitle: "Tus tableros activos." },
	favorites: { title: "Favoritos", subtitle: "Los tableros que marcaste con estrella." },
	calendar: { title: "Calendario", subtitle: "Notas con fecha de entrega de todos tus tableros." },
	trash: {
		title: "Papelera",
		subtitle: "Restaura tableros o elimínalos definitivamente.",
	},
};

export default function Page() {
	const [user, setUser] = useState<User | null>(null);
	const [authLoading, setAuthLoading] = useState(true);

	const [boards, setBoards] = useState<Board[]>([]);
	const [queryText, setQueryText] = useState("");
	const [activeFilter, setActiveFilter] = useState<Filter>("all");
	const [selectedFolder, setSelectedFolder] = useState("");

	const [allNotes, setAllNotes] = useState<Omit<NoteSummary, "boardTitle">[]>([]);
	const [notesLoading, setNotesLoading] = useState(false);

	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [message, setMessage] = useState("");

	const clearMessage = useCallback(() => setMessage(""), []);
	const closeCreateDialog = useCallback(() => setShowCreateDialog(false), []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setAuthLoading(false);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (!user) {
			setBoards([]);
			return;
		}

		const q = query(collection(db, "boards"), where("userId", "==", user.uid));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const items: Board[] = snapshot.docs.map((item) => {
					const data = item.data();
					return {
						id: item.id,
						title: data.title ?? "",
						color: data.color ?? "bg-orange-200",
						notes: data.notes ?? 0,
						folder: data.folder ?? "",
						userId: data.userId ?? "",
						isFavorite: data.isFavorite ?? false,
						isTrashed: data.isTrashed ?? false,
					};
				});

				setBoards(items.reverse());
			},
			(error) => {
				// Listeners can briefly fail with permission-denied while signing out; ignore that case.
				if (!auth.currentUser) return;
				setMessage(
					error.code === "permission-denied"
						? "No tienes permiso para leer los tableros. Revisa las reglas de Firestore."
						: error.message,
				);
			},
		);

		return () => unsubscribe();
	}, [user]);

	// Only refetch notes when the set of boards changes, not on every favorite/trash toggle.
	const boardIdsKey = boards.map((board) => board.id).join(",");
	const needsNotes = activeFilter === "calendar" || selectedFolder !== "";

	useEffect(() => {
		if (!user || !needsNotes || !boardIdsKey) {
			setAllNotes([]);
			return;
		}

		let cancelled = false;

		async function loadAllNotes() {
			try {
				setNotesLoading(true);

				const snapshots = await Promise.all(
					boardIdsKey
						.split(",")
						.map((boardId) => getDocs(collection(db, "boards", boardId, "notes"))),
				);

				const items = snapshots.flatMap((snapshot) =>
					snapshot.docs.map((noteDoc) => {
						const noteData = noteDoc.data();
						return {
							id: noteDoc.id,
							title: noteData.title ?? "Sin título",
							dueDate: noteData.dueDate ?? "",
							category: noteData.category ?? "Sin categoría",
							priority: noteData.priority ?? "Media",
							boardId: noteDoc.ref.parent.parent?.id ?? "",
							completed: noteData.completed ?? false,
						};
					}),
				);

				if (!cancelled) setAllNotes(items);
			} catch (error) {
				if (!cancelled) setMessage(errorMessage(error, "No se pudieron cargar las notas."));
			} finally {
				if (!cancelled) setNotesLoading(false);
			}
		}

		loadAllNotes();

		return () => {
			cancelled = true;
		};
	}, [user, needsNotes, boardIdsKey]);

	const notesWithBoardTitle = useMemo(() => {
		const titles = new Map(boards.map((board) => [board.id, board.title]));
		return allNotes.map((note) => ({
			...note,
			boardTitle: titles.get(note.boardId) || "Tablero",
		}));
	}, [allNotes, boards]);

	const calendarNotes = useMemo(
		() => notesWithBoardTitle.filter((note) => note.dueDate),
		[notesWithBoardTitle],
	);

	// Pending first, then by due date (notes without a date last).
	const folderNotes = useMemo(
		() =>
			notesWithBoardTitle
				.filter((note) => note.category.toLowerCase() === selectedFolder.toLowerCase())
				.sort(
					(a, b) =>
						Number(a.completed) - Number(b.completed) ||
						(a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
				),
		[notesWithBoardTitle, selectedFolder],
	);

	const filteredBoards = useMemo(() => {
		const search = queryText.toLowerCase();
		return boards.filter((board) => {
			if (!board.title.toLowerCase().includes(search)) return false;
			if (activeFilter === "trash") return board.isTrashed;
			if (activeFilter === "favorites") return board.isFavorite && !board.isTrashed;
			return !board.isTrashed;
		});
	}, [boards, queryText, activeFilter]);

	const counts = useMemo(
		() => ({
			all: boards.filter((board) => !board.isTrashed).length,
			favorites: boards.filter((board) => board.isFavorite && !board.isTrashed).length,
			trash: boards.filter((board) => board.isTrashed).length,
		}),
		[boards],
	);

	function selectFilter(filter: Filter) {
		setActiveFilter(filter);
		setSelectedFolder("");
		setMobileMenuOpen(false);
	}

	function selectFolder(folder: string) {
		setSelectedFolder(folder);
		setActiveFilter("all");
		setMobileMenuOpen(false);
	}

	async function handleLogout() {
		setMobileMenuOpen(false);
		await signOut(auth);
	}

	async function handleCreateBoard(board: { title: string; folder: string; color: string }) {
		if (!user) return false;

		try {
			await addDoc(collection(db, "boards"), {
				...board,
				notes: 0,
				userId: user.uid,
				isFavorite: false,
				isTrashed: false,
				createdAt: serverTimestamp(),
			});
			setMessage("Tablero creado.");
			return true;
		} catch (error) {
			setMessage(errorMessage(error, "No se pudo crear el tablero."));
			return false;
		}
	}

	async function updateBoard(boardId: string, changes: Partial<Board>, fallback: string) {
		try {
			await updateDoc(doc(db, "boards", boardId), changes);
		} catch (error) {
			setMessage(errorMessage(error, fallback));
		}
	}

	async function deleteBoardForever(boardId: string) {
		try {
			// Firestore doesn't cascade deletes, so remove the notes subcollection too.
			const notesSnapshot = await getDocs(collection(db, "boards", boardId, "notes"));
			const batch = writeBatch(db);
			notesSnapshot.forEach((noteDoc) => batch.delete(noteDoc.ref));
			batch.delete(doc(db, "boards", boardId));
			await batch.commit();
			setMessage("Tablero eliminado definitivamente.");
		} catch (error) {
			setMessage(errorMessage(error, "No se pudo eliminar el tablero."));
		}
	}

	if (authLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">
				Cargando…
			</div>
		);
	}

	if (!user) {
		return <AuthScreen />;
	}

	const header = selectedFolder
		? { title: selectedFolder, subtitle: "Notas de todos tus tableros con esta categoría." }
		: viewHeaders[activeFilter];
	const showBoards = !selectedFolder && activeFilter !== "calendar";

	const sidebarProps = {
		activeFilter,
		selectedFolder,
		userEmail: user.email ?? "",
		counts,
		onSelectFilter: selectFilter,
		onSelectFolder: selectFolder,
		onLogout: handleLogout,
	};

	return (
		<div className="min-h-screen bg-bg md:flex">
			<aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface md:block">
				<Sidebar {...sidebarProps} />
			</aside>

			<div
				className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden ${
					mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
				}`}
				onClick={() => setMobileMenuOpen(false)}
			/>
			<aside
				inert={!mobileMenuOpen}
				className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-surface transition-transform duration-300 md:hidden ${
					mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<Sidebar {...sidebarProps} onClose={() => setMobileMenuOpen(false)} />
			</aside>

			<main className="min-w-0 flex-1">
				<div className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-bg/80 px-4 py-2.5 backdrop-blur md:hidden">
					<button
						type="button"
						onClick={() => setMobileMenuOpen(true)}
						className={iconButton}
						aria-label="Abrir menú"
					>
						<Menu className="size-5" />
					</button>
					<span className="flex-1 font-semibold text-fg">Gestor de Tareas</span>
					<ThemeToggle />
				</div>

				<div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
					<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
								{header.title}
							</h1>
							<p className="mt-1 text-sm text-muted">{header.subtitle}</p>
						</div>

						<div className="flex gap-2">
							{showBoards ? (
								<div className="relative flex-1 md:w-64 md:flex-none">
									<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
									<input
										value={queryText}
										onChange={(e) => setQueryText(e.target.value)}
										placeholder="Buscar tableros…"
										aria-label="Buscar tableros"
										className={`${inputClass} pl-9`}
									/>
								</div>
							) : null}
							<button
								type="button"
								onClick={() => setShowCreateDialog(true)}
								className={`${primaryButton} shrink-0`}
							>
								<Plus className="size-4" />
								<span className="sm:hidden">Nuevo</span>
								<span className="hidden sm:inline">Nuevo tablero</span>
							</button>
						</div>
					</div>

					{activeFilter === "calendar" && !selectedFolder ? (
						<CalendarView notes={calendarNotes} loading={notesLoading} />
					) : null}

					{selectedFolder ? (
						notesLoading ? (
							<p className="py-20 text-center text-sm text-muted">Cargando notas…</p>
						) : folderNotes.length === 0 ? (
							<EmptyState
								icon={Inbox}
								title={`Sin notas en ${selectedFolder}`}
								description="Las notas que crees con esta categoría en cualquier tablero aparecerán aquí."
							/>
						) : (
							<div className="grid gap-3 md:grid-cols-2">
								{folderNotes.map((note) => (
									<NoteSummaryItem key={`${note.boardId}-${note.id}`} note={note} />
								))}
							</div>
						)
					) : null}

					{showBoards ? (
						filteredBoards.length === 0 ? (
							<BoardsEmptyState
								filter={activeFilter}
								queryText={queryText}
								onCreate={() => setShowCreateDialog(true)}
							/>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
								{filteredBoards.map((board) => (
									<BoardCard
										key={board.id}
										board={board}
										onFavorite={() =>
											updateBoard(
												board.id,
												{ isFavorite: !board.isFavorite },
												"No se pudo actualizar favorito.",
											)
										}
										onTrash={() =>
											updateBoard(board.id, { isTrashed: true }, "No se pudo mover a papelera.")
										}
										onRestore={() =>
											updateBoard(
												board.id,
												{ isTrashed: false },
												"No se pudo restaurar el tablero.",
											)
										}
										onDeleteForever={() => deleteBoardForever(board.id)}
									/>
								))}
							</div>
						)
					) : null}
				</div>
			</main>

			{showCreateDialog ? (
				<CreateBoardDialog onClose={closeCreateDialog} onCreate={handleCreateBoard} />
			) : null}
			<Toast message={message} onClose={clearMessage} />
		</div>
	);
}

function BoardsEmptyState({
	filter,
	queryText,
	onCreate,
}: {
	filter: Filter;
	queryText: string;
	onCreate: () => void;
}) {
	if (queryText) {
		return (
			<EmptyState
				icon={Search}
				title="Sin resultados"
				description={`No hay tableros que coincidan con “${queryText}”.`}
			/>
		);
	}

	if (filter === "favorites") {
		return (
			<EmptyState
				icon={Star}
				title="Sin favoritos"
				description="Marca un tablero con la estrella para tenerlo siempre a mano."
			/>
		);
	}

	if (filter === "trash") {
		return (
			<EmptyState
				icon={Trash2}
				title="La papelera está vacía"
				description="Los tableros que muevas a la papelera aparecerán aquí."
			/>
		);
	}

	return (
		<EmptyState
			icon={LayoutGrid}
			title="Aún no tienes tableros"
			description="Crea tu primer tablero para empezar a organizar tus tareas."
		>
			<button type="button" onClick={onCreate} className={primaryButton}>
				<Plus className="size-4" />
				Crear tablero
			</button>
		</EmptyState>
	);
}
