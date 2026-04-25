import {
	AlertTriangle,
	BarChart3,
	ChevronDown,
	Clock3,
	IndianRupee,
	Landmark,
	LineChart as LineChartIcon,
	WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

import { Badge } from "#/components/ui/badge";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { cn } from "#/lib/utils";
import type { calculateBuyVsRent } from "#/tools/buy-vs-rent/calculator";
import { formatCurrency } from "#/tools/buy-vs-rent/calculator";
import { VERDICT_LABELS } from "#/tools/buy-vs-rent/constants";
import { formatMonthly } from "#/tools/buy-vs-rent/page-state";
import {
	resultCardGridClassName,
	resultSectionClassName,
	resultsColumnClassName,
	sectionLabelClassName,
	subSurfaceClassName,
} from "#/tools/buy-vs-rent/page-ui";

type BuyVsRentResult = ReturnType<typeof calculateBuyVsRent>;

function getVerdictTheme(verdict: BuyVsRentResult["decision"]["verdict"]) {
	if (verdict === "buy") {
		return {
			hero: "border-emerald-900/20 bg-[linear-gradient(135deg,#064e3b_0%,#0f766e_48%,#155e75_100%)] text-white shadow-lg shadow-emerald-700/15",
			accent: "text-emerald-100",
			badge: "border-white/20 bg-white/10 text-white",
		};
	}

	if (verdict === "rent") {
		return {
			hero: "border-sky-900/20 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#0891b2_100%)] text-white shadow-lg shadow-blue-700/15",
			accent: "text-sky-100",
			badge: "border-white/20 bg-white/10 text-white",
		};
	}

	return {
		hero: "border-amber-900/20 bg-[linear-gradient(135deg,#78350f_0%,#b45309_48%,#0f766e_100%)] text-white shadow-lg shadow-amber-700/15",
		accent: "text-amber-100",
		badge: "border-white/20 bg-white/10 text-white",
	};
}

function getConfidenceLabel(
	confidence: BuyVsRentResult["decision"]["confidence"],
) {
	if (confidence === "strong-signal") return "Strong signal";
	if (confidence === "sensitive") return "Sensitive";
	return "Close call";
}

function getAffordabilityCopy(
	band: BuyVsRentResult["decision"]["affordabilityBand"],
) {
	if (band === "comfortable") return "Comfortable";
	if (band === "watch") return "Watch";
	return "Stretched";
}

function formatPressure(value: number | null) {
	if (value === null) return "N/A";
	return `${(value * 100).toFixed(0)}%`;
}

function useIsSmUp() {
	const [isSmUp, setIsSmUp] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(min-width: 640px)");
		const update = () => setIsSmUp(mql.matches);
		update();
		mql.addEventListener("change", update);
		return () => mql.removeEventListener("change", update);
	}, []);

	return isSmUp;
}

function computeYearTicks(maxYear: number, maxCount = 6): number[] {
	if (maxYear <= 0) return [0];
	const niceSteps = [1, 2, 5, 10, 20, 25, 50];
	let step = 1;
	for (const candidate of niceSteps) {
		if (Math.floor(maxYear / candidate) + 1 <= maxCount) {
			step = candidate;
			break;
		}
	}

	const ticks = [0];
	for (let value = step; value < maxYear; value += step) {
		ticks.push(value);
	}
	if (ticks[ticks.length - 1] !== maxYear) ticks.push(maxYear);
	return ticks;
}

function formatYearTick(value: number, short: boolean) {
	if (value <= 0) return short ? "0" : "Now";
	return short ? String(value) : `Year ${value}`;
}

export function ResultsColumnLoadingFallback() {
	return (
		<div className={resultsColumnClassName}>
			<div className="h-64 rounded-2xl bg-muted/60" />
			<div className={resultCardGridClassName}>
				<div className="h-32 rounded-2xl bg-muted/55" />
				<div className="h-32 rounded-2xl bg-muted/55" />
				<div className="h-32 rounded-2xl bg-muted/55" />
			</div>
			<div className="h-56 rounded-2xl bg-muted/50" />
			<div className="h-72 rounded-2xl bg-muted/50" />
		</div>
	);
}

