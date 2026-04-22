"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	User,
} from "firebase/auth";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	query,
	serverTimestamp,
	updateDoc,
	where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Board = {
	id: string;
	title: string;
	color: string;
	notes: number;
	folder: string;
	userId: string;
	isFavorite: boolean;
	isTrashed: boolean;
};

type CalendarNote = {
	id: string;
	title: string;
	dueDate: string;
	category: string;
	priority: string;
	boardTitle: string;
	completed: boolean;
};

function getAuthErrorMessage(errorCode: string) {
	switch (errorCode) {
		case "auth/invalid-credential":
		case "auth/invalid-login-credentials":
		case "auth/user-not-found":
		case "auth/wrong-password":
			return "Correo o contraseña incorrecta.";
		case "auth/email-already-in-use":
			return "Ese correo ya está registrado.";
		case "auth/invalid-email":
			return "El correo electrónico no es válido.";
		case "auth/weak-password":
			return "La contraseña debe tener al menos 6 caracteres.";
		case "auth/missing-password":
			return "Debes ingresar una contraseña.";
		case "auth/network-request-failed":
			return "Error de conexión. Verifica tu internet e inténtalo de nuevo.";
		default:
			return "Ocurrió un error. Inténtalo nuevamente.";
	}
}

const monthNames = [
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

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function Page() {
	const [user, setUser] = useState<User | null>(null);
	const [authLoading, setAuthLoading] = useState(true);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [boards, setBoards] = useState<Board[]>([]);
	const [queryText, setQueryText] = useState("");
	const [activeFilter, setActiveFilter] = useState("all");
	const [selectedFolder, setSelectedFolder] = useState("");

	const [newBoardTitle, setNewBoardTitle] = useState("");
	const [newBoardFolder, setNewBoardFolder] = useState("");
	const [newBoardColor, setNewBoardColor] = useState("bg-orange-200");
	const [showCreateForm, setShowCreateForm] = useState(false);

	const [message, setMessage] = useState("");

	const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
	const [calendarLoading, setCalendarLoading] = useState(false);

	const [folderNotes, setFolderNotes] = useState<CalendarNote[]>([]);
	const [folderLoading, setFolderLoading] = useState(false);

	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const fixedFolders = ["Docencia", "Investigación", "Gestión", "Tutorías"];

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

		const unsubscribe = onSnapshot(q, (snapshot) => {
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
		});

		return () => unsubscribe();
	}, [user]);

	useEffect(() => {
		async function loadCalendarNotes() {
			if (!user) {
				setCalendarNotes([]);
				return;
			}

			try {
				setCalendarLoading(true);

				const boardsQuery = query(collection(db, "boards"), where("userId", "==", user.uid));
				const boardSnapshot = await getDocs(boardsQuery);
				const notesWithDate: CalendarNote[] = [];

				for (const boardDoc of boardSnapshot.docs) {
					const boardData = boardDoc.data();
					const boardTitle = boardData.title ?? "Tablero";

					const notesSnapshot = await getDocs(collection(db, "boards", boardDoc.id, "notes"));

					notesSnapshot.forEach((noteDoc) => {
						const noteData = noteDoc.data();

						if (noteData.dueDate) {
							notesWithDate.push({
								id: noteDoc.id,
								title: noteData.title ?? "Sin título",
								dueDate: noteData.dueDate ?? "",
								category: noteData.category ?? "Sin categoría",
								priority: noteData.priority ?? "Media",
								boardTitle,
								completed: noteData.completed ?? false,
							});
						}
					});
				}

				notesWithDate.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
				setCalendarNotes(notesWithDate);
			} catch (error: any) {
				setMessage(error.message || "No se pudo cargar la vista calendario.");
			} finally {
				setCalendarLoading(false);
			}
		}

		if (activeFilter === "calendar") {
			loadCalendarNotes();
		}
	}, [user, activeFilter, boards]);

	useEffect(() => {
		async function loadFolderNotes() {
			if (!user || !selectedFolder) {
				setFolderNotes([]);
				return;
			}

			try {
				setFolderLoading(true);

				const boardsQuery = query(collection(db, "boards"), where("userId", "==", user.uid));
				const boardSnapshot = await getDocs(boardsQuery);
				const matchedNotes: CalendarNote[] = [];

				for (const boardDoc of boardSnapshot.docs) {
					const boardData = boardDoc.data();
					const boardTitle = boardData.title ?? "Tablero";

					const notesSnapshot = await getDocs(collection(db, "boards", boardDoc.id, "notes"));

					notesSnapshot.forEach((noteDoc) => {
						const noteData = noteDoc.data();

						if (
							noteData.category &&
							noteData.category.toLowerCase() === selectedFolder.toLowerCase()
						) {
							matchedNotes.push({
								id: noteDoc.id,
								title: noteData.title ?? "Sin título",
								dueDate: noteData.dueDate ?? "",
								category: noteData.category ?? "Sin categoría",
								priority: noteData.priority ?? "Media",
								boardTitle,
								completed: noteData.completed ?? false,
							});
						}
					});
				}

				setFolderNotes(matchedNotes);
			} catch (error: any) {
				setMessage(error.message || "No se pudieron cargar las notas por carpeta.");
			} finally {
				setFolderLoading(false);
			}
		}

		loadFolderNotes();
	}, [user, selectedFolder]);

	const filteredBoards = useMemo(() => {
		let result = boards.filter((board) =>
			board.title.toLowerCase().includes(queryText.toLowerCase()),
		);

		if (activeFilter === "all") {
			result = result.filter((board) => !board.isTrashed);
		}

		if (activeFilter === "favorites") {
			result = result.filter((board) => board.isFavorite && !board.isTrashed);
		}

		if (activeFilter === "trash") {
			result = result.filter((board) => board.isTrashed);
		}

		if (activeFilter === "calendar") {
			result = result.filter((board) => !board.isTrashed);
		}

		return result;
	}, [boards, queryText, activeFilter]);

	const calendarGrid = useMemo(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();

		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		const firstDayIndex = (firstDay.getDay() + 6) % 7;
		const daysInMonth = lastDay.getDate();

		const cells: Array<{
			date: Date | null;
			dateKey: string | null;
			notes: CalendarNote[];
			isToday: boolean;
		}> = [];

		for (let i = 0; i < firstDayIndex; i++) {
			cells.push({
				date: null,
				dateKey: null,
				notes: [],
				isToday: false,
			});
		}

		for (let day = 1; day <= daysInMonth; day++) {
			const cellDate = new Date(year, month, day);
			const dateKey = cellDate.toISOString().split("T")[0];

			const notesForDay = calendarNotes.filter((note) => note.dueDate === dateKey);

			const today = new Date();
			const isToday =
				cellDate.getDate() === today.getDate() &&
				cellDate.getMonth() === today.getMonth() &&
				cellDate.getFullYear() === today.getFullYear();

			cells.push({
				date: cellDate,
				dateKey,
				notes: notesForDay,
				isToday,
			});
		}

		while (cells.length % 7 !== 0) {
			cells.push({
				date: null,
				dateKey: null,
				notes: [],
				isToday: false,
			});
		}

		return cells;
	}, [currentMonth, calendarNotes]);

	function goToPreviousMonth() {
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
	}

	function goToNextMonth() {
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
	}

	function goToToday() {
		setCurrentMonth(new Date());
	}

	async function handleRegister() {
		try {
			setMessage("");
			await createUserWithEmailAndPassword(auth, email, password);
			setMessage("Cuenta creada correctamente.");
		} catch (error: any) {
			setMessage(getAuthErrorMessage(error.code));
		}
	}

	async function handleLogin() {
		try {
			setMessage("");
			await signInWithEmailAndPassword(auth, email, password);
			setMessage("Inicio de sesión exitoso.");
		} catch (error: any) {
			setMessage(getAuthErrorMessage(error.code));
		}
	}

	async function handleLogout() {
		await signOut(auth);
		setMessage("Sesión cerrada.");
		setMobileMenuOpen(false);
	}

	async function handleCreateBoard() {
		if (!user) return;
		if (!newBoardTitle.trim()) return;

		try {
			await addDoc(collection(db, "boards"), {
				title: newBoardTitle.trim(),
				color: newBoardColor,
				notes: 0,
				folder: newBoardFolder.trim(),
				userId: user.uid,
				isFavorite: false,
				isTrashed: false,
				createdAt: serverTimestamp(),
			});

			setNewBoardTitle("");
			setNewBoardFolder("");
			setNewBoardColor("bg-orange-200");
			setShowCreateForm(false);
			setMessage("Tablero creado correctamente.");
		} catch (error: any) {
			setMessage(error.message || "No se pudo crear el tablero.");
		}
	}

	async function toggleFavorite(board: Board) {
		try {
			await updateDoc(doc(db, "boards", board.id), {
				isFavorite: !board.isFavorite,
			});
		} catch (error: any) {
			setMessage(error.message || "No se pudo actualizar favorito.");
		}
	}

	async function moveToTrash(board: Board) {
		try {
			await updateDoc(doc(db, "boards", board.id), {
				isTrashed: true,
			});
		} catch (error: any) {
			setMessage(error.message || "No se pudo mover a papelera.");
		}
	}

	async function restoreBoard(board: Board) {
		try {
			await updateDoc(doc(db, "boards", board.id), {
				isTrashed: false,
			});
		} catch (error: any) {
			setMessage(error.message || "No se pudo restaurar el tablero.");
		}
	}

	async function deleteBoardForever(boardId: string) {
		try {
			await deleteDoc(doc(db, "boards", boardId));
			setMessage("Tablero eliminado definitivamente.");
		} catch (error: any) {
			setMessage(error.message || "No se pudo eliminar el tablero.");
		}
	}

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
				Cargando aplicación...
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
				<div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Gestor de Tareas</h1>
					<p className="text-sm text-gray-700 mb-6">
						Inicia sesión o crea tu cuenta para gestionar tus tableros.
					</p>

					<div className="space-y-4">
						<input
							type="email"
							placeholder="Correo electrónico"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400 bg-white"
						/>

						<input
							type="password"
							placeholder="Contraseña"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400 bg-white"
						/>

						<div className="flex gap-3">
							<button
								onClick={handleLogin}
								className="flex-1 bg-violet-600 text-white rounded-xl py-3 hover:opacity-90"
							>
								Iniciar sesión
							</button>
							<button
								onClick={handleRegister}
								className="flex-1 border border-violet-600 text-violet-700 rounded-xl py-3 hover:bg-violet-50"
							>
								Registrarse
							</button>
						</div>

						{message ? (
							<p className="text-sm text-gray-800 bg-gray-50 border rounded-xl px-3 py-2">
								{message}
							</p>
						) : null}
					</div>
				</div>
			</div>
		);
	}

	const currentUserEmail = user.email ?? "";

	return (
		<div className="min-h-screen bg-gray-50 flex">
			<aside className="w-64 bg-white border-r p-4 hidden md:block">
				<div className="font-bold text-lg mb-6 text-gray-900">Gestor de Tareas</div>

				<nav className="space-y-2">
					<SidebarItem
						label="Todos los Tableros"
						active={activeFilter === "all"}
						onClick={() => {
							setActiveFilter("all");
							setSelectedFolder("");
						}}
					/>
					<SidebarItem
						label="Favoritos"
						active={activeFilter === "favorites"}
						onClick={() => {
							setActiveFilter("favorites");
							setSelectedFolder("");
						}}
					/>
					<SidebarItem
						label="Calendario"
						active={activeFilter === "calendar"}
						onClick={() => {
							setActiveFilter("calendar");
							setSelectedFolder("");
						}}
					/>
					<SidebarItem
						label="Papelera"
						active={activeFilter === "trash"}
						onClick={() => {
							setActiveFilter("trash");
							setSelectedFolder("");
						}}
					/>
				</nav>

				<div className="mt-8">
					<div className="text-xs text-gray-700 font-semibold mb-2">CARPETAS</div>

					<div className="space-y-2">
						<button
							onClick={() => setSelectedFolder("")}
							className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
								selectedFolder === ""
									? "bg-violet-50 text-violet-700"
									: "hover:bg-gray-100 text-gray-900"
							}`}
						>
							General
						</button>

						{fixedFolders.map((folder: string) => (
							<button
								key={folder}
								onClick={() => {
									setSelectedFolder(folder);
									setActiveFilter("all");
								}}
								className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
									selectedFolder === folder
										? "bg-violet-50 text-violet-700"
										: "hover:bg-gray-100 text-gray-900"
								}`}
							>
								{folder}
							</button>
						))}
					</div>
				</div>

				<div className="mt-8">
					<p className="text-xs text-gray-700 mb-2">Sesión iniciada</p>
					<p className="text-sm text-gray-900 break-all">{currentUserEmail}</p>
					<button
						onClick={handleLogout}
						className="mt-4 w-full border rounded-xl py-2 text-sm text-gray-900 bg-white hover:bg-gray-50"
					>
						Cerrar sesión
					</button>
				</div>
			</aside>

			{mobileMenuOpen ? (
				<div
					className="fixed inset-0 bg-black/30 z-40 md:hidden"
					onClick={() => setMobileMenuOpen(false)}
				/>
			) : null}

			<aside
				className={`fixed top-0 left-0 h-full w-72 bg-white border-r p-4 z-50 transform transition-transform duration-300 md:hidden ${
					mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between mb-6">
					<div className="font-bold text-lg text-gray-900">Gestor de Tareas</div>
					<button onClick={() => setMobileMenuOpen(false)} className="text-2xl text-gray-700">
						×
					</button>
				</div>

				<nav className="space-y-2">
					<SidebarItem
						label="Todos los Tableros"
						active={activeFilter === "all"}
						onClick={() => {
							setActiveFilter("all");
							setSelectedFolder("");
							setMobileMenuOpen(false);
						}}
					/>
					<SidebarItem
						label="Favoritos"
						active={activeFilter === "favorites"}
						onClick={() => {
							setActiveFilter("favorites");
							setSelectedFolder("");
							setMobileMenuOpen(false);
						}}
					/>
					<SidebarItem
						label="Calendario"
						active={activeFilter === "calendar"}
						onClick={() => {
							setActiveFilter("calendar");
							setSelectedFolder("");
							setMobileMenuOpen(false);
						}}
					/>
					<SidebarItem
						label="Papelera"
						active={activeFilter === "trash"}
						onClick={() => {
							setActiveFilter("trash");
							setSelectedFolder("");
							setMobileMenuOpen(false);
						}}
					/>
				</nav>

				<div className="mt-8">
					<div className="text-xs text-gray-700 font-semibold mb-2">CARPETAS</div>

					<div className="space-y-2">
						<button
							onClick={() => {
								setSelectedFolder("");
								setMobileMenuOpen(false);
							}}
							className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
								selectedFolder === ""
									? "bg-violet-50 text-violet-700"
									: "hover:bg-gray-100 text-gray-900"
							}`}
						>
							General
						</button>

						{fixedFolders.map((folder: string) => (
							<button
								key={folder}
								onClick={() => {
									setSelectedFolder(folder);
									setActiveFilter("all");
									setMobileMenuOpen(false);
								}}
								className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
									selectedFolder === folder
										? "bg-violet-50 text-violet-700"
										: "hover:bg-gray-100 text-gray-900"
								}`}
							>
								{folder}
							</button>
						))}
					</div>
				</div>

				<div className="mt-8">
					<p className="text-xs text-gray-700 mb-2">Sesión iniciada</p>
					<p className="text-sm text-gray-900 break-all">{currentUserEmail}</p>
					<button
						onClick={handleLogout}
						className="mt-4 w-full border rounded-xl py-2 text-sm text-gray-900 bg-white hover:bg-gray-50"
					>
						Cerrar sesión
					</button>
				</div>
			</aside>

			<main className="flex-1 p-4 md:p-6">
				<div className="md:hidden mb-4">
					<button
						onClick={() => setMobileMenuOpen(true)}
						className="px-4 py-2 rounded-xl border bg-white text-gray-900"
					>
						☰
					</button>
				</div>

				<div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
					<div className="flex-1">
						<input
							value={queryText}
							onChange={(e) => setQueryText(e.target.value)}
							placeholder="Buscar tableros..."
							className="w-full bg-white border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400"
						/>
					</div>

					<button
						onClick={() => setShowCreateForm((prev) => !prev)}
						className="bg-violet-600 text-white px-4 py-3 rounded-xl hover:opacity-90"
					>
						+ Nuevo Tablero
					</button>
				</div>

				{showCreateForm ? (
					<div className="bg-white border rounded-2xl p-4 mb-6 shadow-sm">
						<h2 className="font-semibold text-gray-900 mb-4">Crear nuevo tablero</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<input
								value={newBoardTitle}
								onChange={(e) => setNewBoardTitle(e.target.value)}
								placeholder="Título del tablero"
								className="border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400 bg-white"
							/>

							<input
								value={newBoardFolder}
								onChange={(e) => setNewBoardFolder(e.target.value)}
								placeholder="Etiqueta o carpeta"
								className="border rounded-xl px-4 py-3 outline-none focus:ring text-gray-900 placeholder:text-gray-400 bg-white"
							/>

							<select
								value={newBoardColor}
								onChange={(e) => setNewBoardColor(e.target.value)}
								className="border rounded-xl px-4 py-3 outline-none focus:ring bg-white text-gray-900"
							>
								<option value="bg-orange-200">Naranja</option>
								<option value="bg-green-200">Verde</option>
								<option value="bg-purple-200">Morado</option>
								<option value="bg-blue-200">Azul</option>
								<option value="bg-pink-200">Rosado</option>
								<option value="bg-yellow-200">Amarillo</option>
							</select>
						</div>

						<div className="flex gap-3 mt-4">
							<button
								onClick={handleCreateBoard}
								className="bg-violet-600 text-white rounded-xl px-4 py-2 hover:opacity-90"
							>
								Guardar tablero
							</button>
							<button
								onClick={() => setShowCreateForm(false)}
								className="border rounded-xl px-4 py-2 text-gray-900 bg-white hover:bg-gray-50"
							>
								Cancelar
							</button>
						</div>
					</div>
				) : null}

				{message ? (
					<div className="mb-4 bg-white border rounded-xl px-4 py-3 text-sm text-gray-900">
						{message}
					</div>
				) : null}

				{activeFilter === "calendar" ? (
					<div className="bg-white border rounded-2xl p-5 mb-6">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
							<h2 className="text-2xl font-bold text-gray-900">
								{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
							</h2>

							<div className="flex gap-2">
								<button
									onClick={goToToday}
									className="px-4 py-2 rounded-xl border bg-violet-600 text-white hover:opacity-90"
								>
									Hoy
								</button>
								<button
									onClick={goToPreviousMonth}
									className="px-4 py-2 rounded-xl border bg-white text-gray-900 hover:bg-gray-50"
								>
									←
								</button>
								<button
									onClick={goToNextMonth}
									className="px-4 py-2 rounded-xl border bg-white text-gray-900 hover:bg-gray-50"
								>
									→
								</button>
							</div>
						</div>

						{calendarLoading ? (
							<p className="text-gray-700">Cargando calendario...</p>
						) : (
							<div>
								<div className="grid grid-cols-7 gap-2 mb-2">
									{dayNames.map((day) => (
										<div key={day} className="text-center font-semibold text-gray-700 py-2">
											{day}
										</div>
									))}
								</div>

								<div className="grid grid-cols-7 gap-2">
									{calendarGrid.map((cell, index) => (
										<div
											key={index}
											className={`min-h-[130px] border rounded-2xl p-2 ${
												cell.date ? "bg-white" : "bg-gray-50"
											}`}
										>
											{cell.date ? (
												<>
													<div className="flex justify-between items-center mb-2">
														<span
															className={`text-sm font-bold ${
																cell.isToday
																	? "bg-violet-600 text-white px-2 py-0.5 rounded-full"
																	: "text-gray-900"
															}`}
														>
															{cell.date.getDate()}
														</span>
													</div>

													<div className="space-y-1">
														{cell.notes.slice(0, 2).map((note) => (
															<div
																key={note.id}
																className={`text-xs rounded-lg px-2 py-1 truncate ${
																	note.priority === "Alta"
																		? "bg-red-100 text-red-700"
																		: note.priority === "Media"
																			? "bg-yellow-100 text-yellow-800"
																			: "bg-green-100 text-green-700"
																}`}
																title={`${note.title} - ${note.boardTitle}`}
															>
																{note.title}
															</div>
														))}

														{cell.notes.length > 2 ? (
															<div className="text-xs text-gray-500 font-medium">
																+{cell.notes.length - 2} más
															</div>
														) : null}
													</div>
												</>
											) : null}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				) : null}

				{selectedFolder ? (
					<div className="bg-white border rounded-2xl p-5 mb-6">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							Carpeta: {selectedFolder}
						</h2>

						{folderLoading ? (
							<p className="text-gray-700">Cargando notas...</p>
						) : folderNotes.length === 0 ? (
							<p className="text-gray-700">
								No hay notas con la etiqueta {selectedFolder}.
							</p>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{folderNotes.map((note) => (
									<div
										key={`${note.boardTitle}-${note.id}`}
										className="bg-gray-50 border rounded-2xl p-4"
									>
										<h3 className="text-lg font-semibold text-gray-900">
											{note.title}
										</h3>

										<p className="text-sm text-gray-700 mt-1">
											Tablero: {note.boardTitle}
										</p>

										<div className="mt-3 flex flex-wrap gap-2 text-sm">
											<span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800">
												{note.category}
											</span>

											<span
												className={`px-3 py-1 rounded-full ${
													note.priority === "Alta"
														? "bg-red-100 text-red-700"
														: note.priority === "Media"
															? "bg-yellow-100 text-yellow-800"
															: "bg-green-100 text-green-700"
												}`}
											>
												{note.priority}
											</span>

											{note.dueDate ? (
												<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
													{note.dueDate}
												</span>
											) : null}

											<span
												className={`px-3 py-1 rounded-full ${
													note.completed
														? "bg-green-100 text-green-700"
														: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{note.completed ? "Completada" : "Pendiente"}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				) : null}

				{activeFilter !== "calendar" && !selectedFolder ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-4">
						{filteredBoards.map((board) => (
							<BoardCard
								key={board.id}
								board={board}
								onFavorite={() => toggleFavorite(board)}
								onTrash={() => moveToTrash(board)}
								onRestore={() => restoreBoard(board)}
								onDeleteForever={() => deleteBoardForever(board.id)}
							/>
						))}
					</div>
				) : null}

				{activeFilter !== "calendar" && !selectedFolder && filteredBoards.length === 0 ? (
					<div className="mt-8 bg-white border rounded-2xl p-6 text-center text-gray-800">
						No hay tableros para mostrar en esta sección.
					</div>
				) : null}
			</main>
		</div>
	);
}

