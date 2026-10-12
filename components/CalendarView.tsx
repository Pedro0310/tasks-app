"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NoteSummary } from "@/lib/types";
import {
	formatLongDate,
	getPriorityStyle,
	iconButton,
	monthNames,
	secondaryButton,
	toDateKey,
} from "@/lib/ui";
import NoteSummaryItem from "./NoteSummaryItem";

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarView({ notes, loading }: { notes: NoteSummary[]; loading: boolean }) {
	const todayKey = toDateKey(new Date());
	const [currentMonth, setCurrentMonth] = useState(() => new Date());
	const [selectedDate, setSelectedDate] = useState(todayKey);

	const notesByDate = useMemo(() => {
		const map = new Map<string, NoteSummary[]>();
		for (const note of notes) {
			const list = map.get(note.dueDate) ?? [];
			list.push(note);
			map.set(note.dueDate, list);
		}
		return map;
	}, [notes]);

	// Date keys for each cell of a Monday-first month grid; null pads the first and last week.
	const cells = useMemo(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const result: (string | null)[] = Array(firstDayIndex).fill(null);
		for (let day = 1; day <= daysInMonth; day++) {
			result.push(toDateKey(new Date(year, month, day)));
		}
		while (result.length % 7 !== 0) result.push(null);
		return result;
	}, [currentMonth]);

	const selectedNotes = notesByDate.get(selectedDate) ?? [];

	function changeMonth(offset: number) {
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
	}

	function goToToday() {
		setCurrentMonth(new Date());
		setSelectedDate(todayKey);
	}

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-line bg-surface p-3 shadow-sm md:p-6">
				<div className="mb-4 flex items-center justify-between gap-3 px-1">
					<h2 className="text-lg font-semibold text-fg">
						{monthNames[currentMonth.getMonth()]}{" "}
						<span className="font-normal text-muted">{currentMonth.getFullYear()}</span>
					</h2>

					<div className="flex items-center gap-1">
						<button type="button" onClick={goToToday} className={`${secondaryButton} px-3 py-1.5`}>
							Hoy
						</button>
						<button
							type="button"
							onClick={() => changeMonth(-1)}
							className={iconButton}
							aria-label="Mes anterior"
						>
							<ChevronLeft className="size-[18px]" />
						</button>
						<button
							type="button"
							onClick={() => changeMonth(1)}
							className={iconButton}
							aria-label="Mes siguiente"
						>
							<ChevronRight className="size-[18px]" />
						</button>
					</div>
				</div>

				{loading ? (
					<p className="py-20 text-center text-sm text-muted">Cargando calendario…</p>
				) : (
					<>
						<div className="mb-1 grid grid-cols-7 gap-1 md:gap-2">
							{dayNames.map((day) => (
								<div key={day} className="py-1 text-center text-xs font-medium text-muted">
									{day}
								</div>
							))}
						</div>

						<div className="grid grid-cols-7 gap-1 md:gap-2">
							{cells.map((dateKey, index) => {
								if (!dateKey) return <div key={`empty-${index}`} />;

								const dayNotes = notesByDate.get(dateKey) ?? [];
								const isToday = dateKey === todayKey;
								const isSelected = dateKey === selectedDate;

								return (
									<button
										key={dateKey}
										type="button"
										onClick={() => setSelectedDate(dateKey)}
										className={`flex min-h-14 min-w-0 flex-col items-start rounded-xl border p-1.5 text-left transition md:min-h-28 md:p-2 ${
											isSelected
												? "border-accent ring-2 ring-accent/20"
												: "border-line hover:bg-surface-2"
										}`}
									>
										<span
											className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
												isToday ? "bg-accent text-white" : "text-fg"
											}`}
										>
											{Number(dateKey.slice(8))}
										</span>

										{/* Phones: just a dot per note. */}
										<div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
											{dayNotes.slice(0, 4).map((note) => (
												<span
													key={note.id}
													className={`size-1.5 rounded-full ${getPriorityStyle(note.priority).dot}`}
												/>
											))}
										</div>

										<div className="mt-1 hidden w-full space-y-1 md:block">
											{dayNotes.slice(0, 2).map((note) => (
												<div
													key={note.id}
													title={`${note.title} — ${note.boardTitle}`}
													className={`flex min-w-0 items-center gap-1.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs ${
														note.completed ? "text-muted line-through" : "text-fg"
													}`}
												>
													<span
														className={`size-1.5 shrink-0 rounded-full ${getPriorityStyle(note.priority).dot}`}
													/>
													<span className="truncate">{note.title}</span>
												</div>
											))}
											{dayNotes.length > 2 ? (
												<div className="px-1.5 text-xs text-muted">+{dayNotes.length - 2} más</div>
											) : null}
										</div>
									</button>
								);
							})}
						</div>
					</>
				)}
			</div>

			<section>
				<h3 className="mb-3 text-sm font-medium text-muted">{formatLongDate(selectedDate)}</h3>
				{selectedNotes.length === 0 ? (
					<p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
						No hay notas para este día.
					</p>
				) : (
					<div className="grid gap-3 md:grid-cols-2">
						{selectedNotes.map((note) => (
							<NoteSummaryItem key={`${note.boardId}-${note.id}`} note={note} showDate={false} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}
