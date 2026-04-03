import { Link } from "@tanstack/react-router";

import { TOOLS } from "#/components/home/data";
import {
	SITE_DOMAIN,
	SITE_FULL_NAME,
	SITE_PARENT_BRAND,
	SITE_PARENT_TAGLINE,
} from "#/lib/site";

import { Logo } from "./logo";

export function SiteFooter() {
	const footerTools = TOOLS.map((tool) => ({
		id: tool.id,
		name: tool.name,
		href: tool.status === "live" ? tool.href : null,
		isLive: tool.status === "live",
	}));

	return (
		<footer className="site-footer">
			<div className="page-wrap py-14">
				<div className="mb-12 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
					<div>
						<Logo />
						<p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
							{SITE_FULL_NAME} is a privacy-first collection of useful financial
							tools for salaried India. No tracking, no accounts, no cost.
						</p>
					</div>
					<div>
						<p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
							Tools
						</p>
						<ul className="grid gap-2.5 sm:grid-cols-2">
							{footerTools.map((tool) => (
								<li key={tool.id}>
									{tool.isLive && tool.href ? (
										<Link
											to={tool.href}
											className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
										>
											{tool.name}
										</Link>
									) : (
										<span
											aria-disabled="true"
											className="text-sm text-muted-foreground/45"
										>
											{tool.name}
										</span>
									)}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
			<div className="border-t border-border">
				<div className="page-wrap flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
					<p className="text-xs text-muted-foreground">
						© 2025 {SITE_FULL_NAME}. {SITE_PARENT_BRAND}: {SITE_PARENT_TAGLINE}
					</p>
					<p className="text-xs text-muted-foreground">
						Hosted on {SITE_DOMAIN}. Not financial advice. Always verify with a
						professional.
					</p>
				</div>
			</div>
		</footer>
	);
}
