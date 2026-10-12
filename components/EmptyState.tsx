import type { LucideIcon } from "lucide-react";

export default function EmptyState({
	icon: Icon,
	title,
	description,
	children,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
			<div className="flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
				<Icon className="size-6" />
			</div>
			<h3 className="mt-4 font-semibold text-fg">{title}</h3>
			<p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
			{children ? <div className="mt-5">{children}</div> : null}
		</div>
	);
}
