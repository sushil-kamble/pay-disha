import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ChevronDown,
	Flame,
	HeartPulse,
	Info,
	PiggyBank,
	RefreshCcw,
	ShieldAlert,
	Target,
	TrendingUp,
	HelpCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceDot,
	ReferenceLine,
	XAxis,
	YAxis,
} from "recharts";

import { SiteFooter, SiteNav } from "#/components/home";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import { calculateFire, formatCurrency } from "#/tools/fire/calculator";
import {
	CORPUS_MILESTONES,
	FIRE_DEFAULTS,
	FIRE_EDUCATION,
	FIRE_LIMITS,
	FIRE_STORAGE_KEY,
	FIRE_TYPE_CONFIG,
} from "#/tools/fire/constants";
import type {
	FireInputs,
	FireInsight,
	FireProjectionPoint,
	FireResult,
	FireTypeResult,
	LeverScenario,
} from "#/tools/fire/types";

type FireInputDraft = Record<keyof FireInputs, string>;

type PersistedFireState = {
	draft: FireInputDraft;
	accuracyOpen: boolean;
	fineTuneOpen: boolean;
	tableOpen: boolean;
};

const FIRE_INPUT_KEYS = Object.keys(FIRE_DEFAULTS) as Array<keyof FireInputs>;

const surfaceClassName = "rounded-2xl border border-border bg-card shadow-sm";
const subSurfaceClassName = "rounded-xl border border-border bg-muted/40";

