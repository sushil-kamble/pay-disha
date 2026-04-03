import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter, SiteNav } from "#/components/common";
import { Hero, ToolsSection, TrustPillars } from "#/components/home";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<SiteNav />
			<main>
				<Hero />
				<hr className="w-full border-t border-border/50" />
				<ToolsSection />
				<TrustPillars />
			</main>
			<SiteFooter />
		</div>
	);
}
