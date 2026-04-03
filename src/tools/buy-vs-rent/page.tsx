import {
	ChevronDown,
	HeartHandshake,
	Home,
	Info,
	Landmark,
	LineChart as LineChartIcon,
	PiggyBank,
	RefreshCcw,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	XAxis,
	YAxis,
} from "recharts";

import { ToolPageShell } from "#/components/common";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import {
	calculateBuyVsRent,
	formatCurrency,
} from "#/tools/buy-vs-rent/calculator";
import {
	BUY_VS_RENT_SCENARIO_LABELS,
	BUY_VS_RENT_VERDICT_LABELS,
	DEFAULT_BUY_VS_RENT_INPUTS,
} from "#/tools/buy-vs-rent/constants";
import { formatIndian } from "#/tools/buy-vs-rent/insights";

function parseNumber(value: string, fallback: number) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMonthly(value: number) {
	return `${formatCurrency(value)}/mo`;
}

function formatPercent(value: number) {
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

const surfaceClassName = "rounded-3xl border border-border bg-background/80";
const subSurfaceClassName =
	"rounded-2xl border border-border/80 bg-background/70";
const sectionLabelClassName = "text-sm font-medium text-primary";

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

function getToneClasses(tone: "positive" | "neutral" | "caution") {
	if (tone === "positive") {
		return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
	}

	if (tone === "caution") {
		return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200";
	}

	return "border-border bg-muted/40 text-foreground";
}

function TooltipInfo({ text }: { text: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
					aria-label={text}
				>
					<Info className="size-3.5" />
				</button>
			</TooltipTrigger>
			<TooltipContent className="max-w-64 text-pretty">{text}</TooltipContent>
		</Tooltip>
	);
}

function Field({
	id,
	label,
	value,
	onChange,
	placeholder,
	suffix,
	helper,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	suffix?: string;
	helper?: string;
}) {
	return (
		<div className="grid content-start gap-2">
			<Label
				htmlFor={id}
				className="flex min-h-10 items-end text-sm font-semibold text-foreground"
			>
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type="number"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					className={cn(suffix ? "pr-14" : undefined)}
				/>
				{suffix ? (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
			{helper ? (
				<p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>
			) : null}
		</div>
	);
}

function SliderField({
	label,
	value,
	onChange,
	min,
	max,
	step,
	valueLabel,
	helper,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
	valueLabel: string;
	helper?: string;
}) {
	return (
		<div>
			<div className="mb-2 flex items-center justify-between gap-3">
				<Label className="flex min-h-10 items-end text-sm font-semibold text-foreground">
					{label}
				</Label>
				<span className="text-sm font-bold text-foreground">{valueLabel}</span>
			</div>
			<Slider
				value={[value]}
				onValueChange={(next) => onChange(next[0] ?? value)}
				min={min}
				max={max}
				step={step}
			/>
			{helper ? (
				<p className="mt-2 text-xs text-muted-foreground">{helper}</p>
			) : null}
		</div>
	);
}

export function BuyVsRentPage() {
	const [propertyPriceLakhs, setPropertyPriceLakhs] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.propertyPriceLakhs),
	);
	const [monthlyRent, setMonthlyRent] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.monthlyRent),
	);
	const [homeLoanRatePct, setHomeLoanRatePct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.homeLoanRatePct),
	);
	const [stayYears, setStayYears] = useState(
		DEFAULT_BUY_VS_RENT_INPUTS.stayYears,
	);
	const [downPaymentPct, setDownPaymentPct] = useState(
		DEFAULT_BUY_VS_RENT_INPUTS.downPaymentPct,
	);
	const [advancedOpen, setAdvancedOpen] = useState(true);
	const [taxOpen, setTaxOpen] = useState(false);
	const [showRealView, setShowRealView] = useState(false);

	const [loanTenureYears, setLoanTenureYears] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.loanTenureYears),
	);
	const [propertyAppreciationPct, setPropertyAppreciationPct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.propertyAppreciationPct),
	);
	const [rentIncreasePct, setRentIncreasePct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.rentIncreasePct),
	);
	const [investmentReturnPct, setInvestmentReturnPct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.investmentReturnPct),
	);
	const [annualMaintenancePct, setAnnualMaintenancePct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.annualMaintenancePct),
	);
	const [annualOwnerFixedCosts, setAnnualOwnerFixedCosts] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.annualOwnerFixedCosts),
	);
	const [purchaseCostPct, setPurchaseCostPct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.purchaseCostPct),
	);
	const [saleCostPct, setSaleCostPct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.saleCostPct),
	);
	const [inflationRatePct, setInflationRatePct] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.inflationRatePct),
	);
	const [rentDepositMonths, setRentDepositMonths] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.rentDepositMonths),
	);
	const [rentBrokerageMonths, setRentBrokerageMonths] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.rentBrokerageMonths),
	);
	const [annualBuyTaxBenefit, setAnnualBuyTaxBenefit] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.annualBuyTaxBenefit),
	);
	const [annualRentTaxBenefit, setAnnualRentTaxBenefit] = useState(
		String(DEFAULT_BUY_VS_RENT_INPUTS.annualRentTaxBenefit),
	);
	const [monthlyTakeHomePay, setMonthlyTakeHomePay] = useState("");

	const result = useMemo(
		() =>
			calculateBuyVsRent({
				propertyPriceLakhs: parseNumber(
					propertyPriceLakhs,
					DEFAULT_BUY_VS_RENT_INPUTS.propertyPriceLakhs,
				),
				monthlyRent: parseNumber(
					monthlyRent,
					DEFAULT_BUY_VS_RENT_INPUTS.monthlyRent,
				),
				stayYears,
				downPaymentPct,
				homeLoanRatePct: parseNumber(
					homeLoanRatePct,
					DEFAULT_BUY_VS_RENT_INPUTS.homeLoanRatePct,
				),
				loanTenureYears: parseNumber(
					loanTenureYears,
					DEFAULT_BUY_VS_RENT_INPUTS.loanTenureYears,
				),
				propertyAppreciationPct: parseNumber(
					propertyAppreciationPct,
					DEFAULT_BUY_VS_RENT_INPUTS.propertyAppreciationPct,
				),
				rentIncreasePct: parseNumber(
					rentIncreasePct,
					DEFAULT_BUY_VS_RENT_INPUTS.rentIncreasePct,
				),
				investmentReturnPct: parseNumber(
					investmentReturnPct,
					DEFAULT_BUY_VS_RENT_INPUTS.investmentReturnPct,
				),
				inflationRatePct: parseNumber(
					inflationRatePct,
					DEFAULT_BUY_VS_RENT_INPUTS.inflationRatePct,
				),
				annualMaintenancePct: parseNumber(
					annualMaintenancePct,
					DEFAULT_BUY_VS_RENT_INPUTS.annualMaintenancePct,
				),
				annualOwnerFixedCosts: parseNumber(
					annualOwnerFixedCosts,
					DEFAULT_BUY_VS_RENT_INPUTS.annualOwnerFixedCosts,
				),
				purchaseCostPct: parseNumber(
					purchaseCostPct,
					DEFAULT_BUY_VS_RENT_INPUTS.purchaseCostPct,
				),
				saleCostPct: parseNumber(
					saleCostPct,
					DEFAULT_BUY_VS_RENT_INPUTS.saleCostPct,
				),
				rentDepositMonths: parseNumber(
					rentDepositMonths,
					DEFAULT_BUY_VS_RENT_INPUTS.rentDepositMonths,
				),
				rentBrokerageMonths: parseNumber(
					rentBrokerageMonths,
					DEFAULT_BUY_VS_RENT_INPUTS.rentBrokerageMonths,
				),
				annualBuyTaxBenefit: parseNumber(annualBuyTaxBenefit, 0),
				annualRentTaxBenefit: parseNumber(annualRentTaxBenefit, 0),
				monthlyTakeHomePay:
					monthlyTakeHomePay.trim().length > 0
						? parseNumber(monthlyTakeHomePay, 0)
						: null,
			}),
		[
			annualBuyTaxBenefit,
			annualMaintenancePct,
			annualOwnerFixedCosts,
			annualRentTaxBenefit,
			downPaymentPct,
			homeLoanRatePct,
			inflationRatePct,
			investmentReturnPct,
			loanTenureYears,
			monthlyRent,
			monthlyTakeHomePay,
			propertyAppreciationPct,
			propertyPriceLakhs,
			purchaseCostPct,
			rentBrokerageMonths,
			rentDepositMonths,
			rentIncreasePct,
			saleCostPct,
			stayYears,
		],
	);

	const propertyPriceRupees =
		parseNumber(
			propertyPriceLakhs,
			DEFAULT_BUY_VS_RENT_INPUTS.propertyPriceLakhs,
		) * 100000;
	const downPaymentValue = propertyPriceRupees * (downPaymentPct / 100);

	function resetDefaults() {
		setPropertyPriceLakhs(
			String(DEFAULT_BUY_VS_RENT_INPUTS.propertyPriceLakhs),
		);
		setMonthlyRent(String(DEFAULT_BUY_VS_RENT_INPUTS.monthlyRent));
		setHomeLoanRatePct(String(DEFAULT_BUY_VS_RENT_INPUTS.homeLoanRatePct));
		setStayYears(DEFAULT_BUY_VS_RENT_INPUTS.stayYears);
		setDownPaymentPct(DEFAULT_BUY_VS_RENT_INPUTS.downPaymentPct);
		setLoanTenureYears(String(DEFAULT_BUY_VS_RENT_INPUTS.loanTenureYears));
		setPropertyAppreciationPct(
			String(DEFAULT_BUY_VS_RENT_INPUTS.propertyAppreciationPct),
		);
		setRentIncreasePct(String(DEFAULT_BUY_VS_RENT_INPUTS.rentIncreasePct));
		setInvestmentReturnPct(
			String(DEFAULT_BUY_VS_RENT_INPUTS.investmentReturnPct),
		);
		setAnnualMaintenancePct(
			String(DEFAULT_BUY_VS_RENT_INPUTS.annualMaintenancePct),
		);
		setAnnualOwnerFixedCosts(
			String(DEFAULT_BUY_VS_RENT_INPUTS.annualOwnerFixedCosts),
		);
		setPurchaseCostPct(String(DEFAULT_BUY_VS_RENT_INPUTS.purchaseCostPct));
		setSaleCostPct(String(DEFAULT_BUY_VS_RENT_INPUTS.saleCostPct));
		setInflationRatePct(String(DEFAULT_BUY_VS_RENT_INPUTS.inflationRatePct));
		setRentDepositMonths(String(DEFAULT_BUY_VS_RENT_INPUTS.rentDepositMonths));
		setRentBrokerageMonths(
			String(DEFAULT_BUY_VS_RENT_INPUTS.rentBrokerageMonths),
		);
		setAnnualBuyTaxBenefit(
			String(DEFAULT_BUY_VS_RENT_INPUTS.annualBuyTaxBenefit),
		);
		setAnnualRentTaxBenefit(
			String(DEFAULT_BUY_VS_RENT_INPUTS.annualRentTaxBenefit),
		);
		setMonthlyTakeHomePay("");
	}

	return (
		<ToolPageShell
			title="Buy vs Rent"
			description="A private decision engine for salaried India: see whether buying or renting leaves you stronger, why the result leans that way, and when the other choice starts making sense."
			tag={
				<Badge
					variant="secondary"
					className="rounded-full px-3 py-1 text-xs font-semibold"
				>
					All calculations stay in your browser
				</Badge>
			}
			className="rise-in mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
		>
			<div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
				<div className="self-start">
					<div className={cn(surfaceClassName, "p-6")}>
						<div className="mb-5 flex items-center justify-between gap-3">
							<div>
								<p className={sectionLabelClassName}>Quick setup</p>
								<p className="text-sm text-muted-foreground">
									Keep it simple. The tool fills the rest with sensible
									defaults.
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={resetDefaults}
							>
								<RefreshCcw className="size-4" />
								Reset
							</Button>
						</div>

						<div className="space-y-5">
							<Field
								id="property-price"
								label="Home price"
								value={propertyPriceLakhs}
								onChange={setPropertyPriceLakhs}
								placeholder="90"
								suffix="L"
								helper={`= ₹${formatIndian(propertyPriceRupees)}`}
							/>
							<Field
								id="monthly-rent"
								label="Monthly rent for a similar home"
								value={monthlyRent}
								onChange={setMonthlyRent}
								placeholder="30000"
								suffix="/mo"
							/>
							<SliderField
								label="How long do you expect to stay?"
								value={stayYears}
								onChange={setStayYears}
								min={1}
								max={20}
								step={1}
								valueLabel={`${stayYears} years`}
								helper="Holding period is the biggest driver in this decision."
							/>
							<SliderField
								label="Down payment"
								value={downPaymentPct}
								onChange={setDownPaymentPct}
								min={10}
								max={50}
								step={1}
								valueLabel={`${downPaymentPct}%`}
								helper={`That is roughly ${formatCurrency(downPaymentValue)} up front.`}
							/>
							<Field
								id="loan-rate"
								label="Home loan interest rate"
								value={homeLoanRatePct}
								onChange={setHomeLoanRatePct}
								placeholder="8.75"
								suffix="%"
							/>

							<Separator />

							<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
								<div className={cn(subSurfaceClassName, "p-4")}>
									<div className="flex items-center justify-between gap-3">
										<div>
											<div className="flex items-center gap-1.5">
												<p className="text-sm font-semibold text-foreground">
													Make it more accurate
												</p>
												<TooltipInfo text="These assumptions shape the final recommendation, but you do not need to touch them for a useful first answer." />
											</div>
											<p className="mt-1 text-xs text-muted-foreground">
												Useful when you know your market better than the
												defaults.
											</p>
										</div>
										<CollapsibleTrigger asChild>
											<Button type="button" variant="outline" size="sm">
												{advancedOpen ? "Hide" : "Show"}
												<ChevronDown
													className={cn(
														"size-4 transition-transform",
														advancedOpen && "rotate-180",
													)}
												/>
											</Button>
										</CollapsibleTrigger>
									</div>

									<CollapsibleContent className="mt-4 space-y-4">
										<Field
											id="loan-tenure"
											label="Loan tenure"
											value={loanTenureYears}
											onChange={setLoanTenureYears}
											placeholder="20"
											suffix="yrs"
										/>
										<div className="grid gap-4 sm:grid-cols-2 [&>*]:h-full">
											<Field
												id="property-appreciation"
												label="Property growth"
												value={propertyAppreciationPct}
												onChange={setPropertyAppreciationPct}
												placeholder="6"
												suffix="%"
											/>
											<Field
												id="rent-growth"
												label="Rent growth"
												value={rentIncreasePct}
												onChange={setRentIncreasePct}
												placeholder="6"
												suffix="%"
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 [&>*]:h-full">
											<Field
												id="investment-return"
												label="Investment return"
												value={investmentReturnPct}
												onChange={setInvestmentReturnPct}
												placeholder="10"
												suffix="%"
												helper="Used for the rent-and-invest path."
											/>
											<Field
												id="inflation-rate"
												label="Inflation rate"
												value={inflationRatePct}
												onChange={setInflationRatePct}
												placeholder="6"
												suffix="%"
												helper="Used only for the real-value chart toggle."
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 [&>*]:h-full">
											<Field
												id="maintenance"
												label="Maintenance reserve"
												value={annualMaintenancePct}
												onChange={setAnnualMaintenancePct}
												placeholder="1.4"
												suffix="%"
												helper="Applied on the home value each year."
											/>
											<Field
												id="owner-fixed-costs"
												label="Owner fixed costs"
												value={annualOwnerFixedCosts}
												onChange={setAnnualOwnerFixedCosts}
												placeholder="36000"
												suffix="/yr"
												helper="Property tax, insurance, small repairs."
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 [&>*]:h-full">
											<Field
												id="purchase-costs"
												label="Purchase costs"
												value={purchaseCostPct}
												onChange={setPurchaseCostPct}
												placeholder="7"
												suffix="%"
												helper="Stamp duty, registration, legal, setup."
											/>
											<Field
												id="sale-costs"
												label="Exit costs when selling"
												value={saleCostPct}
												onChange={setSaleCostPct}
												placeholder="2"
												suffix="%"
												helper="Brokerage and selling friction."
											/>
										</div>
										<div className="grid gap-4 sm:grid-cols-2 [&>*]:h-full">
											<Field
												id="deposit-months"
												label="Security deposit"
												value={rentDepositMonths}
												onChange={setRentDepositMonths}
												placeholder="3"
												suffix="months"
											/>
											<Field
												id="brokerage-months"
												label="Rent brokerage"
												value={rentBrokerageMonths}
												onChange={setRentBrokerageMonths}
												placeholder="1"
												suffix="months"
											/>
										</div>
									</CollapsibleContent>
								</div>
							</Collapsible>

							<Collapsible open={taxOpen} onOpenChange={setTaxOpen}>
								<div className={cn(subSurfaceClassName, "p-4")}>
									<div className="flex items-center justify-between gap-3">
										<div>
											<div className="flex items-center gap-1.5">
												<p className="text-sm font-semibold text-foreground">
													Salary and tax refinements
												</p>
												<TooltipInfo text="Keep these at zero if you want a pure housing decision. Add them only when you know your likely annual tax savings." />
											</div>
											<p className="mt-1 text-xs text-muted-foreground">
												Useful when old-regime HRA or home-loan deductions
												materially affect you.
											</p>
										</div>
										<CollapsibleTrigger asChild>
											<Button type="button" variant="outline" size="sm">
												{taxOpen ? "Hide" : "Show"}
												<ChevronDown
													className={cn(
														"size-4 transition-transform",
														taxOpen && "rotate-180",
													)}
												/>
											</Button>
										</CollapsibleTrigger>
									</div>

									<CollapsibleContent className="mt-4 space-y-4">
										<Field
											id="buy-tax-benefit"
											label="Annual buy-side tax benefit"
											value={annualBuyTaxBenefit}
											onChange={setAnnualBuyTaxBenefit}
											placeholder="0"
											suffix="/yr"
											helper="Example: estimated Section 24 / 80C benefit."
										/>
										<Field
											id="rent-tax-benefit"
											label="Annual rent-side tax benefit"
											value={annualRentTaxBenefit}
											onChange={setAnnualRentTaxBenefit}
											placeholder="0"
											suffix="/yr"
											helper="Example: expected HRA tax saving while renting."
										/>
										<Field
											id="take-home-pay"
											label="Monthly take-home pay"
											value={monthlyTakeHomePay}
											onChange={setMonthlyTakeHomePay}
											placeholder="0"
											suffix="/mo"
											helper="Optional. Adds a stress test based on your income."
										/>
									</CollapsibleContent>
								</div>
							</Collapsible>

							<div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
								<div className="mb-2 flex items-center gap-2 font-medium text-foreground">
									<ShieldCheck className="size-4 text-primary" />
									Private by design
								</div>
								The tool runs entirely in your browser. We are not storing your
								house decision, salary assumptions, or tax numbers anywhere.
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-5">
					<VerdictHero result={result} />
					<SummaryCards result={result} />
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
			</div>
		</ToolPageShell>
	);
}