function createDraft(inputs: FireInputs): FireInputDraft {
	return {
		currentAge: String(inputs.currentAge),
		monthlyExpenses: String(inputs.monthlyExpenses),
		existingSavings: String(inputs.existingSavings),
		targetRetirementAge: String(inputs.targetRetirementAge),
		monthlySip: String(inputs.monthlySip),
		expectedReturnPct: String(inputs.expectedReturnPct),
		inflationPct: String(inputs.inflationPct),
		swrPct: String(inputs.swrPct),
		healthcareInflationPct: String(inputs.healthcareInflationPct),
		monthlyHealthcareBudget: String(inputs.monthlyHealthcareBudget),
		epfMonthlyContribution: String(inputs.epfMonthlyContribution),
		epfInterestPct: String(inputs.epfInterestPct),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isFireInputDraft(value: unknown): value is FireInputDraft {
	if (!isRecord(value)) return false;

	return FIRE_INPUT_KEYS.every((key) => typeof value[key] === "string");
}

function parseStoredJson(rawValue: string | null) {
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
}

function loadStoredFireState(): PersistedFireState | null {
	const parsed = parseStoredJson(window.localStorage.getItem(FIRE_STORAGE_KEY));
	if (!isRecord(parsed)) return null;
	if (
		!isFireInputDraft(parsed.draft) ||
		typeof parsed.accuracyOpen !== "boolean" ||
		typeof parsed.fineTuneOpen !== "boolean" ||
		typeof parsed.tableOpen !== "boolean"
	) {
		return null;
	}

	return parsed as PersistedFireState;
}

function saveStoredFireState(value: PersistedFireState) {
	try {
		window.localStorage.setItem(FIRE_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Ignore storage errors such as private browsing quota limits.
	}
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function parseNumber(value: string, fallback: number) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: string, fallback: number) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function buildInputsFromDraft(draft: FireInputDraft): FireInputs {
	const currentAge = clamp(
		parseInteger(draft.currentAge, FIRE_DEFAULTS.currentAge),
		FIRE_LIMITS.minAge,
		FIRE_LIMITS.maxAge,
	);
	const minRetirementAge = Math.max(
		currentAge + 1,
		FIRE_LIMITS.minRetirementAge,
	);

	return {
		currentAge,
		monthlyExpenses: clamp(
			parseNumber(draft.monthlyExpenses, FIRE_DEFAULTS.monthlyExpenses),
			FIRE_LIMITS.minMonthlyExpenses,
			FIRE_LIMITS.maxMonthlyExpenses,
		),
		existingSavings: clamp(
			parseNumber(draft.existingSavings, FIRE_DEFAULTS.existingSavings),
			FIRE_LIMITS.minExistingSavings,
			FIRE_LIMITS.maxExistingSavings,
		),
		targetRetirementAge: clamp(
			parseInteger(
				draft.targetRetirementAge,
				Math.max(FIRE_DEFAULTS.targetRetirementAge, minRetirementAge),
			),
			minRetirementAge,
			FIRE_LIMITS.maxRetirementAge,
		),
		monthlySip: clamp(
			parseNumber(draft.monthlySip, FIRE_DEFAULTS.monthlySip),
			FIRE_LIMITS.minMonthlySip,
			FIRE_LIMITS.maxMonthlySip,
		),
		expectedReturnPct: clamp(
			parseNumber(draft.expectedReturnPct, FIRE_DEFAULTS.expectedReturnPct),
			FIRE_LIMITS.minExpectedReturnPct,
			FIRE_LIMITS.maxExpectedReturnPct,
		),
		inflationPct: clamp(
			parseNumber(draft.inflationPct, FIRE_DEFAULTS.inflationPct),
			FIRE_LIMITS.minInflationPct,
			FIRE_LIMITS.maxInflationPct,
		),
		swrPct: clamp(
			parseNumber(draft.swrPct, FIRE_DEFAULTS.swrPct),
			FIRE_LIMITS.minSwrPct,
			FIRE_LIMITS.maxSwrPct,
		),
		healthcareInflationPct: clamp(
			parseNumber(
				draft.healthcareInflationPct,
				FIRE_DEFAULTS.healthcareInflationPct,
			),
			FIRE_LIMITS.minHealthcareInflationPct,
			FIRE_LIMITS.maxHealthcareInflationPct,
		),
		monthlyHealthcareBudget: clamp(
			parseNumber(
				draft.monthlyHealthcareBudget,
				FIRE_DEFAULTS.monthlyHealthcareBudget,
			),
			FIRE_LIMITS.minMonthlyHealthcare,
			FIRE_LIMITS.maxMonthlyHealthcare,
		),
		epfMonthlyContribution: clamp(
			parseNumber(
				draft.epfMonthlyContribution,
				FIRE_DEFAULTS.epfMonthlyContribution,
			),
			FIRE_LIMITS.minEpfContribution,
			FIRE_LIMITS.maxEpfContribution,
		),
		epfInterestPct: clamp(
			parseNumber(draft.epfInterestPct, FIRE_DEFAULTS.epfInterestPct),
			FIRE_LIMITS.minEpfInterestPct,
			FIRE_LIMITS.maxEpfInterestPct,
		),
	};
}

function formatYears(value: number | null) {
	if (value === null) return "Not visible within 50 years";
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)} years`;
}

function formatMonthly(value: number) {
	return `${formatCurrency(value)}/mo`;
}

function getCompactInsights(insights: FireInsight[]) {
	const preferredOrder = [
		"timeline",
		"retirement-gap",
		"inflation-shock",
		"epf-wealth",
		"coast-fire",
		"sip-power",
		"expense-multiplier",
	];

	const selected = preferredOrder
		.map((id) => insights.find((insight) => insight.id === id))
		.filter((insight): insight is FireInsight => Boolean(insight));

	return selected.slice(0, 4);
}

function getInsightToneClasses(tone: FireInsight["tone"]) {
	if (tone === "positive") {
		return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100";
	}

	if (tone === "caution") {
		return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
	}

	if (tone === "surprise") {
		return "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100";
	}

	return "border-border bg-muted/40 text-foreground";
}

function getImpactClasses(impact: LeverScenario["impact"]) {
	if (impact === "high") {
		return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
	}

	if (impact === "medium") {
		return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200";
	}

	return "border-border bg-muted/40 text-muted-foreground";
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
					<Info className="size-4" />
				</button>
			</TooltipTrigger>
			<TooltipContent className="max-w-[280px] p-3 text-sm leading-relaxed text-pretty">
				{text}
			</TooltipContent>
		</Tooltip>
	);
}

function SectionHeading({
	kicker,
	title,
	description,
	action,
}: {
	kicker: string;
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
			<div>
				<p className="text-sm font-semibold text-primary">{kicker}</p>
				<h2 className="mt-1 text-2xl font-semibold text-foreground">{title}</h2>
				<p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}

function NumberField({
	id,
	label,
	value,
	onChange,
	helper,
	tooltip,
	prefix,
	suffix,
	disabled,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	helper?: string;
	tooltip?: string;
	prefix?: string;
	suffix?: string;
	disabled?: boolean;
}) {
	return (
		<div className="grid gap-2">
			<div className="flex items-center gap-1.5">
				<Label htmlFor={id} className="text-sm font-medium text-foreground">
					{label}
				</Label>
				{tooltip ? <TooltipInfo text={tooltip} /> : null}
			</div>
			<div className="relative">
				{prefix ? (
					<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
						{prefix}
					</span>
				) : null}
				<Input
					id={id}
					type="number"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					disabled={disabled}
					className={cn(
						"h-10",
						prefix ? "pl-8" : undefined,
						suffix ? "pr-14" : undefined,
					)}
				/>
				{suffix ? (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
			{helper ? (
				<p className="text-xs text-muted-foreground">{helper}</p>
			) : null}
		</div>
	);
}

function InputPanel({
	draft,
	onFieldChange,
	accuracyOpen,
	onAccuracyOpenChange,
	fineTuneOpen,
	onFineTuneOpenChange,
	onReset,
	loadedFromStorage,
}: {
	draft: FireInputDraft;
	onFieldChange: (key: keyof FireInputs, value: string) => void;
	accuracyOpen: boolean;
	onAccuracyOpenChange: (open: boolean) => void;
	fineTuneOpen: boolean;
	onFineTuneOpenChange: (open: boolean) => void;
	onReset: () => void;
	loadedFromStorage: boolean;
}) {
	return (
		<div className={cn(surfaceClassName, "p-5 lg:sticky lg:top-24 lg:p-6")}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-primary">Calculator</p>
					<h2 className="mt-1 text-xl font-semibold text-foreground">
						Core Inputs
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Start with your age, expenses, and current savings.
					</p>
				</div>
				<Button type="button" variant="outline" size="sm" onClick={onReset}>
					<RefreshCcw className="mr-2 size-3.5" />
					Reset
				</Button>
			</div>

			<div className="mt-6 grid gap-5">
				<NumberField
					id="current-age"
					label="Current Age"
					value={draft.currentAge}
					onChange={(value) => onFieldChange("currentAge", value)}
					suffix="years"
				/>
				<NumberField
					id="monthly-expenses"
					label="Monthly Expenses"
					value={draft.monthlyExpenses}
					onChange={(value) => onFieldChange("monthlyExpenses", value)}
					prefix="₹"
					helper="What you spend today, not what you earn."
				/>
				<NumberField
					id="existing-savings"
					label="Existing Savings & Investments"
					value={draft.existingSavings}
					onChange={(value) => onFieldChange("existingSavings", value)}
					prefix="₹"
					helper="Across mutual funds, PF, cash, stocks, and everything else."
				/>
			</div>

			<Separator className="my-6" />

			<Collapsible open={accuracyOpen} onOpenChange={onAccuracyOpenChange}>
				<div className={cn(subSurfaceClassName, "p-4")}>
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="flex items-center gap-1.5">
								<h3 className="text-sm font-medium text-foreground">
									Advanced Settings
								</h3>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Target age, SIP, returns, and inflation.
							</p>
						</div>
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2"
							>
								{accuracyOpen ? "Hide" : "Show"}
								<ChevronDown
									className={cn(
										"ml-1 size-4 transition-transform",
										accuracyOpen ? "rotate-180" : undefined,
									)}
								/>
							</Button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent className="mt-5 space-y-5">
						<div className="grid gap-5 sm:grid-cols-2">
							<NumberField
								id="target-retirement-age"
								label="Target Retirement Age"
								value={draft.targetRetirementAge}
								onChange={(value) =>
									onFieldChange("targetRetirementAge", value)
								}
								suffix="years"
							/>
							<NumberField
								id="monthly-sip"
								label="Monthly SIP"
								value={draft.monthlySip}
								onChange={(value) => onFieldChange("monthlySip", value)}
								prefix="₹"
							/>
							<NumberField
								id="expected-return"
								label="Expected Return"
								value={draft.expectedReturnPct}
								onChange={(value) => onFieldChange("expectedReturnPct", value)}
								suffix="%"
								tooltip={FIRE_EDUCATION.returns}
							/>
							<NumberField
								id="inflation-rate"
								label="Inflation Rate"
								value={draft.inflationPct}
								onChange={(value) => onFieldChange("inflationPct", value)}
								suffix="%"
								tooltip={FIRE_EDUCATION.inflation}
							/>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>

			<Collapsible open={fineTuneOpen} onOpenChange={onFineTuneOpenChange}>
				<div className={cn(subSurfaceClassName, "mt-4 p-4")}>
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="flex items-center gap-1.5">
								<h3 className="text-sm font-medium text-foreground">
									India Specifics
								</h3>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Safe withdrawal, healthcare, and EPF assumptions.
							</p>
						</div>
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2"
							>
								{fineTuneOpen ? "Hide" : "Show"}
								<ChevronDown
									className={cn(
										"ml-1 size-4 transition-transform",
										fineTuneOpen ? "rotate-180" : undefined,
									)}
								/>
							</Button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent className="mt-5 space-y-5">
						<div className="grid gap-5 sm:grid-cols-2">
							<NumberField
								id="swr-rate"
								label="Safe Withdrawal Rate"
								value={draft.swrPct}
								onChange={(value) => onFieldChange("swrPct", value)}
								suffix="%"
								tooltip={FIRE_EDUCATION.swr}
							/>
							<NumberField
								id="healthcare-inflation"
								label="Healthcare Inflation"
								value={draft.healthcareInflationPct}
								onChange={(value) =>
									onFieldChange("healthcareInflationPct", value)
								}
								suffix="%"
								tooltip={FIRE_EDUCATION.healthcareInflation}
							/>
							<NumberField
								id="healthcare-budget"
								label="Monthly Healthcare Budget"
								value={draft.monthlyHealthcareBudget}
								onChange={(value) =>
									onFieldChange("monthlyHealthcareBudget", value)
								}
								prefix="₹"
							/>
							<NumberField
								id="epf-monthly"
								label="EPF Monthly Contribution"
								value={draft.epfMonthlyContribution}
								onChange={(value) =>
									onFieldChange("epfMonthlyContribution", value)
								}
								prefix="₹"
								tooltip={FIRE_EDUCATION.epf}
							/>
							<NumberField
								id="epf-interest"
								label="EPF Interest Rate"
								value={draft.epfInterestPct}
								onChange={(value) => onFieldChange("epfInterestPct", value)}
								suffix="%"
							/>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>

			<p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
				<ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
				{loadedFromStorage
					? "Values loaded from local storage. They remain on your device."
					: "Values are saved locally on your device and are never sent to our servers."}
			</p>
		</div>
	);
}

function HeroCard({ result }: { result: FireResult }) {
	const onTrack =
		result.fireAge !== null &&
		result.fireAge <= result.inputs.targetRetirementAge;
	const bestLever =
		result.leverScenarios.find((lever) => lever.impact !== "low") ??
		result.leverScenarios[0];

	return (
		<section className={cn(surfaceClassName, "overflow-hidden p-6 md:p-8")}>
			<div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
				<div className="max-w-2xl">
					<div className="flex flex-wrap items-center gap-2 mb-6">
						<Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
							<Flame className="mr-1 size-3.5" />
							FIRE Number
						</Badge>
						<Badge variant="outline" className="border-border">
							{result.fireMultiplier.toFixed(1)}x Yearly Spend
						</Badge>
						<Badge
							variant="outline"
							className={cn(
								onTrack
									? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400"
									: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400",
							)}
						>
							{onTrack ? "On Track" : "Needs Adjustment"}
						</Badge>
					</div>

					<p className="text-sm font-medium text-muted-foreground">
						Your Target Corpus
					</p>

					<div className="mt-2 flex flex-col gap-6 md:flex-row md:items-end">
						<h2 className="display-title text-5xl font-bold tracking-tight text-foreground md:text-7xl">
							{formatCurrency(result.fireNumber)}
						</h2>
						{bestLever ? (
							<div className={cn(subSurfaceClassName, "max-w-[280px] p-4")}>
								<p className="text-xs font-semibold text-primary">
									Best Next Move
								</p>
								<p className="mt-1.5 text-sm font-medium text-foreground">
									{bestLever.label}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{bestLever.yearsSaved && bestLever.yearsSaved > 0
										? `Reach FIRE ${bestLever.yearsSaved.toFixed(
												bestLever.yearsSaved % 1 === 0 ? 0 : 1,
											)} years earlier`
										: bestLever.description}
								</p>
							</div>
						) : null}
					</div>
					<p className="mt-6 text-base leading-relaxed text-muted-foreground">
						To retire comfortably at age{" "}
						<strong>{result.inputs.targetRetirementAge}</strong>, you need to
						build this corpus. It accounts for a monthly spending of{" "}
						<strong>{formatMonthly(result.futureMonthlyExpenses)}</strong> and
						assumes a conservative withdrawal rate to beat Indian inflation.
					</p>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
					<MetricCard
						label="Current Pace"
						value={
							result.fireAge !== null
								? `Age ${result.fireAge}`
								: "Not Visible Yet"
						}
						subtext={formatYears(result.yearsToFire)}
						icon={Target}
					/>
					<MetricCard
						label="Remaining Gap"
						value={
							result.shortfall > 0
								? formatCurrency(result.shortfall)
								: formatCurrency(Math.abs(result.shortfall))
						}
						subtext={
							result.shortfall > 0
								? "Amount left to save"
								: "Surplus above target"
						}
						icon={ShieldAlert}
					/>
					<MetricCard
						label="Future Monthly Spend"
						value={formatMonthly(result.futureMonthlyExpenses)}
						subtext={`Estimated at age ${result.inputs.targetRetirementAge}`}
						icon={TrendingUp}
					/>
					<MetricCard
						label="Projected Corpus"
						value={formatCurrency(result.projectedCorpusAtRetirement)}
						subtext="At target retirement age"
						icon={PiggyBank}
					/>
				</div>
			</div>
		</section>
	);
}

function MetricCard({
	label,
	value,
	subtext,
	icon: Icon,
}: {
	label: string;
	value: string;
	subtext: string;
	icon: React.ComponentType<{ className?: string }>;
}) {
	return (
		<div className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
			<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
				<Icon className="size-4 text-primary" />
				{label}
			</div>
			<p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
		</div>
	);
}

function StrategySection({ result }: { result: FireResult }) {
	const primaryLevers = result.leverScenarios.slice(0, 4);

	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<SectionHeading
				kicker="Strategy"
				title="Optimize Your Plan"
				description="Explore how different paths and assumptions change your timeline."
			/>
			<Tabs defaultValue="moves" className="mt-6">
				<TabsList className="grid w-full max-w-md grid-cols-3 rounded-lg bg-muted p-1">
					<TabsTrigger value="moves" className="rounded-md">
						Key Levers
					</TabsTrigger>
					<TabsTrigger value="paths" className="rounded-md">
						FIRE Types
					</TabsTrigger>
					<TabsTrigger value="assumptions" className="rounded-md">
						Assumptions
					</TabsTrigger>
				</TabsList>

				<TabsContent value="moves" className="mt-6">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						{primaryLevers.map((scenario) => (
							<ScenarioCard key={scenario.id} scenario={scenario} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="paths" className="mt-6">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
						{result.fireTypes.map((typeResult) => (
							<FireTypeCard key={typeResult.type} typeResult={typeResult} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="assumptions" className="mt-6">
					<div className="grid gap-4 md:grid-cols-3">
						<AssumptionCard
							icon={ShieldAlert}
							title="3% Withdrawal Rate"
							body="A more conservative approach than the default 4% rule. Vital in India to weather inflation and sequence-of-returns risk."
						/>
						<AssumptionCard
							icon={HeartPulse}
							title="Separate Healthcare"
							body="Medical costs rise faster than generic inflation. Modeling them separately prevents late-life financial shocks."
						/>
						<AssumptionCard
							icon={PiggyBank}
							title="EPF Inclusion"
							body="Your Employee Provident Fund is a significant debt component. Excluding it results in an unnecessarily bloated equity target."
						/>
					</div>
				</TabsContent>
			</Tabs>
		</section>
	);
}

function FireTypeCard({ typeResult }: { typeResult: FireTypeResult }) {
	const config = FIRE_TYPE_CONFIG[typeResult.type];

	return (
		<div
			className={cn(
				"h-full rounded-xl border p-5 transition-colors",
				"border-border/60 bg-muted/20 hover:bg-muted/40",
				config.darkBg,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className={cn("text-base font-semibold", config.color)}>
						{typeResult.label}
					</p>
					<p className="mt-1.5 text-xs text-muted-foreground">
						{typeResult.description}
					</p>
				</div>
				<Badge
					variant="outline"
					className="bg-background/80 shrink-0 text-[10px]"
				>
					{getTypeBadge(typeResult)}
				</Badge>
			</div>
			<div className="mt-6">
				<p className="text-2xl font-bold text-foreground">
					{typeResult.type === "barista"
						? formatMonthly(typeResult.number)
						: formatCurrency(typeResult.number)}
				</p>
				<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
					{getTypeSubtext(typeResult)}
				</p>
			</div>
		</div>
	);
}

function getTypeBadge(typeResult: FireTypeResult) {
	if (typeResult.type === "coast") {
		return typeResult.isAchievable ? "Unlocked" : "Build Up";
	}

	if (typeResult.type === "barista") {
		return typeResult.number === 0 ? "Covered" : "Gap";
	}

	if (typeResult.yearsToReach === null) {
		return "Unclear";
	}

	return typeResult.ageAtReach !== null
		? `Age ${typeResult.ageAtReach}`
		: "Reachable";
}

function getTypeSubtext(typeResult: FireTypeResult) {
	if (typeResult.type === "coast") {
		return typeResult.isAchievable
			? "You have enough invested for compounding to finish the job by your target age."
			: "Reach this amount to let compounding do the heavy lifting from here.";
	}

	if (typeResult.type === "barista") {
		return typeResult.number === 0
			? "Your portfolio currently covers expenses at your chosen withdrawal rate."
			: "The side income you need each month if you semi-retired today.";
	}

	if (typeResult.yearsToReach === null) {
		return "Not visible within the next 50 years at your current pace.";
	}

	return `At today's pace, you reach this milestone in ${formatYears(typeResult.yearsToReach)}.`;
}

function ScenarioCard({ scenario }: { scenario: LeverScenario }) {
	return (
		<div className={cn(subSurfaceClassName, "h-full p-5")}>
			<div className="flex items-start justify-between gap-3">
				<p className="text-sm font-semibold text-foreground">
					{scenario.label}
				</p>
				<Badge
					variant="outline"
					className={cn(
						"capitalize text-[10px]",
						getImpactClasses(scenario.impact),
					)}
				>
					{scenario.impact} Impact
				</Badge>
			</div>
			<p className="mt-3 text-xs leading-relaxed text-muted-foreground">
				{scenario.description}
			</p>
			<div className="mt-5 grid gap-3">
				<div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
					<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
						New Target
					</p>
					<p className="mt-1 text-sm font-semibold text-foreground">
						{formatCurrency(scenario.newFireNumber)}
					</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
					<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
						Timeline
					</p>
					<p className="mt-1 text-sm font-semibold text-foreground">
						{scenario.yearsSaved !== null && scenario.yearsSaved > 0
							? `${scenario.yearsSaved.toFixed(
									scenario.yearsSaved % 1 === 0 ? 0 : 1,
								)} years earlier`
							: scenario.newYearsToFire !== null
								? formatYears(scenario.newYearsToFire)
								: "Needs further adjustment"}
					</p>
				</div>
			</div>
		</div>
	);
}

function AssumptionCard({
	icon: Icon,
	title,
	body,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	body: string;
}) {
	return (
		<div className={cn(subSurfaceClassName, "h-full p-5")}>
			<div className="flex items-center gap-3">
				<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon className="size-5" />
				</span>
				<h3 className="text-base font-semibold text-foreground">{title}</h3>
			</div>
			<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
				{body}
			</p>
		</div>
	);
}

function ProjectionSection({ result }: { result: FireResult }) {
	const compactInsights = getCompactInsights(result.insights);
	const chartConfig: ChartConfig = {
		corpus: {
			label: "Invested Corpus",
			color: "var(--chart-2)",
		},
		fireTarget: {
			label: "FIRE Target",
			color: "var(--chart-1)",
		},
	};

	const chartData = result.projectionPoints.map((point) => ({
		label: point.year === 0 ? "Now" : `Age ${point.age}`,
		age: point.age,
		corpus: point.corpus,
		fireTarget: point.fireTarget,
		annualExpenses: point.annualExpenses,
		epfCorpus: point.epfCorpus,
		totalWealth: point.totalWealth,
	}));

	const crossoverPoint = result.projectionPoints.find(
		(point) => point.corpus >= point.fireTarget,
	);
	const milestonePoints = CORPUS_MILESTONES.map((milestone) => {
		const point = result.projectionPoints.find(
			(projection) => projection.corpus >= milestone.value,
		);

		if (!point) return null;

		return {
			...point,
			label: point.year === 0 ? "Now" : `Age ${point.age}`,
			milestoneLabel: milestone.label,
		};
	}).filter(
		(
			point,
		): point is FireProjectionPoint & {
			label: string;
			milestoneLabel: string;
		} => Boolean(point),
	);

	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<SectionHeading
				kicker="Trajectory"
				title="Wealth Projection"
				description="Watch your investments grow alongside your shifting target. The crossover is where work becomes optional."
				action={
					<div
						className={cn(
							"rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-right",
						)}
					>
						<p className="text-sm font-semibold text-primary">
							{crossoverPoint
								? `Crossover at Age ${crossoverPoint.age}`
								: "No Crossover Yet"}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{crossoverPoint
								? `${formatCurrency(crossoverPoint.corpus)} > ${formatCurrency(crossoverPoint.fireTarget)}`
								: "Keep tweaking levers."}
						</p>
					</div>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start mt-6">
				<div
					className={cn(
						"rounded-xl border border-border bg-card p-4 shadow-sm",
					)}
				>
					<ChartContainer config={chartConfig} className="h-80 w-full">
						<ComposedChart
							accessibilityLayer
							data={chartData}
							margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
						>
							<CartesianGrid
								vertical={false}
								strokeDasharray="3 3"
								opacity={0.5}
							/>
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								minTickGap={30}
								tickMargin={10}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={60}
								tickFormatter={(value) =>
									formatCurrency(Number(value)).replace("₹", "")
								}
								tickMargin={10}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value, name, _item, _index, _payload) => {
											if (name === "annualExpenses") {
												return null;
											}

											return (
												<div className="flex min-w-[180px] items-center justify-between gap-4">
													<span className="text-sm text-muted-foreground">
														{chartConfig[String(name)]?.label ?? String(name)}
													</span>
													<span className="font-semibold text-foreground">
														{formatCurrency(Number(value))}
													</span>
												</div>
											);
										}}
										labelFormatter={(label, payload) => {
											const point = payload?.[0]?.payload;
											if (!point) return String(label);

											return (
												<div className="mb-2 border-b border-border pb-2">
													<p className="font-medium text-foreground">
														{String(label)}
													</p>
													<p className="mt-1 text-xs text-muted-foreground">
														Annual Spend: {formatCurrency(point.annualExpenses)}
													</p>
												</div>
											);
										}}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent />} />
							<Area
								type="monotone"
								dataKey="corpus"
								stroke="var(--color-corpus)"
								fill="url(#corpusGradient)"
								fillOpacity={1}
								strokeWidth={2.5}
							/>
							<defs>
								<linearGradient id="corpusGradient" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-corpus)"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-corpus)"
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<Line
								type="monotone"
								dataKey="fireTarget"
								stroke="var(--color-fireTarget)"
								strokeWidth={2.5}
								strokeDasharray="6 6"
								dot={false}
							/>
							{crossoverPoint ? (
								<ReferenceLine
									x={
										crossoverPoint.year === 0
											? "Now"
											: `Age ${crossoverPoint.age}`
									}
									stroke="var(--color-primary)"
									strokeDasharray="4 4"
									opacity={0.6}
								/>
							) : null}
							{crossoverPoint ? (
								<ReferenceDot
									x={
										crossoverPoint.year === 0
											? "Now"
											: `Age ${crossoverPoint.age}`
									}
									y={crossoverPoint.corpus}
									r={6}
									fill="var(--color-primary)"
									stroke="var(--color-background)"
									strokeWidth={2}
								/>
							) : null}
							{milestonePoints.map((point) => (
								<ReferenceDot
									key={`${point.milestoneLabel}-${point.age}`}
									x={point.label}
									y={point.corpus}
									r={4}
									fill="var(--color-corpus)"
									stroke="var(--color-background)"
									strokeWidth={1.5}
								/>
							))}
						</ComposedChart>
					</ChartContainer>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
					{compactInsights.map((insight) => (
						<div
							key={insight.id}
							className={cn(
								"rounded-xl border p-5 transition-colors",
								getInsightToneClasses(insight.tone),
							)}
						>
							<p className="text-xs font-semibold uppercase tracking-wider opacity-80">
								{insight.title}
							</p>
							<p className="mt-2 text-2xl font-bold">{insight.value}</p>
							<p className="mt-2 text-sm leading-relaxed opacity-90">
								{insight.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function YearByYearTable({
	points,
	open,
	onOpenChange,
}: {
	points: FireProjectionPoint[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold text-primary">Data</p>
						<h2 className="mt-1 text-2xl font-semibold text-foreground">
							Year-by-Year Breakdown
						</h2>
						<p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
							Inspect every year of your compounding journey to see the exact
							figures driving the projection.
						</p>
					</div>
					<CollapsibleTrigger asChild>
						<Button type="button" variant="outline" size="sm">
							{open ? "Hide Table" : "View Details"}
							<ChevronDown
								className={cn(
									"ml-2 size-4 transition-transform",
									open ? "rotate-180" : undefined,
								)}
							/>
						</Button>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent className="mt-8 overflow-x-auto">
					<div className="min-w-[800px] rounded-lg border border-border bg-card">
						<Table>
							<TableHeader className="bg-muted/50">
								<TableRow>
									<TableHead className="w-20 font-semibold">Age</TableHead>
									<TableHead className="font-semibold">
										Invested Corpus
									</TableHead>
									<TableHead className="font-semibold">EPF</TableHead>
									<TableHead className="font-semibold">Total Wealth</TableHead>
									<TableHead className="font-semibold">FIRE Target</TableHead>
									<TableHead className="font-semibold">Gap</TableHead>
									<TableHead className="font-semibold">
										Annual Expenses
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{points.map((point) => (
									<TableRow
										key={`${point.age}-${point.year}`}
										className="hover:bg-muted/30"
									>
										<TableCell className="font-medium">{point.age}</TableCell>
										<TableCell>{formatCurrency(point.corpus)}</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(point.epfCorpus)}
										</TableCell>
										<TableCell className="font-medium">
											{formatCurrency(point.totalWealth)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(point.fireTarget)}
										</TableCell>
										<TableCell
											className={cn(
												"font-medium",
												point.corpus >= point.fireTarget
													? "text-emerald-600 dark:text-emerald-400"
													: "text-amber-600 dark:text-amber-400",
											)}
										>
											{formatCurrency(point.corpus - point.fireTarget)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(point.annualExpenses)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</section>
	);
}

function FireExplainer() {
	return (
		<div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-4">
			<div className="hidden sm:flex mt-0.5 size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
				<HelpCircle className="size-4" />
			</div>
			<div>
				<h3 className="text-sm font-semibold text-foreground">
					What is a FIRE Number?
				</h3>
				<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
					<strong>Financial Independence, Retire Early (FIRE)</strong> is a
					strategy built on extreme savings. Your FIRE Number is the exact
					amount you need to invest so the returns cover your living expenses
					indefinitely. We’ve calibrated this tool specifically for the Indian
					economy, factoring in realistic inflation and EPF.
				</p>
			</div>
		</div>
	);
}

export function FirePage() {
	const [draft, setDraft] = useState<FireInputDraft>(() =>
		createDraft(FIRE_DEFAULTS),
	);
	const [accuracyOpen, setAccuracyOpen] = useState(false);
	const [fineTuneOpen, setFineTuneOpen] = useState(false);
	const [tableOpen, setTableOpen] = useState(false);
	const [storageReady, setStorageReady] = useState(false);
	const [loadedFromStorage, setLoadedFromStorage] = useState(false);

	useEffect(() => {
		const stored = loadStoredFireState();
		if (stored) {
			setDraft(stored.draft);
			setAccuracyOpen(stored.accuracyOpen);
			setFineTuneOpen(stored.fineTuneOpen);
			setTableOpen(stored.tableOpen);
			setLoadedFromStorage(true);
		}

		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredFireState({
			draft,
			accuracyOpen,
			fineTuneOpen,
			tableOpen,
		});
	}, [accuracyOpen, draft, fineTuneOpen, storageReady, tableOpen]);

	const inputs = useMemo(() => buildInputsFromDraft(draft), [draft]);
	const result = useMemo(() => calculateFire(inputs), [inputs]);

	const setField = (key: keyof FireInputs, value: string) => {
		setDraft((current) => ({
			...current,
			[key]: value,
		}));
	};

	return (
		<div className="min-h-dvh bg-background text-foreground selection:bg-primary/20 selection:text-primary">
			<SiteNav />
			<main className="page-wrap pb-20 pt-8">
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<Link
							to="/"
							className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							<ArrowLeft className="size-4" />
							Back to Tools
						</Link>
						<h1 className="display-title text-4xl font-bold leading-tight text-foreground md:text-5xl">
							FIRE Calculator
						</h1>
						<p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
							Determine exactly when work becomes optional. Designed for the
							Indian economic context.
						</p>
					</div>
				</div>

				<FireExplainer />

				<div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
					<InputPanel
						draft={draft}
						onFieldChange={setField}
						accuracyOpen={accuracyOpen}
						onAccuracyOpenChange={setAccuracyOpen}
						fineTuneOpen={fineTuneOpen}
						onFineTuneOpenChange={setFineTuneOpen}
						onReset={() => {
							setDraft(createDraft(FIRE_DEFAULTS));
							setAccuracyOpen(false);
							setFineTuneOpen(false);
							setTableOpen(false);
							setLoadedFromStorage(false);
						}}
						loadedFromStorage={loadedFromStorage}
					/>

					<div className="space-y-6 min-w-0">
						<HeroCard result={result} />
						<ProjectionSection result={result} />
						<StrategySection result={result} />
						<YearByYearTable
							points={result.projectionPoints}
							open={tableOpen}
							onOpenChange={setTableOpen}
						/>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
