import { TRUST_PILLARS } from "./data";

export function TrustPillars() {
	return (
		<section
			id="why"
			className="border-y border-border py-20"
			style={{ background: "var(--frost)" }}
		>
			<div className="page-wrap">
				<div className="mb-12 text-center">
					<p className="island-kicker mb-3">Our commitment</p>
					<h2 className="display-title text-4xl font-bold text-foreground md:text-5xl">
						Built on trust, not data
					</h2>
				</div>
				<div className="grid gap-6 md:grid-cols-3">
					{TRUST_PILLARS.map((pillar) => (
						<div
							key={pillar.heading}
							className="island-shell rounded-2xl p-7 text-center"
						>
							<div
								className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${pillar.iconBg}`}
							>
								<pillar.icon className={`h-7 w-7 ${pillar.iconColor}`} />
							</div>
							<h3 className="mb-2 text-lg font-bold text-foreground">
								{pillar.heading}
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{pillar.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