function SidebarItem({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
				active ? "bg-violet-50 text-violet-700" : "hover:bg-gray-100 text-gray-900"
			}`}
		>
			{label}
		</button>
	);
}

function BoardCard({
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
	return (
		<div
			className={`${board.color} rounded-2xl p-4 shadow-sm hover:shadow transition min-h-[150px] md:min-h-[180px] border border-black/5`}
		>
			<div className="flex items-start justify-between gap-2">
				<Link href={`/boards/${board.id}`} className="block">
					<h3 className="font-semibold text-gray-900 text-lg md:text-xl leading-tight hover:underline">
						{board.title}
					</h3>
				</Link>

				<button
					onClick={onFavorite}
					className="text-black text-base px-2 py-1 rounded-lg bg-white/70 hover:bg-white border border-black/10"
					title="Favorito"
				>
					{board.isFavorite ? "★" : "☆"}
				</button>
			</div>

			<div className="mt-10 text-sm text-gray-900">
				<div className="font-medium">{board.notes} notas</div>
				{board.folder ? <div className="mt-1 font-medium text-gray-900">{board.folder}</div> : null}
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				{!board.isTrashed ? (
					<button
						onClick={onTrash}
						className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-black border border-black/10"
					>
						Papelera
					</button>
				) : (
					<>
						<button
							onClick={onRestore}
							className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-black border border-black/10"
						>
							Restaurar
						</button>
						<button
							onClick={onDeleteForever}
							className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:opacity-90"
						>
							Eliminar
						</button>
					</>
				)}
			</div>
		</div>
	);
}