export function ResultsColumn({
	result,
	detailsOpen,
	setDetailsOpen,
}: {
	result: BuyVsRentResult;
	detailsOpen: boolean;
	setDetailsOpen: (value: boolean) => void;
}) {
	return (
		<div className={resultsColumnClassName}>
			<VerdictHero result={result} />
			<DecisionMetrics result={result} />
			<AnswerChangingLevers result={result} />
			<AdvantageChart result={result} />
			<DetailsPanel
				result={result}
				detailsOpen={detailsOpen}
				setDetailsOpen={setDetailsOpen}
			/>
		</div>
	);
}

function VerdictHero({ result }: { result: BuyVsRentResult }) {
	const theme = getVerdictTheme(result.decision.verdict);

	return (
		<section
			className={cn(
				"min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5",
				theme.hero,
			)}
		>
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="min-w-0">
					<p className={cn("text-sm font-medium", theme.accent)}>
						Informed choice
					</p>
					<h2 className="mt-1 text-3xl font-black leading-none sm:text-5xl">
						{result.decision.headline}
					</h2>
					<p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-white/88 sm:text-base">
						{result.decision.explanation}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap gap-2">
					<Badge variant="outline" className={cn("rounded-full", theme.badge)}>
						{getConfidenceLabel(result.decision.confidence)}
					</Badge>
					<Badge variant="outline" className={cn("rounded-full", theme.badge)}>
						{VERDICT_LABELS[result.decision.verdict]}
					</Badge>
				</div>
			</div>

			<div className="mt-4 rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm leading-relaxed text-white/78">
				{result.decision.liquidityNote}
			</div>
		</section>
	);
}

function DecisionMetrics({ result }: { result: BuyVsRentResult }) {
	const wealthWinner =
		result.decision.wealthGap >= 0 ? "Buying ahead" : "Renting ahead";

	return (
		<section className={resultSectionClassName}>
			<div className="mb-4">
				<h2 className="text-xl font-semibold text-foreground">
					Decision snapshot
				</h2>
				<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
					The four numbers to check before you go deeper.
				</p>
			</div>
			<div className={resultCardGridClassName}>
				<MetricCard
					icon={IndianRupee}
					label="Wealth gap"
					value={formatCurrency(Math.abs(result.decision.wealthGap))}
					subtext={wealthWinner}
				/>
				<MetricCard
					icon={Clock3}
					label="Break-even stay"
					value={
						result.decision.breakEvenYear
							? `Year ${result.decision.breakEvenYear}`
							: "No catch-up"
					}
					subtext="When buying first beats renting."
				/>
				<MetricCard
					icon={Landmark}
					label="Cash needed"
					value={formatCurrency(result.decision.upfrontCashNeeded)}
					subtext={
						result.decision.cashShortfall > 0
							? `Short by ${formatCurrency(result.decision.cashShortfall)}.`
							: "Covered by the cash you entered."
					}
				/>
				<MetricCard
					icon={WalletCards}
					label="Monthly pressure"
					value={`${formatPressure(result.decision.buyMonthlyPressure)} vs ${formatPressure(result.decision.rentMonthlyPressure)}`}
					subtext={`Buy vs rent share of take-home. ${getAffordabilityCopy(result.decision.affordabilityBand)}.`}
				/>
			</div>
		</section>
	);
}

