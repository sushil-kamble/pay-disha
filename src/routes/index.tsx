import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter, SiteNav } from "#/components/common";
import {
	ComingSoonBanner,
	CTABanner,
	Hero,
	ToolsSection,
	TrustPillars,
} from "#/components/home";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<SiteNav />
			<main>
				<Hero />
				<ToolsSection />
				<TrustPillars />
				<ComingSoonBanner />
				<CTABanner />
			</main>
			<SiteFooter />
		</div>
	);
}
