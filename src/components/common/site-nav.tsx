import { ArrowRight } from "lucide-react";

import { Logo } from "./logo";

export function SiteNav() {
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
				<a
					href="#tools"
					className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-180 hover:opacity-90"
				>
					Browse Tools <ArrowRight className="h-3.5 w-3.5" />
				</a>
			</nav>
		</header>
	);
}
