import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeftRight,
	ArrowRight,
	Briefcase,
	Building2,
	Calculator,
	Check,
	EyeOff,
	Flame,
	Home,
	Lightbulb,
	Lock,
	PiggyBank,
	TrendingUp,
	UserX,
	Wallet,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: HomePage });

// ─── Types & Data ─────────────────────────────────────────────────────────────

type Category = "all" | "salary" | "career" | "life" | "retirement";

const CATEGORIES: { id: Category; label: string }[] = [
	{ id: "all", label: "All Tools" },
	{ id: "salary", label: "Salary & Tax" },
	{ id: "career", label: "Career" },
	{ id: "life", label: "Life Decisions" },
	{ id: "retirement", label: "Retirement" },
];

const TOOLS = [
	{
		id: "inhand-salary",
		name: "In-Hand Salary Calculator",
		desc: "Convert your CTC to exact monthly take-home in seconds",
		category: "salary" as const,
		icon: Calculator,
		color: "text-primary",
		bg: "bg-primary/10",
		status: "live" as const,
		href: "/tools/inhand-salary",
	},
	{
		id: "tax-regime",
		name: "Tax Regime Comparison",
		desc: "Old vs New regime — see exactly which one saves you more",
		category: "salary" as const,
		icon: ArrowLeftRight,
		color: "text-[#06b6d4]",
		bg: "bg-[#06b6d4]/10",
		status: "live" as const,
		href: "/tools/tax-regime",
	},
	{
		id: "hra",
		name: "HRA Exemption Calculator",
		desc: "Calculate your exact HRA exemption and the tax you save",
		category: "salary" as const,
		icon: Building2,
		color: "text-[#8b5cf6]",
		bg: "bg-[#8b5cf6]/10",
		status: "coming-soon" as const,
		href: null,
	},
	{
		id: "salary-growth",
		name: "Salary Growth Calculator",
		desc: "Project your earnings and wealth over 5, 10, or 20 years",
		category: "career" as const,
		icon: TrendingUp,
		color: "text-[#10b981]",
		bg: "bg-[#10b981]/10",
		status: "coming-soon" as const,
		href: null,
	},
	{
		id: "offer-compare",
		name: "Offer Comparison Tool",
		desc: "Compare two job offers on in-hand pay, perks, and growth",
		category: "career" as const,
		icon: Briefcase,
		color: "text-[#f97316]",
		bg: "bg-[#f97316]/10",
		status: "coming-soon" as const,
		href: null,
	},
	{
		id: "buy-vs-rent",
		name: "Buy vs Rent Calculator",
		desc: "Is it smarter to buy a home or keep renting? Find out",
		category: "life" as const,
		icon: Home,
		color: "text-[#ec4899]",
		bg: "bg-[#ec4899]/10",
		status: "coming-soon" as const,
		href: null,
	},
	{
		id: "fire",
		name: "FIRE Number Calculator",
		desc: "How much do you need to retire early? Calculate your number",
		category: "retirement" as const,
		icon: Flame,
		color: "text-[#ef4444]",
		bg: "bg-[#ef4444]/10",
		status: "coming-soon" as const,
		href: null,
	},
	{
		id: "pf-maturity",
		name: "PF Maturity Calculator",
		desc: "Estimate your EPF corpus at retirement with projected returns",
		category: "retirement" as const,
		icon: PiggyBank,
		color: "text-[#f59e0b]",
		bg: "bg-[#f59e0b]/10",
		status: "coming-soon" as const,
		href: null,
	},
];

const TRUST_PILLARS = [
	{
		icon: Wallet,
		iconColor: "text-[#10b981]",
		iconBg: "bg-[#10b981]/10",
		heading: "Free, forever",
		desc: "Every tool on PayDisha is free to use. No subscriptions, no paywalls, no hidden premium tier.",
	},
	{
		icon: UserX,
		iconColor: "text-primary",
		iconBg: "bg-primary/10",
		heading: "No account needed",
		desc: "Open any tool and start immediately. No sign-up, no email, no password. Just you and the numbers.",
	},
	{
		icon: EyeOff,
		iconColor: "text-[#06b6d4]",
		iconBg: "bg-[#06b6d4]/10",
		heading: "Zero tracking",
		desc: "All calculations run entirely in your browser. We collect nothing — no usage data, no analytics, no cookies.",
	},
];

// ─── Page ─────────────────────────────────────────────────────────────────────

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

// ─── Nav ──────────────────────────────────────────────────────────────────────

function SiteNav() {
	return (
		<header
			className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md"
			style={{ background: "var(--header-bg)" }}
		>
			<nav className="page-wrap flex items-center justify-between py-3.5">
				<Logo />
				<div className="hidden items-center gap-7 md:flex">
					<a href="#tools" className="nav-link text-sm font-medium">
						All Tools
					</a>
					<a href="#why" className="nav-link text-sm font-medium">
						Why free?
					</a>
					<a href="#roadmap" className="nav-link text-sm font-medium">
						Roadmap
					</a>
				</div>
				<a
					href="#tools"
					className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-180 hover:opacity-90"
				>
					Browse Tools <ArrowRight className="h-3.5 w-3.5" />
				</a>
			</nav>
		</header>
	);
}

