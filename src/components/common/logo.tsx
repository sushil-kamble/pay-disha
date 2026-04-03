import { SITE_PARENT_MARK } from "#/lib/site";

export function Logo() {
	return (
		<div className="flex items-center gap-2.5">
			<span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2 text-[11px] font-black tracking-[0.14em] text-white">
				{SITE_PARENT_MARK}
			</span>
			<span className="text-lg font-bold tracking-tight text-foreground">
				Pay<span className="text-primary">day</span>
			</span>
		</div>
	);
}
