export type Board = {
	id: string;
	title: string;
	color: string;
	notes: number;
	folder: string;
	userId: string;
	isFavorite: boolean;
	isTrashed: boolean;
};

export type Note = {
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

// A note shown outside its board (calendar, folders), with the board it belongs to.
export type NoteSummary = Pick<
	Note,
	"id" | "title" | "dueDate" | "category" | "priority" | "completed" | "boardId"
> & {
	boardTitle: string;
};

export type Filter = "all" | "favorites" | "calendar" | "trash";
