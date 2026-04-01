import { Lightbulb } from "lucide-react";

import { TOOLS } from "./data";

export function ComingSoonBanner() {
	const upcoming = TOOLS.filter((tool) => tool.status === "coming-soon");

	return (
		<section id="roadmap" className="py-20">
			<div className="page-wrap">
				<div className="island-shell rounded-3xl p-8 md:p-12">
					<div className="grid gap-10 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="display-title mb-4 text-3xl font-bold text-foreground md:text-4xl">
								More tools are on their way
							</h2>
							<p className="mb-6 leading-relaxed text-muted-foreground">
								We're building every tool a salaried employee might need — from
								FIRE planning to offer comparisons. All free. All private.
								Always.
							</p>
							<a
								href="mailto:hello@paydisha.in"
								className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-180 hover:bg-secondary"
							>
								<Lightbulb className="h-4 w-4 text-primary" />
								Suggest a tool
							</a>
						</div>
						<div>
							<p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
								Coming next
							</p>
							<ul className="space-y-3">
								{upcoming.map((tool) => (
									<li key={tool.id} className="flex items-center gap-3 text-sm">
										<div
											className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tool.bg}`}
										>
											<tool.icon
												className={`h-3.5 w-3.5 opacity-60 ${tool.color}`}
											/>
										</div>
										<span className="text-muted-foreground">{tool.name}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
