import { ArrowRight, Check, EyeOff, Lock, UserX } from "lucide-react";

const HERO_TRUST_POINTS = [
	{ icon: Check, text: "100% Free" },
	{ icon: UserX, text: "No sign-up" },
	{ icon: EyeOff, text: "Zero tracking" },
];

export function Hero() {
	return (
		<section className="relative overflow-hidden py-24 md:py-32 lg:py-40 bg-background">
			{/* Animated Background Elements */}
			<div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
				{/* Background Mesh Gradient (More visible than before) */}
				<div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />

				{/* Grid Pattern (Stronger opacity to be clearly visible) */}
				<div
					className="absolute inset-0 opacity-10 dark:opacity-[0.15]"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--primary) 1px, transparent 1px), linear-gradient(to bottom, var(--primary) 1px, transparent 1px)",
						backgroundSize: "64px 64px",
						maskImage:
							"radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)",
					}}
				/>

				{/* Glowing orbs (Positioned closer to center, larger and more opaque) */}
				<div className="absolute top-[-10%] left-[20%] h-125 w-125 rounded-full bg-indigo-500/20 blur-[120px] mix-blend-normal animate-pulse duration-7000" />
				<div className="absolute top-[10%] right-[20%] h-150 w-150 rounded-full bg-cyan-500/15 blur-[120px] mix-blend-normal animate-pulse duration-10000" />
			</div>

			<div className="page-wrap relative z-10 w-full">
				<div className="mx-auto flex max-w-4xl flex-col items-center text-center">
					<h1
						className="display-title rise-in mb-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[5rem]"
						style={{ animationDelay: "100ms" }}
					>
						Make better money decisions,{" "}
						<span
							style={{
								background:
									"linear-gradient(135deg, var(--indigo) 0%, var(--cyan) 100%)",
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								backgroundClip: "text",
							}}
						>
							instantly.
						</span>
					</h1>

					<p
						className="rise-in mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
						style={{ animationDelay: "150ms" }}
					>
						No sign-ups. No data tracking. Just incredibly fast calculators for
						your salary, taxes, career growth, and retirement planning.
					</p>

					<div
						className="rise-in flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row"
						style={{ animationDelay: "200ms" }}
					>
						<a
							href="#tools"
							className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/40 sm:w-auto"
						>
							<span
								className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								style={{
									background:
										"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
								}}
							/>
							<span className="relative flex items-center gap-2">
								Explore all tools
								<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
							</span>
						</a>
						<a
							href="#why"
							className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-input bg-background px-8 text-base font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted active:scale-[0.98] sm:w-auto"
						>
							<Lock className="h-4 w-4 text-muted-foreground" />
							Why it's free
						</a>
					</div>

					<div
						className="rise-in mt-10 grid grid-cols-2 gap-4 text-sm font-medium text-muted-foreground sm:flex sm:justify-center sm:gap-6"
						style={{ animationDelay: "250ms" }}
					>
						{HERO_TRUST_POINTS.map((item) => (
							<span
								key={item.text}
								className="flex items-center justify-start gap-2"
							>
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
									<item.icon className="h-3.5 w-3.5" />
								</div>
								<span className="whitespace-nowrap">{item.text}</span>
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
