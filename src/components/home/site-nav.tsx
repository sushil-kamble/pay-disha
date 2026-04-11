import { Moon, Sun } from "lucide-react";
import { Logo } from "#/components/common/logo";
import { useTheme } from "#/hooks/use-theme";

export function SiteNav() {
	const { theme, toggle } = useTheme();

	return (
		<header
			className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md"
			style={{ background: "var(--header-bg)" }}
		>
			<nav className="page-wrap flex items-center justify-between py-2.5 sm:py-3.5">
				<a href="/" className="flex items-center gap-2">
					<Logo />
				</a>
				<div className="flex items-center gap-2">
					<div className="hidden rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground sm:block">
						All calculations run in your browser
					</div>
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
				</div>
			</nav>
		</header>
	);
}
