export function SiteNav() {
	return (
		<header
			className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md"
			style={{ background: "var(--header-bg)" }}
		>
			<nav className="page-wrap flex items-center justify-between py-3.5">
				<a href="/" className="flex items-center gap-2">
					<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
						₹
					</span>
					<span className="text-lg font-bold tracking-tight text-foreground">
						Pay<span className="text-primary">Disha</span>
					</span>
				</a>
				<div className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
					All calculations run in your browser
				</div>
			</nav>
		</header>
	);
}
