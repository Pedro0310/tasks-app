"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
	useEffect(() => {
		if (!message) return;
		const timer = setTimeout(onClose, 4000);
		return () => clearTimeout(timer);
	}, [message, onClose]);

	if (!message) return null;

	return (
		<div
			role="status"
			className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6"
		>
			<p className="flex-1">{message}</p>
			<button
				type="button"
				onClick={onClose}
				className="text-muted transition hover:text-fg"
				aria-label="Cerrar aviso"
			>
				<X className="size-4" />
			</button>
		</div>
	);
}
