import { ArrowRight, Check, EyeOff, Lock, UserX } from "lucide-react";

import {
	SITE_NAME,
	SITE_PARENT_BRAND,
	SITE_PARENT_MARK,
	SITE_PARENT_TAGLINE,
} from "#/lib/site";

const HERO_TRUST_POINTS = [
	{ icon: Check, text: "100% Free" },
	{ icon: UserX, text: "No sign-up" },
	{ icon: EyeOff, text: "Zero tracking" },
];

export function Hero() {
	return (
		<section className="relative flex min-h-[68vh] w-full flex-col items-center justify-start overflow-hidden bg-background pt-28 pb-12">
			<div aria-hidden="true" className="absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(255,255,255,0.9)_30%,rgba(255,255,255,0.82)_100%)] dark:bg-[linear-gradient(to_bottom,rgba(2,6,23,0.96),rgba(2,6,23,0.92)_30%,rgba(2,6,23,0.88)_100%)]" />
				<div className="absolute inset-x-1/2 -top-48 h-112 w-md -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
				<div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/10" />
				<div className="absolute inset-0 bg-[radial-gradient(var(--line)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)]" />
			</div>

			<div className="page-wrap relative z-10 w-full px-4 md:px-6">
				<div className="mx-auto flex max-w-200 flex-col items-center text-center">
					<p
						className="rise-in mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
						style={{ animationDelay: "60ms" }}
					>
						<span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold tracking-[0.14em] text-primary-foreground">
							{SITE_PARENT_MARK}
						</span>
						<span>{SITE_PARENT_TAGLINE}</span>
					</p>
					<h1
						className="display-title rise-in mb-6 text-balance text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
						style={{ animationDelay: "100ms" }}
					>
						<span className="block whitespace-nowrap">
							<span className="text-primary">{SITE_NAME}</span>{" "}
							<span className="text-foreground">by </span>
							<span className="text-foreground">{SITE_PARENT_BRAND}</span>
						</span>
						<span className="mt-3 block text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
							for better money decisions.{" "}
							<span className="underline decoration-primary decoration-[0.16em] underline-offset-[0.18em]">
								Instantly
							</span>
						</span>
					</h1>

					<p
						className="rise-in mb-10 max-w-3xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl"
						style={{ animationDelay: "150ms" }}
					>
						No sign-ups. No data tracking. Just incredibly fast calculators for
						your salary, taxes, career growth, and retirement planning, built
						for salaried India.
					</p>

					<div
						className="rise-in flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
						style={{ animationDelay: "200ms" }}
					>
						<a
							href="#tools"
							className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						>
							<span>Explore all tools</span>
							<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</a>
						<a
							href="#why"
							className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-border/50 bg-background/50 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:border-border hover:bg-muted active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
						>
							<Lock className="h-4 w-4 text-muted-foreground" />
							Why it's free
						</a>
					</div>

					<div
						className="rise-in mt-10 grid grid-cols-1 gap-4 text-sm font-medium text-muted-foreground sm:grid-cols-3 sm:gap-6"
						style={{ animationDelay: "250ms" }}
					>
						{HERO_TRUST_POINTS.map((item) => (
							<div
								key={item.text}
								className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/40 p-3 backdrop-blur-sm"
							>
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<item.icon className="h-4 w-4" />
								</div>
								<span className="whitespace-nowrap text-foreground/80">
									{item.text}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