function MetricCard({
	icon: Icon,
	label,
	value,
	subtext,
}: {
	icon: typeof IndianRupee;
	label: string;
	value: string;
	subtext: string;
}) {
	return (
		<div className={cn(subSurfaceClassName, "min-w-0 p-3.5 sm:p-4")}>
			<div className="mb-2 flex items-center gap-2">
				<span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon className="size-3.5" />
				</span>
				<p className="text-sm font-semibold text-foreground">{label}</p>
			</div>
			<p className="wrap-break-word text-xl font-bold tracking-tight text-foreground sm:text-2xl">
				{value}
			</p>
			<p className="mt-1.5 text-sm leading-snug text-muted-foreground">
				{subtext}
			</p>
		</div>
	);
}

function AnswerChangingLevers({ result }: { result: BuyVsRentResult }) {
	return (
		<section className={resultSectionClassName}>
			<div className="mb-4 flex items-center gap-2">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<BarChart3 className="size-4" />
				</span>
				<h2 className="text-xl font-semibold text-foreground">
					What could change this result
				</h2>
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{result.decision.answerChangingLevers.map((lever) => (
					<div
						key={`${lever.label}-${lever.value}`}
						className={cn(
							"min-w-0 rounded-xl border p-4",
							lever.tone === "buy" &&
								"border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/80 dark:bg-emerald-950/20",
							lever.tone === "rent" &&
								"border-sky-200/80 bg-sky-50/80 dark:border-sky-900/80 dark:bg-sky-950/20",
							lever.tone === "neutral" && "border-border/80 bg-muted/35",
						)}
					>
						<p className="text-sm font-semibold text-foreground">
							{lever.label}
						</p>
						<p className="mt-1 wrap-break-word text-xl font-bold text-foreground">
							{lever.value}
						</p>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{lever.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function AdvantageChart({ result }: { result: BuyVsRentResult }) {
	const isSmUp = useIsSmUp();
	const chartConfig: ChartConfig = {
		gap: {
			label: "Buying advantage",
			color: "var(--chart-5)",
		},
	};
	const chartData = result.points.map((point, index) => ({
		yearOffset: index,
		label: point.label,
		gap: point.gap,
	}));
	const maxYear = chartData.at(-1)?.yearOffset ?? 0;
	const xAxisTicks = computeYearTicks(maxYear, isSmUp ? 6 : 5);

	return (
		<section className={resultSectionClassName}>
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className={sectionLabelClassName}>Buying advantage over time</p>
					<h2 className="text-xl font-semibold text-foreground">
						Where the decision flips
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Above zero means buying is ahead. Below zero means renting is ahead.
					</p>
				</div>
				<Badge variant="outline" className="w-fit rounded-full">
					<LineChartIcon className="mr-1 size-3" />
					{getConfidenceLabel(result.decision.confidence)}
				</Badge>
			</div>

			<ChartContainer config={chartConfig} className="h-64 w-full sm:h-80">
				<ComposedChart
					accessibilityLayer
					data={chartData}
					margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						type="number"
						dataKey="yearOffset"
						domain={[0, maxYear]}
						ticks={xAxisTicks}
						tickLine={false}
						axisLine={false}
						interval={0}
						allowDecimals={false}
						padding={{ left: 8, right: 8 }}
						tick={{ fontSize: 11 }}
						tickFormatter={(value) => formatYearTick(Number(value), !isSmUp)}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						width={48}
						tick={{ fontSize: 11 }}
						tickFormatter={(value) =>
							formatCurrency(Number(value)).replace("₹", "")
						}
					/>
					<ReferenceLine
						y={0}
						stroke="var(--muted-foreground)"
						strokeDasharray="4 4"
						ifOverflow="extendDomain"
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								labelFormatter={(_value, payload) =>
									payload?.[0]?.payload?.label ?? ""
								}
								formatter={(value, name) => (
									<div className="flex min-w-44 items-center justify-between gap-4">
										<span className="text-muted-foreground">
											{chartConfig[String(name)]?.label ?? String(name)}
										</span>
										<span className="font-semibold text-foreground">
											{formatCurrency(Number(value))}
										</span>
									</div>
								)}
							/>
						}
					/>
					<Area
						type="monotone"
						dataKey="gap"
						stroke="var(--color-gap)"
						fill="var(--color-gap)"
						strokeWidth={3}
						fillOpacity={0.18}
						dot={false}
					/>
				</ComposedChart>
			</ChartContainer>
		</section>
	);
}

function DetailsPanel({
	result,
	detailsOpen,
	setDetailsOpen,
}: {
	result: BuyVsRentResult;
	detailsOpen: boolean;
	setDetailsOpen: (value: boolean) => void;
}) {
	return (
		<Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
			<section className={resultSectionClassName}>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className={sectionLabelClassName}>Details</p>
						<h2 className="text-xl font-semibold text-foreground">
							Assumptions and year-by-year math
						</h2>
						<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
							Collapsed by default so the main decision stays readable.
						</p>
					</div>
					<CollapsibleTrigger asChild>
						<button
							type="button"
							aria-label={detailsOpen ? "Collapse details" : "Expand details"}
							className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
						>
							<ChevronDown
								className={cn(
									"size-4 transition-transform",
									detailsOpen && "rotate-180",
								)}
							/>
						</button>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent className="mt-5 space-y-5">
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<SmallDetail
							label="Loan rate"
							value={`${result.inputs.loanRatePct}%`}
						/>
						<SmallDetail
							label="Extra buying costs"
							value={`${result.inputs.extraBuyingCostPct}%`}
						/>
						<SmallDetail
							label="Home growth"
							value={`${result.inputs.propertyAppreciationPct}%/yr`}
						/>
						<SmallDetail
							label="Investment return"
							value={`${result.inputs.investmentReturnPct}%/yr`}
						/>
					</div>

					<div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/20 dark:text-amber-100">
						<div className="flex gap-2">
							<AlertTriangle className="mt-0.5 size-4 shrink-0" />
							<p>
								Tax benefits are excluded from the default verdict. HRA and
								home-loan deductions depend on salary structure, regime, and
								eligibility.
							</p>
						</div>
					</div>

					<div>
						<p className="mb-3 text-sm font-semibold text-foreground">
							Scenario check
						</p>
						<div className="grid gap-3 sm:grid-cols-3">
							{result.decision.scenarios.map((scenario) => (
								<div
									key={scenario.name}
									className="rounded-xl border border-border/80 bg-background/60 p-3"
								>
									<p className="text-sm font-semibold text-foreground">
										{scenario.name}
									</p>
									<p className="mt-1 text-lg font-bold text-foreground">
										{VERDICT_LABELS[scenario.verdict]}
									</p>
									<p className="text-xs text-muted-foreground">
										Gap {formatCurrency(Math.abs(scenario.gap))}
									</p>
								</div>
							))}
						</div>
					</div>

					<div className="-mx-4 overflow-x-auto sm:mx-0">
						<Table className="min-w-160">
							<TableHeader>
								<TableRow>
									<TableHead>Year</TableHead>
									<TableHead>Buy net worth</TableHead>
									<TableHead>Rent net worth</TableHead>
									<TableHead>Gap</TableHead>
									<TableHead>Buy cost</TableHead>
									<TableHead>Rent cost</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{result.points.map((point) => (
									<TableRow key={point.label}>
										<TableCell className="font-medium">{point.label}</TableCell>
										<TableCell>{formatCurrency(point.buyNetWorth)}</TableCell>
										<TableCell>{formatCurrency(point.rentNetWorth)}</TableCell>
										<TableCell
											className={cn(
												point.gap >= 0 ? "text-emerald-600" : "text-sky-600",
											)}
										>
											{formatCurrency(point.gap)}
										</TableCell>
										<TableCell>
											{point.label === "Now"
												? "-"
												: formatMonthly(point.buyMonthlyCost)}
										</TableCell>
										<TableCell>
											{point.label === "Now"
												? "-"
												: formatMonthly(point.rentMonthlyCost)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
}

function SmallDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-border/80 bg-muted/35 p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
		</div>
	);
}
