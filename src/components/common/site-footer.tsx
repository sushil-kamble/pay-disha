import { Link } from "@tanstack/react-router";

import { Logo } from "./logo";

const FOOTER_LINKS = {
	Tools: [
		"In-Hand Salary Calculator",
		"Tax Regime Comparison",
		"HRA Calculator",
		"FIRE Number Calculator",
	],
	Company: ["About", "Blog", "Changelog", "Contact"],
	Legal: ["Privacy Policy", "Terms of Use"],
} as const;

export function SiteFooter() {
	return (
		<footer className="site-footer">
			<div className="page-wrap py-14">
				<div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-4">
					<div className="col-span-2 md:col-span-1">
						<Logo />
						<p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
							Free financial tools for every salaried professional in India. No
							tracking, no accounts, no cost.
						</p>
					</div>
					{Object.entries(FOOTER_LINKS).map(([heading, items]) => (
						<div key={heading}>
							<p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
								{heading}
							</p>
							<ul className="space-y-2.5">
								{items.map((item) => (
									<li key={item}>
										<Link
											to="/"
											className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
										>
											{item}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
					<p className="text-xs text-muted-foreground">
						© 2025 PayDisha. Made with ♥ for salaried India.
					</p>
					<p className="text-xs text-muted-foreground">
						Not financial advice. Always verify with a professional.
					</p>
				</div>
			</div>
		</footer>
	);
}
