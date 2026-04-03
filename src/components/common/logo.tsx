import { SITE_PARENT_MARK } from "#/lib/site";

export function Logo() {
	return (
		<div className="flex items-center gap-2 sm:gap-2.5">
			<span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-primary px-1.5 text-[10px] font-black tracking-[0.12em] text-white sm:h-8 sm:min-w-8 sm:px-2 sm:text-[11px] sm:tracking-[0.14em]">
				{SITE_PARENT_MARK}
			</span>
			<span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
				Pay<span className="text-primary">day</span>
			</span>
		</div>
	);
}
