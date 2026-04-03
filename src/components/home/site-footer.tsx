import {
	SITE_DOMAIN,
	SITE_FULL_NAME,
	SITE_PARENT_BRAND,
	SITE_PARENT_TAGLINE,
} from "#/lib/site";

export function SiteFooter() {
	return (
		<footer className="site-footer">
			<div className="border-t border-border">
				<div className="page-wrap flex flex-col items-center justify-between gap-3 py-8 sm:flex-row">
					<p className="text-xs text-muted-foreground">
						© 2025 {SITE_FULL_NAME}. {SITE_PARENT_BRAND}: {SITE_PARENT_TAGLINE}
					</p>
					<p className="text-xs text-muted-foreground">
						Hosted on {SITE_DOMAIN}. Not financial advice. Numbers are
						estimates.
					</p>
				</div>
			</div>
		</footer>
	);
}