function Logo() {
	return (
		<div className="flex items-center gap-2">
			<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
				₹
			</span>
			<span className="text-lg font-bold tracking-tight text-foreground">
				Pay<span className="text-primary">Disha</span>
			</span>
		</div>
	);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
	return (
		<section
			className="relative overflow-hidden py-24 md:py-32 lg:py-40"
			style={{
				background:
					"radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79,70,229,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(6,182,212,0.1) 0%, transparent 60%)",
			}}
		>
			<div
				className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
				style={{
					backgroundImage:
						"linear-gradient(var(--indigo) 1px, transparent 1px), linear-gradient(90deg, var(--indigo) 1px, transparent 1px)",
					backgroundSize: "64px 64px",
				}}
			/>

			{/* Decorative ambient blur */}
			<div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />

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
								className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100 opacity-0"
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
						{[
							{ icon: Check, text: "100% Free" },
							{ icon: UserX, text: "No sign-up" },
							{ icon: EyeOff, text: "Zero tracking" },
						].map((item) => (
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

// ─── Tools Section ────────────────────────────────────────────────────────────

function ToolsSection() {
	const [active, setActive] = useState<Category>("all");

	const filtered =
		active === "all" ? TOOLS : TOOLS.filter((t) => t.category === active);
	const liveCount = filtered.filter((t) => t.status === "live").length;

	return (
		<section id="tools" className="py-24">
			<div className="page-wrap">
				<div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="island-kicker mb-2">The Toolbox</p>
						<h2 className="display-title text-4xl font-bold text-foreground md:text-5xl">
							Pick your tool
						</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						{filtered.length} tool{filtered.length !== 1 ? "s" : ""} &middot;{" "}
						<span className="font-medium text-[#10b981]">
							{liveCount} live now
						</span>
					</p>
				</div>

				<div className="mb-8 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
					{CATEGORIES.map((cat) => (
						<button
							key={cat.id}
							type="button"
							onClick={() => setActive(cat.id)}
							className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-180 ${
								active === cat.id
									? "bg-primary text-white"
									: "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
							}`}
						>
							{cat.label}
						</button>
					))}
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{filtered.map((tool) => (
						<ToolCard key={tool.id} tool={tool} />
					))}
				</div>
			</div>
		</section>
	);
}

function ToolCard({ tool }: { tool: (typeof TOOLS)[number] }) {
	const isLive = tool.status === "live";
	const categoryLabel =
		CATEGORIES.find((c) => c.id === tool.category)?.label ?? tool.category;

	const inner = (
		<div
			className={`feature-card group relative flex h-full flex-col rounded-2xl border border-border p-5 ${
				isLive ? "cursor-pointer" : "cursor-default opacity-60"
			}`}
		>
			{!isLive && (
				<span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
					<Lock className="h-2.5 w-2.5" />
					Soon
				</span>
			)}

			<div
				className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${tool.bg}`}
			>
				<tool.icon
					className={`h-5 w-5 ${isLive ? tool.color : "text-muted-foreground"}`}
				/>
			</div>

			<p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
				{categoryLabel}
			</p>
			<h3 className="mb-1.5 font-semibold leading-snug text-foreground">
				{tool.name}
			</h3>
			<p className="flex-1 text-sm leading-relaxed text-muted-foreground">
				{tool.desc}
			</p>

			<div className="mt-4 flex items-center gap-1 text-sm font-semibold">
				{isLive ? (
					<>
						<span className="text-primary">Open tool</span>
						<ArrowRight className="h-3.5 w-3.5 text-primary transition-transform duration-180 group-hover:translate-x-0.5" />
					</>
				) : (
					<span className="text-muted-foreground">Coming soon</span>
				)}
			</div>
		</div>
	);

	return isLive ? (
		<Link to={tool.href ?? "#"} className="h-full">
			{inner}
		</Link>
	) : (
		<div className="h-full">{inner}</div>
	);
}

// ─── Trust Pillars ────────────────────────────────────────────────────────────

function TrustPillars() {
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
					{TRUST_PILLARS.map((p) => (
						<div
							key={p.heading}
							className="island-shell rounded-2xl p-7 text-center"
						>
							<div
								className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${p.iconBg}`}
							>
								<p.icon className={`h-7 w-7 ${p.iconColor}`} />
							</div>
							<h3 className="mb-2 text-lg font-bold text-foreground">
								{p.heading}
							</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{p.desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// ─── Coming Soon Banner ───────────────────────────────────────────────────────

function ComingSoonBanner() {
	const upcoming = TOOLS.filter((t) => t.status === "coming-soon");

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

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
	return (
		<section
			className="relative overflow-hidden py-20"
			style={{
				background:
					"linear-gradient(135deg, var(--indigo-deep) 0%, var(--indigo) 55%, #6366f1 100%)",
			}}
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 65% 70% at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 70%)",
				}}
			/>
			<div className="page-wrap relative text-center">
				<p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-white/55">
					Start now — no account needed
				</p>
				<h2 className="display-title mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
					Start with any tool. Always free.
				</h2>
				<p className="mx-auto mb-8 max-w-md text-lg text-white/65">
					No spreadsheets. No CA required. Open a tool, get the number you need,
					and move on with your day.
				</p>
				<a
					href="#tools"
					className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold shadow-xl transition-all duration-180 hover:opacity-95 hover:-translate-y-0.5"
					style={{ color: "var(--indigo-deep)" }}
				>
					Browse all tools
					<ArrowRight className="h-4 w-4" />
				</a>
			</div>
		</section>
	);
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function SiteFooter() {
	const links = {
		Tools: [
			"In-Hand Salary Calculator",
			"Tax Regime Comparison",
			"HRA Calculator",
			"FIRE Number Calculator",
		],
		Company: ["About", "Blog", "Changelog", "Contact"],
		Legal: ["Privacy Policy", "Terms of Use"],
	};

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
					{Object.entries(links).map(([heading, items]) => (
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
