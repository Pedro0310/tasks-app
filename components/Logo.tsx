import { Check } from "lucide-react";

export default function Logo({
	className = "size-8 rounded-lg",
	iconClassName = "size-4",
}: {
	className?: string;
	iconClassName?: string;
}) {
	return (
		<div className={`flex shrink-0 items-center justify-center bg-accent text-white shadow-sm ${className}`}>
			<Check className={iconClassName} strokeWidth={3} />
		</div>
	);
}
