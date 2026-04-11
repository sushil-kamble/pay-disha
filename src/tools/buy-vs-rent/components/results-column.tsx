import {
	AlertTriangle,
	Home,
	Landmark,
	LineChart as LineChartIcon,
	PiggyBank,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

import { Badge } from "#/components/ui/badge";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { Switch } from "#/components/ui/switch";
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
import {
	BUY_VS_RENT_BENCHMARKS,
	BUY_VS_RENT_MARKET_ASSUMPTIONS,
	BUY_VS_RENT_SCENARIO_LABELS,
	BUY_VS_RENT_VERDICT_LABELS,
} from "#/tools/buy-vs-rent/constants";
import { formatCurrency } from "#/tools/buy-vs-rent/insights";
import { formatMonthly } from "#/tools/buy-vs-rent/page-state";
import {
	resultCardGridClassName,
	resultSectionClassName,
	resultSectionHeaderClassName,
	resultsColumnClassName,
	sectionLabelClassName,
	subSurfaceClassName,
} from "#/tools/buy-vs-rent/page-ui";
import type {
	AffordabilityBenchmark,
	BenchmarkBand,
} from "#/tools/buy-vs-rent/types";

type BuyVsRentResult = ReturnType<typeof calculateBuyVsRent>;

function getVerdictTheme(verdict: "buy" | "rent" | "close-call") {
	if (verdict === "buy") {
		return {
			card: "bg-[linear-gradient(135deg,#0f766e_0%,#115e59_42%,#164e63_100%)] text-white shadow-lg shadow-teal-500/20",
			kicker: "text-teal-100",
			badge: "border-white/20 bg-white/10 text-white",
		};
	}

	if (verdict === "rent") {
		return {
			card: "bg-[linear-gradient(135deg,#1e293b_0%,#312e81_50%,#1d4ed8_100%)] text-white shadow-lg shadow-indigo-500/20",
			kicker: "text-indigo-100",
			badge: "border-white/20 bg-white/10 text-white",
		};
	}

	return {
		card: "bg-[linear-gradient(135deg,#92400e_0%,#b45309_45%,#0f766e_100%)] text-white shadow-lg shadow-amber-500/20",
		kicker: "text-amber-100",
		badge: "border-white/20 bg-white/10 text-white",
	};
}

function getInsightToneClasses(tone: "positive" | "neutral" | "caution") {
	if (tone === "positive") {
		return "border-emerald-200/80 bg-emerald-50/85 text-emerald-950 dark:border-emerald-900/80 dark:bg-emerald-950/30 dark:text-emerald-100";
	}

	if (tone === "caution") {
		return "border-amber-200/80 bg-amber-50/90 text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/30 dark:text-amber-100";
	}

	return "border-border/80 bg-muted/35 text-foreground";
}

function getBenchmarkBandClasses(band: BenchmarkBand) {
	if (band === "good") {
		return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/30 dark:text-emerald-200";
	}

	if (band === "risky") {
		return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/30 dark:text-amber-200";
	}

	return "border-primary/20 bg-primary/10 text-primary";
}

function getBenchmarkBandLabel(band: BenchmarkBand) {
	if (band === "good") return "Good";
	if (band === "watch") return "Watch";
	return "Risky";
}

function getBenchmarkThresholdCopy(benchmark: AffordabilityBenchmark) {
	switch (benchmark.id) {
		case "price-to-income":
			return `Good up to ${BUY_VS_RENT_BENCHMARKS.priceToIncome.goodMax.toFixed(1)}x, watch up to ${BUY_VS_RENT_BENCHMARKS.priceToIncome.watchMax.toFixed(1)}x, risky above that.`;
		case "emi-to-income":
			return `Good up to ${(BUY_VS_RENT_BENCHMARKS.emiToIncome.goodMax * 100).toFixed(0)}%, watch up to ${(BUY_VS_RENT_BENCHMARKS.emiToIncome.watchMax * 100).toFixed(0)}%, risky above that.`;
		case "age-repayment-fit":
			return `Good if the modeled housing commitment ends by age ${BUY_VS_RENT_BENCHMARKS.ageTenure.goodMaxLoanEndAge}, watch up to age ${BUY_VS_RENT_BENCHMARKS.ageTenure.watchMaxLoanEndAge}, risky above that.`;
	}
}

function getBenchmarkValueDisplay(benchmark: AffordabilityBenchmark) {
	if (benchmark.id === "age-repayment-fit") {
		return `age ${benchmark.metricValue}`;
	}

	return benchmark.value;
}

function scaleToToday(value: number, inflationRatePct: number, years: number) {
	if (years <= 0 || inflationRatePct <= 0) return value;
	return value / (1 + inflationRatePct / 100) ** years;
}

function buildXAxisTicks(labels: string[], maxTicks = 10) {
	if (labels.length <= maxTicks) return labels;

	const lastIndex = labels.length - 1;
	const step = Math.max(1, Math.floor(lastIndex / (maxTicks - 1)));
	const ticks = [labels[0]];

	for (
		let index = step;
		index < lastIndex && ticks.length < maxTicks - 1;
		index += step
	) {
		ticks.push(labels[index]);
	}

	ticks.push(labels[lastIndex]);
	return ticks;
}

export function ResultsColumnLoadingFallback() {
	return (
		<div className={resultsColumnClassName}>
			<div className="h-64 rounded-2xl bg-muted/60" />
			<div className={resultCardGridClassName}>
				<div className="h-36 rounded-2xl bg-muted/55" />
				<div className="h-36 rounded-2xl bg-muted/55" />
				<div className="h-36 rounded-2xl bg-muted/55" />
				<div className="h-36 rounded-2xl bg-muted/55" />
			</div>
			<div className="h-96 rounded-3xl bg-muted/50" />
			<div className="h-80 rounded-3xl bg-muted/50" />
			<div className="h-52 rounded-3xl bg-muted/45" />
			<div className="h-64 rounded-3xl bg-muted/45" />
			<div className="h-96 rounded-3xl bg-muted/45" />
		</div>
	);
}

export function ResultsColumn({
	result,
	showRealView,
	setShowRealView,
}: {
	result: BuyVsRentResult;
	showRealView: boolean;
	setShowRealView: (value: boolean) => void;
}) {
	return (
		<div className={resultsColumnClassName}>
			<VerdictHero result={result} />
			<SummaryCards result={result} />
			<BenchmarkGuardrails result={result} />
			<NetWorthChart
				result={result}
				showRealView={showRealView}
				setShowRealView={setShowRealView}
			/>
			<CashFlowChart result={result} />
			<ScenarioCards result={result} />
			<DecisionContext result={result} />
			<InsightsGrid result={result} />
			<ComparisonTable result={result} />
		</div>
	);
}

const resultToggleCardClassName =
	"w-full sm:max-w-[15.5rem] rounded-2xl border border-border bg-background/70 px-4 py-3";

function VerdictHero({ result }: { result: BuyVsRentResult }) {
	const theme = getVerdictTheme(result.summary.verdict);

	return (
		<div className={cn("overflow-hidden rounded-2xl p-5", theme.card)}>
			<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div>
					<p className={cn("mb-1 text-xs font-medium", theme.kicker)}>
						Buy vs Rent
					</p>
					<h2 className="text-4xl font-black leading-none md:text-5xl">
						{BUY_VS_RENT_VERDICT_LABELS[result.summary.verdict]}
					</h2>
					<p className="mt-2 text-base font-semibold text-white/90">
						{result.summary.verdict === "close-call"
							? "Both paths are financially close right now."
							: `${BUY_VS_RENT_VERDICT_LABELS[result.summary.verdict]} looks stronger for the next ${result.summary.horizonYears} years.`}
					</p>
					<p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/80">
						{result.summary.story}
					</p>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<Badge
						variant="outline"
						className={cn(
							"rounded-full px-2.5 py-0.5 text-xs font-semibold",
							theme.badge,
						)}
					>
						{result.summary.confidence} scenario agreement
					</Badge>
					<Badge
						variant="outline"
						className={cn(
							"rounded-full px-2.5 py-0.5 text-xs font-semibold",
							theme.badge,
						)}
					>
						Gap {formatCurrency(Math.abs(result.summary.financialGap))}
					</Badge>
				</div>
			</div>

			<div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
				<div className="divide-y divide-white/10">
					<div className="flex items-center justify-between gap-4 py-2.5">
						<div>
							<p className="text-sm font-medium text-white">Break-even</p>
							<p className="text-xs text-white/60">
								When buying catches up to renting.
							</p>
						</div>
						<p className="text-xl font-bold text-white tabular-nums">
							{result.summary.breakEvenYear
								? `Year ${result.summary.breakEvenYear}`
								: "No catch-up"}
						</p>
					</div>
					<div className="flex items-center justify-between gap-4 py-2.5">
						<div>
							<p className="text-sm font-medium text-white">
								Upfront difference
							</p>
							<p className="text-xs text-white/60">
								{result.summary.upfrontGap >= 0
									? "Buying asks for more cash on day one."
									: "Renting asks for more cash on day one."}
							</p>
						</div>
						<p className="text-xl font-bold text-white tabular-nums">
							{formatCurrency(Math.abs(result.summary.upfrontGap))}
						</p>
					</div>
					<div className="flex items-center justify-between gap-4 py-2.5">
						<div>
							<p className="text-sm font-medium text-white">Ending gap</p>
							<p className="text-xs text-white/60">
								Difference between the two paths at the finish.
							</p>
						</div>
						<p className="text-xl font-bold text-white tabular-nums">
							{formatCurrency(Math.abs(result.summary.financialGap))}
						</p>
					</div>
				</div>
			</div>
			<p className="mt-3 text-xs leading-relaxed text-white/55">
				{result.summary.decisionNote}
			</p>
		</div>
	);
}

function SummaryCards({ result }: { result: BuyVsRentResult }) {
	const emphasizeBuy = result.summary.buyNetWorth > result.summary.rentNetWorth;
	const emphasizeRent =
		result.summary.rentNetWorth > result.summary.buyNetWorth;

	return (
		<section className={resultSectionClassName}>
			<div className="mb-4">
				<p className={sectionLabelClassName}>At a glance</p>
				<h2 className="text-xl font-semibold text-foreground">
					How the two paths compare right now
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					A quick read on ending wealth and the monthly pressure in year one
					versus the finish.
				</p>
			</div>
			<div className={resultCardGridClassName}>
				<SummaryCard
					icon={Home}
					label="Buyer ends with"
					value={formatCurrency(result.summary.buyNetWorth)}
					subtext="Saleable home equity plus invested surplus cash"
					emphasis={emphasizeBuy}
					emphasisTone="buy"
				/>
				<SummaryCard
					icon={PiggyBank}
					label="Renter ends with"
					value={formatCurrency(result.summary.rentNetWorth)}
					subtext="Investment corpus plus refundable deposit"
					emphasis={emphasizeRent}
					emphasisTone="rent"
				/>
				<SummaryCard
					icon={Landmark}
					label="Year 1 outgo"
					value={`${formatMonthly(result.summary.firstYearBuyMonthlyOutgo)} vs ${formatMonthly(result.summary.firstYearRentMonthlyOutgo)}`}
					subtext="Buy vs rent monthly cash burn in the first year"
				/>
				<SummaryCard
					icon={TrendingUp}
					label="At the finish"
					value={`${formatMonthly(result.summary.finalYearBuyMonthlyOutgo)} vs ${formatMonthly(result.summary.finalYearRentMonthlyOutgo)}`}
					subtext={
						result.summary.finalYearBuyStressRatio !== null &&
						result.summary.finalYearRentStressRatio !== null
							? `Final-year affordability: ${(result.summary.finalYearBuyStressRatio * 100).toFixed(0)}% vs ${(result.summary.finalYearRentStressRatio * 100).toFixed(0)}% of estimated take-home`
							: "Buy vs rent monthly outgo in the final year"
					}
				/>
			</div>
		</section>
	);
}

function SummaryCard({
	icon: Icon,
	label,
	value,
	subtext,
	emphasis,
	emphasisTone,
}: {
	icon: typeof Home;
	label: string;
	value: string;
	subtext: string;
	emphasis?: boolean;
	emphasisTone?: "buy" | "rent";
}) {
	const emphasisTheme =
		emphasisTone === "rent" ? getVerdictTheme("rent") : getVerdictTheme("buy");

	return (
		<div
			className={cn(
				"relative h-full overflow-hidden rounded-2xl border p-5",
				emphasis ? emphasisTheme.card : subSurfaceClassName,
			)}
		>
			<div className="mb-3 flex items-center gap-2">
				<div
					className={cn(
						"flex size-9 items-center justify-center rounded-xl",
						emphasis ? "bg-white/12" : "bg-primary/10 text-primary",
					)}
				>
					<Icon className="size-4" />
				</div>
				<p
					className={cn(
						"text-sm font-semibold",
						emphasis ? "text-white" : "text-foreground",
					)}
				>
					{label}
				</p>
			</div>
			<p className="text-2xl font-bold">{value}</p>
			<p
				className={cn(
					"mt-2 text-sm leading-relaxed",
					emphasis ? "text-white/80" : "text-muted-foreground",
				)}
			>
				{subtext}
			</p>
		</div>
	);
}

function BenchmarkGuardrails({ result }: { result: BuyVsRentResult }) {
	const riskyBenchmarks = result.summary.affordabilityBenchmarks.filter(
		(benchmark) => benchmark.band === "risky",
	);
	const watchBenchmarks = result.summary.affordabilityBenchmarks.filter(
		(benchmark) => benchmark.band === "watch",
	);
	const hasFlags = riskyBenchmarks.length > 0 || watchBenchmarks.length > 0;

	return (
		<section className={resultSectionClassName}>
			<div className={resultSectionHeaderClassName}>
				<div>
					<p className={sectionLabelClassName}>Affordability guardrails</p>
					<h2 className="text-xl font-semibold text-foreground">
						What the watch or risky flags actually mean
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						These checks do not override the verdict. They explain where the
						plan starts looking stretched in real life.
					</p>
				</div>
				<div
					className={cn(
						"rounded-2xl border px-4 py-3",
						hasFlags
							? "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/80 dark:bg-amber-950/20"
							: "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/80 dark:bg-emerald-950/20",
					)}
				>
					<p className="text-sm font-semibold text-foreground">
						{riskyBenchmarks.length} risky · {watchBenchmarks.length} watch
					</p>
					<p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
						{hasFlags
							? "The cards below show the exact guardrails that are flashing."
							: "All current benchmark checks are in the comfortable zone."}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-2xl border border-border/70 bg-background/60">
				{result.summary.affordabilityBenchmarks.map((benchmark) => (
					<div
						key={benchmark.id}
						className={cn(
							"border-b border-border/60 px-4 py-5 last:border-b-0 transition-colors",
							benchmark.band === "risky"
								? "bg-amber-50/80 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"
								: benchmark.band === "watch"
									? "bg-primary/5 text-foreground"
									: "bg-emerald-50/60 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100",
						)}
					>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<p className="text-sm font-semibold tracking-tight text-foreground">
										{benchmark.label}
									</p>
									<Badge
										variant="outline"
										className={cn(
											"rounded-full border px-2.5 py-0.5 text-xs font-semibold",
											getBenchmarkBandClasses(benchmark.band),
										)}
									>
										{getBenchmarkBandLabel(benchmark.band)}
									</Badge>
								</div>
								<p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-85">
									{benchmark.description}
								</p>
								<p className="mt-2 text-xs leading-relaxed opacity-75">
									{getBenchmarkThresholdCopy(benchmark)}
								</p>
								{benchmark.band !== "good" ? (
									<div className="mt-3 flex items-start gap-2 rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-xs leading-relaxed text-foreground">
										<AlertTriangle
											className={cn(
												"mt-0.5 size-3.5 shrink-0",
												benchmark.band === "risky"
													? "text-amber-600"
													: "text-primary",
											)}
										/>
										<span>
											This benchmark is currently in the{" "}
											<span className="font-semibold">
												{getBenchmarkBandLabel(benchmark.band).toLowerCase()}
											</span>{" "}
											zone, which is why the benchmark summary count increased.
										</span>
									</div>
								) : null}
							</div>
							<div className="shrink-0 sm:pl-4 sm:text-right">
								<p className="whitespace-nowrap text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
									{getBenchmarkValueDisplay(benchmark)}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function NetWorthChart({
	result,
	showRealView,
	setShowRealView,
}: {
	result: BuyVsRentResult;
	showRealView: boolean;
	setShowRealView: (value: boolean) => void;
}) {
	const chartConfig: ChartConfig = {
		gap: {
			label: showRealView
				? "Buying advantage (today's money)"
				: "Buying advantage",
			color: "var(--chart-5)",
		},
	};

	const chartData = result.points.map((point) => ({
		label: point.label,
		gap: showRealView ? point.realGap : point.gap,
	}));
	const xAxisTicks = buildXAxisTicks(chartData.map((point) => point.label));

	return (
		<section className={resultSectionClassName}>
			<div className={resultSectionHeaderClassName}>
				<div>
					<p className={sectionLabelClassName}>The future path</p>
					<h2 className="text-xl font-semibold text-foreground">
						Buying advantage over time
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Above zero means buying is ahead. Below zero means renting is ahead.
						This is the clearest view of when the decision actually flips.
					</p>
				</div>
				<div className={resultToggleCardClassName}>
					<div className="flex items-center gap-3">
						<div>
							<p className="text-sm font-semibold text-foreground">
								View in today's money
							</p>
							<p className="text-xs text-muted-foreground">
								Adjusts the advantage for inflation.
							</p>
						</div>
						<Switch
							checked={showRealView}
							onCheckedChange={setShowRealView}
							aria-label="Show inflation-adjusted buying advantage"
						/>
					</div>
				</div>
			</div>

			<ChartContainer config={chartConfig} className="h-80 w-full">
				<ComposedChart
					accessibilityLayer
					data={chartData}
					margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="label"
						ticks={xAxisTicks}
						tickLine={false}
						axisLine={false}
						minTickGap={18}
						interval={0}
						padding={{ left: 8, right: 20 }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						width={60}
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

function CashFlowChart({ result }: { result: BuyVsRentResult }) {
	const [showRealCashFlow, setShowRealCashFlow] = useState(false);
	const chartConfig: ChartConfig = {
		buyMonthlyOutgo: {
			label: "Buy monthly outgo",
			color: "var(--chart-2)",
		},
		rentMonthlyOutgo: {
			label: "Rent monthly outgo",
			color: "var(--chart-1)",
		},
	};

	const startYear = result.points[0]?.year ?? result.inputs.startYear;
	const inflationRatePct = BUY_VS_RENT_MARKET_ASSUMPTIONS.inflationRatePct;
	const chartData = result.points.slice(1).map((point) => {
		const yearOffset = point.year - startYear;

		const buyMonthlyOutgo = showRealCashFlow
			? scaleToToday(point.buyMonthlyOutgo, inflationRatePct, yearOffset)
			: point.buyMonthlyOutgo;
		const rentMonthlyOutgo = showRealCashFlow
			? scaleToToday(point.rentMonthlyOutgo, inflationRatePct, yearOffset)
			: point.rentMonthlyOutgo;

		return {
			label: point.label,
			buyMonthlyOutgo,
			rentMonthlyOutgo,
		};
	});
	const xAxisTicks = buildXAxisTicks(chartData.map((point) => point.label));

	return (
		<section className={resultSectionClassName}>
			<div className={resultSectionHeaderClassName}>
				<div>
					<p className={sectionLabelClassName}>Cash flow reality</p>
					<h2 className="text-xl font-semibold text-foreground">
						Monthly outgo versus income over time
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Compare both housing paths against your estimated take-home so you
						can see how salary growth changes the pressure over time.
					</p>
				</div>
				<div className={resultToggleCardClassName}>
					<div className="flex items-center gap-3">
						<div>
							<p className="text-sm font-semibold text-foreground">
								View in today's money
							</p>
							<p className="text-xs text-muted-foreground">
								Income grows at {result.inputs.salaryGrowthPct}% while this view
								deflates by {inflationRatePct}% inflation.
							</p>
						</div>
						<Switch
							checked={showRealCashFlow}
							onCheckedChange={setShowRealCashFlow}
							aria-label="Show inflation-adjusted cash flow"
						/>
					</div>
				</div>
			</div>
			<ChartContainer config={chartConfig} className="h-72 w-full">
				<ComposedChart
					accessibilityLayer
					data={chartData}
					margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="label"
						ticks={xAxisTicks}
						tickLine={false}
						axisLine={false}
						minTickGap={18}
						interval={0}
						padding={{ left: 8, right: 20 }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						width={56}
						tickFormatter={(value) =>
							formatCurrency(Number(value)).replace("₹", "")
						}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value, name) => (
									<div className="flex min-w-44 items-center justify-between gap-4">
										<span className="text-muted-foreground">
											{chartConfig[String(name)]?.label ?? String(name)}
										</span>
										<span className="font-semibold text-foreground">
											{formatMonthly(Number(value))}
										</span>
									</div>
								)}
							/>
						}
					/>
					<ChartLegend content={<ChartLegendContent />} />
					<Line
						type="monotone"
						dataKey="buyMonthlyOutgo"
						stroke="var(--color-buyMonthlyOutgo)"
						strokeWidth={3}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="rentMonthlyOutgo"
						stroke="var(--color-rentMonthlyOutgo)"
						strokeWidth={3}
						dot={false}
					/>
				</ComposedChart>
			</ChartContainer>
		</section>
	);
}

function ScenarioCards({ result }: { result: BuyVsRentResult }) {
	return (
		<section className={resultSectionClassName}>
			<div className={resultSectionHeaderClassName}>
				<div>
					<p className={sectionLabelClassName}>Uncertainty check</p>
					<h2 className="text-xl font-semibold text-foreground">
						How fragile is the answer?
					</h2>
				</div>
				<Badge variant="outline" className="rounded-full">
					<LineChartIcon className="mr-1 size-3" />
					{result.summary.confidence} scenario agreement
				</Badge>
			</div>
			<div className={resultCardGridClassName}>
				{result.summary.scenarios.map((scenario) => (
					<div key={scenario.label} className={cn(subSurfaceClassName, "p-5")}>
						<p className="mb-1 text-sm font-semibold text-foreground">
							{BUY_VS_RENT_SCENARIO_LABELS[scenario.label]}
						</p>
						<p className="text-2xl font-bold text-foreground">
							{BUY_VS_RENT_VERDICT_LABELS[scenario.verdict]}
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Gap {formatCurrency(Math.abs(scenario.gap))}
						</p>
						<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
							Shows whether the verdict survives softer or stronger housing
							conditions.
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function DecisionContext({ result }: { result: BuyVsRentResult }) {
	return (
		<section className={resultSectionClassName}>
			<div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
				<div>
					<p className={sectionLabelClassName}>Why the tool says this</p>
					<h2 className="mb-4 text-xl font-semibold text-foreground">
						Key decision drivers
					</h2>
					<div className="space-y-3">
						{result.summary.reasons.map((reason) => (
							<div
								key={reason}
								className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-muted-foreground"
							>
								{reason}
							</div>
						))}
					</div>
				</div>

				<div className="space-y-4">
					<div className={cn(subSurfaceClassName, "p-5")}>
						<p className="text-sm font-semibold text-foreground">
							When buying makes sense
						</p>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Buying works better when you stay longer, can handle the upfront
							cost, and build saleable equity.
						</p>
						{result.summary.buyCatchUpYear ? (
							<p className="mt-3 rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground">
								In this setup, buying only catches up financially after about{" "}
								<span className="font-semibold">
									year {result.summary.buyCatchUpYear}
								</span>
								.
							</p>
						) : null}
					</div>

					<div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
						<p className="text-sm font-semibold text-foreground">
							Financial answer, not emotional dismissal
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function InsightsGrid({ result }: { result: BuyVsRentResult }) {
	return (
		<section className={resultSectionClassName}>
			<p className={sectionLabelClassName}>Key takeaways</p>
			<h2 className="mb-4 text-xl font-semibold text-foreground">
				What matters most in this result
			</h2>
			<div className="overflow-hidden rounded-2xl border border-border/70 bg-background/60">
				{result.summary.insights.map((insight) => (
					<div
						key={insight.title}
						className={cn(
							"border-b border-border/60 px-4 py-4 last:border-b-0 transition-colors",
							getInsightToneClasses(insight.tone),
						)}
					>
						<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span
										className={cn(
											"size-2.5 shrink-0 rounded-full",
											insight.tone === "positive" && "bg-emerald-500",
											insight.tone === "caution" && "bg-amber-500",
											insight.tone === "neutral" && "bg-primary/70",
										)}
									/>
									<p className="text-sm font-semibold tracking-tight">
										{insight.title}
									</p>
								</div>
								<p className="mt-2 text-sm leading-relaxed opacity-85">
									{insight.description}
								</p>
							</div>
							<div className="sm:pl-4 sm:text-right">
								<p className="text-xl font-bold tracking-tight sm:text-2xl">
									{insight.value}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function ComparisonTable({ result }: { result: BuyVsRentResult }) {
	return (
		<section className={cn(resultSectionClassName, "overflow-hidden")}>
			<div className="mb-4">
				<p className={sectionLabelClassName}>Year-by-year detail</p>
				<h2 className="text-xl font-semibold text-foreground">
					See exactly where the path changes
				</h2>
			</div>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Year</TableHead>
							<TableHead>Buy net worth</TableHead>
							<TableHead>Rent net worth</TableHead>
							<TableHead>Gap</TableHead>
							<TableHead>Buy outgo</TableHead>
							<TableHead>Rent outgo</TableHead>
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
										point.gap >= 0 ? "text-emerald-600" : "text-indigo-600",
									)}
								>
									{formatCurrency(point.gap)}
								</TableCell>
								<TableCell>
									{point.label === "Now"
										? "-"
										: formatMonthly(point.buyMonthlyOutgo)}
								</TableCell>
								<TableCell>
									{point.label === "Now"
										? "-"
										: formatMonthly(point.rentMonthlyOutgo)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</section>
	);
}
