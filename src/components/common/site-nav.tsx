import { ArrowRight, Moon, Sun } from "lucide-react";

import { useTheme } from "#/hooks/use-theme";
import { Logo } from "./logo";

export function SiteNav() {
	const { theme, toggle } = useTheme();

	return (
		<header
			className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md"
			style={{ background: "var(--header-bg)" }}
		>
			<nav className="page-wrap flex items-center justify-between py-3.5">
				<Logo />
				<div className="hidden items-center gap-7 md:flex">
					<a href="#tools" className="nav-link text-sm font-medium">
						All Tools
					</a>
					<a href="#why" className="nav-link text-sm font-medium">
						Why free?
					</a>
					<a href="#roadmap" className="nav-link text-sm font-medium">
						Roadmap
					</a>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={toggle}
						aria-label={
							theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
						}
						className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
					>
						{theme === "dark" ? (
							<Sun size={15} strokeWidth={2} />
						) : (
							<Moon size={15} strokeWidth={2} />
						)}
					</button>
					<a
						href="#tools"
						className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-180 hover:opacity-90"
					>
						Browse Tools <ArrowRight className="h-3.5 w-3.5" />
					</a>
				</div>
			</nav>
		</header>
	);
}