function VerdictHero({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
	const theme = getVerdictTheme(result.summary.verdict);

	return (
		<div className={cn("overflow-hidden rounded-3xl p-6 md:p-7", theme.card)}>
			<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div>
					<p className={cn("mb-2 text-sm font-medium", theme.kicker)}>
						Buy vs Rent
					</p>
					<h2 className="text-5xl font-black leading-none md:text-6xl">
						{BUY_VS_RENT_VERDICT_LABELS[result.summary.verdict]}
					</h2>
					<p className="mt-3 text-lg font-semibold text-white/92 md:text-xl">
						{result.summary.verdict === "close-call"
							? "Both paths are financially close right now."
							: `${BUY_VS_RENT_VERDICT_LABELS[result.summary.verdict]} looks stronger for the next ${result.summary.horizonYears} years.`}
					</p>
					<p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 md:text-base">
						{result.summary.story}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Badge
						variant="outline"
						className={cn(
							"rounded-full px-3 py-1 text-xs font-semibold",
							theme.badge,
						)}
					>
						{result.summary.confidence} confidence
					</Badge>
					<Badge
						variant="outline"
						className={cn(
							"rounded-full px-3 py-1 text-xs font-semibold",
							theme.badge,
						)}
					>
						Gap {formatCurrency(Math.abs(result.summary.financialGap))}
					</Badge>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
					<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
						<HeartHandshake className="size-4" />
						How to read this
					</div>
					<p className="text-sm leading-relaxed text-white/80">
						{result.summary.decisionNote}
					</p>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
					<div className="space-y-4 text-white/85">
						<div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
							<div>
								<p className="text-sm font-medium text-white">Break-even</p>
								<p className="mt-1 text-xs text-white/70">
									When buying catches up to renting.
								</p>
							</div>
							<p className="text-2xl font-bold text-white">
								{result.summary.breakEvenYear
									? `Year ${result.summary.breakEvenYear}`
									: "No catch-up"}
							</p>
						</div>
						<div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
							<div>
								<p className="text-sm font-medium text-white">
									Upfront difference
								</p>
								<p className="mt-1 text-xs text-white/70">
									Buying asks for more cash on day one.
								</p>
							</div>
							<p className="text-2xl font-bold text-white">
								{formatCurrency(result.summary.upfrontGap)}
							</p>
						</div>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-sm font-medium text-white">Ending gap</p>
								<p className="mt-1 text-xs text-white/70">
									Difference between the two paths at the finish.
								</p>
							</div>
							<p className="text-2xl font-bold text-white">
								{formatCurrency(Math.abs(result.summary.financialGap))}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function SummaryCards({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<SummaryCard
				icon={Home}
				label="Buyer ends with"
				value={formatCurrency(result.summary.finalHomeEquity)}
				subtext="Saleable home equity after clearing the loan"
				emphasis
			/>
			<SummaryCard
				icon={PiggyBank}
				label="Renter ends with"
				value={formatCurrency(result.summary.finalRentCorpus)}
				subtext="Investment corpus plus refundable deposit"
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
				subtext="Buy vs rent monthly outgo in the final year"
			/>
		</div>
	);
}

function SummaryCard({
	icon: Icon,
	label,
	value,
	subtext,
	emphasis,
}: {
	icon: typeof Home;
	label: string;
	value: string;
	subtext: string;
	emphasis?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-2xl border p-5",
				emphasis
					? "border-teal-500/20 bg-[linear-gradient(135deg,#134e4a_0%,#0f766e_48%,#14b8a6_100%)] text-white shadow-lg shadow-teal-500/15"
					: "border-border bg-background/70",
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

function NetWorthChart({
	result,
	showRealView,
	setShowRealView,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
	showRealView: boolean;
	setShowRealView: (value: boolean) => void;
}) {
	const chartConfig: ChartConfig = {
		buyNetWorth: {
			label: showRealView ? "Buy net worth (real)" : "Buy net worth",
			color: "var(--chart-2)",
		},
		rentNetWorth: {
			label: showRealView ? "Rent net worth (real)" : "Rent net worth",
			color: "var(--chart-1)",
		},
		gap: {
			label: showRealView ? "Buy minus rent (real)" : "Buy minus rent",
			color: "var(--chart-5)",
		},
	};

	const chartData = result.points.map((point) => ({
		label: point.label,
		buyNetWorth: showRealView ? point.realBuyNetWorth : point.buyNetWorth,
		rentNetWorth: showRealView ? point.realRentNetWorth : point.rentNetWorth,
		gap: showRealView ? point.realGap : point.gap,
	}));

	return (
		<section className={cn(surfaceClassName, "p-5")}>
			<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<p className={sectionLabelClassName}>The future path</p>
					<h2 className="text-xl font-semibold text-foreground">
						Net worth over time
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						This is the main decision chart: if the buy line rises above rent,
						the house has earned back its heavier starting cost.
					</p>
				</div>
				<div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
					<div className="flex items-center gap-3">
						<div>
							<p className="text-sm font-semibold text-foreground">
								View in today's money
							</p>
							<p className="text-xs text-muted-foreground">
								Uses inflation to deflate future values.
							</p>
						</div>
						<Switch
							checked={showRealView}
							onCheckedChange={setShowRealView}
							aria-label="Show inflation-adjusted net worth"
						/>
					</div>
				</div>
			</div>

			<ChartContainer config={chartConfig} className="h-84 w-full">
				<ComposedChart
					accessibilityLayer
					data={chartData}
					margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="label"
						tickLine={false}
						axisLine={false}
						minTickGap={18}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						width={60}
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
											{formatCurrency(Number(value))}
										</span>
									</div>
								)}
							/>
						}
					/>
					<ChartLegend content={<ChartLegendContent />} />
					<Area
						type="monotone"
						dataKey="gap"
						stroke="var(--color-gap)"
						fill="var(--color-gap)"
						fillOpacity={0.14}
						strokeWidth={2}
					/>
					<Line
						type="monotone"
						dataKey="buyNetWorth"
						stroke="var(--color-buyNetWorth)"
						strokeWidth={3}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="rentNetWorth"
						stroke="var(--color-rentNetWorth)"
						strokeWidth={3}
						dot={false}
					/>
				</ComposedChart>
			</ChartContainer>
		</section>
	);
}

function CashFlowChart({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
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

	const chartData = result.points.slice(1).map((point) => ({
		label: point.label,
		buyMonthlyOutgo: point.buyMonthlyOutgo,
		rentMonthlyOutgo: point.rentMonthlyOutgo,
	}));

	return (
		<section className={cn(surfaceClassName, "p-5")}>
			<div className="mb-4">
				<p className={sectionLabelClassName}>Cash flow reality</p>
				<h2 className="text-xl font-semibold text-foreground">
					Monthly outgo over time
				</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					This shows the lifestyle pressure of the decision, not just the ending
					wealth number.
				</p>
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
						tickLine={false}
						axisLine={false}
						minTickGap={18}
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

function ScenarioCards({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
	return (
		<section className={cn(surfaceClassName, "p-5")}>
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<p className={sectionLabelClassName}>Uncertainty check</p>
					<h2 className="text-xl font-semibold text-foreground">
						How fragile is the answer?
					</h2>
				</div>
				<Badge variant="outline" className="rounded-full">
					<LineChartIcon className="mr-1 size-3" />
					{result.summary.confidence} confidence
				</Badge>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				{result.summary.scenarios.map((scenario) => (
					<div
						key={scenario.label}
						className="rounded-2xl border border-border/80 bg-background/70 p-4"
					>
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
							Property growth {formatPercent(scenario.propertyAppreciationPct)}{" "}
							· investment return {formatPercent(scenario.investmentReturnPct)}{" "}
							· rent growth {formatPercent(scenario.rentIncreasePct)}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function DecisionContext({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
	return (
		<section className={cn(surfaceClassName, "p-5")}>
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
							Buying becomes financially stronger when you can stay put long
							enough, shoulder the upfront hit comfortably, and the home
							meaningfully builds saleable equity.
						</p>
						{result.summary.buyBecomesReasonableAfterYear ? (
							<p className="mt-3 rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground">
								In this setup, buying starts looking respectable after about{" "}
								<span className="font-semibold">
									year {result.summary.buyBecomesReasonableAfterYear}
								</span>
								.
							</p>
						) : null}
					</div>

					<div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
						<p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
							<HeartHandshake className="size-4 text-primary" />
							Financial answer, not emotional dismissal
						</p>
						<p className="text-sm leading-relaxed text-muted-foreground">
							In India, owning a home is often rooted in stability, family
							pride, and permanence. This tool respects that. It is only
							answering the financial side so you can see the trade-off clearly
							before making a human decision.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function InsightsGrid({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
	return (
		<section className={cn(surfaceClassName, "p-5")}>
			<p className={sectionLabelClassName}>Key takeaways</p>
			<h2 className="mb-4 text-xl font-semibold text-foreground">
				What matters most in this result
			</h2>
			<div className="grid gap-4 md:grid-cols-2">
				{result.summary.insights.map((insight) => (
					<div
						key={insight.title}
						className={cn(
							"rounded-2xl border-l-4 px-4 py-3",
							getToneClasses(insight.tone),
						)}
					>
						<p className="text-sm font-semibold">{insight.title}</p>
						<p className="mt-1 text-xl font-bold">{insight.value}</p>
						<p className="mt-2 text-sm leading-relaxed opacity-90">
							{insight.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function ComparisonTable({
	result,
}: {
	result: ReturnType<typeof calculateBuyVsRent>;
}) {
	return (
		<section className={cn(surfaceClassName, "overflow-hidden p-5")}>
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
