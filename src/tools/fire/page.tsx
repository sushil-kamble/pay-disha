import {
	ChevronDown,
	Info,
	PiggyBank,
	RefreshCcw,
	ShieldAlert,
	Target,
	TrendingUp,
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
	tableOpen: boolean;
};

const FIRE_INPUT_KEYS = Object.keys(FIRE_DEFAULTS) as Array<keyof FireInputs>;

const surfaceClassName = "rounded-2xl border border-border bg-card shadow-sm";
const sectionPaddingClassName = "p-5 sm:p-6 md:p-7";
const subSurfaceClassName = "rounded-xl border border-border bg-muted/40";

function createDraft(inputs: FireInputs): FireInputDraft {
	return {
		currentAge: String(inputs.currentAge),
		monthlyExpenses: String(inputs.monthlyExpenses),
		existingSavings: String(inputs.existingSavings),
		targetRetirementAge: String(inputs.targetRetirementAge),
		monthlySip: String(inputs.monthlySip),
		annualSipStepUpPct: String(inputs.annualSipStepUpPct),
		expectedReturnPct: String(inputs.expectedReturnPct),
		inflationPct: String(inputs.inflationPct),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isFireInputDraft(value: unknown): value is FireInputDraft {
	if (!isRecord(value)) return false;

	return FIRE_INPUT_KEYS.every((key) => typeof value[key] === "string");
}

function normalizeStoredFireInputDraft(value: unknown): FireInputDraft | null {
	if (!isRecord(value)) return null;

	const mergedDraft = {
		...createDraft(FIRE_DEFAULTS),
		...value,
	};

	return isFireInputDraft(mergedDraft) ? mergedDraft : null;
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
	const draft = normalizeStoredFireInputDraft(parsed.draft);
	if (
		!draft ||
		typeof parsed.accuracyOpen !== "boolean" ||
		typeof parsed.tableOpen !== "boolean"
	) {
		return null;
	}

	return {
		draft,
		accuracyOpen: parsed.accuracyOpen,
		tableOpen: parsed.tableOpen,
	};
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
		annualSipStepUpPct: clamp(
			parseNumber(draft.annualSipStepUpPct, FIRE_DEFAULTS.annualSipStepUpPct),
			FIRE_LIMITS.minAnnualSipStepUpPct,
			FIRE_LIMITS.maxAnnualSipStepUpPct,
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
		return "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100";
	}

	if (tone === "caution") {
		return "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
	}

	if (tone === "surprise") {
		return "border-cyan-200 bg-cyan-50/80 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100";
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
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div className="min-w-0">
				<p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
					{kicker}
				</p>
				<h2 className="mt-1 text-xl font-semibold text-foreground md:text-2xl">
					{title}
				</h2>
				{description ? (
					<p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
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
				<Label htmlFor={id} className="text-xs font-medium text-foreground">
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
	onReset,
	loadedFromStorage,
}: {
	draft: FireInputDraft;
	onFieldChange: (key: keyof FireInputs, value: string) => void;
	accuracyOpen: boolean;
	onAccuracyOpenChange: (open: boolean) => void;
	onReset: () => void;
	loadedFromStorage: boolean;
}) {
	return (
		<div className={cn(surfaceClassName, "p-5 lg:p-6")}>
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
					helper="What you spend each month, not what you earn."
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
								className="h-8 px-2 text-foreground hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/40"
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
						<div className="grid gap-5">
							<NumberField
								id="target-retirement-age"
								label="Target Retirement Age"
								value={draft.targetRetirementAge}
								onChange={(value) =>
									onFieldChange("targetRetirementAge", value)
								}
								suffix="years"
								helper="The age by which you want work to become optional."
							/>
							<NumberField
								id="monthly-sip"
								label="Monthly SIP"
								value={draft.monthlySip}
								onChange={(value) => onFieldChange("monthlySip", value)}
								prefix="₹"
								helper="Your current monthly investment toward FIRE."
							/>
							<NumberField
								id="annual-sip-step-up"
								label="Annual SIP Step-up"
								value={draft.annualSipStepUpPct}
								onChange={(value) => onFieldChange("annualSipStepUpPct", value)}
								suffix="%"
								helper={FIRE_EDUCATION.stepUp}
							/>
							<NumberField
								id="expected-return"
								label="Expected Return"
								value={draft.expectedReturnPct}
								onChange={(value) => onFieldChange("expectedReturnPct", value)}
								suffix="%"
								helper={FIRE_EDUCATION.returns}
							/>
							<NumberField
								id="inflation-rate"
								label="Inflation Rate"
								value={draft.inflationPct}
								onChange={(value) => onFieldChange("inflationPct", value)}
								suffix="%"
								helper={FIRE_EDUCATION.inflation}
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
	const bestLever =
		result.leverScenarios.find((lever) => lever.impact !== "low") ??
		result.leverScenarios[0];

	return (
		<section
			className={cn(
				surfaceClassName,
				sectionPaddingClassName,
				"overflow-hidden",
			)}
		>
			{/* Target corpus label + big number (whitespace-nowrap keeps Cr on same line) */}
			<p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
				FIRE Number
			</p>
			<div className="mt-2">
				<h2 className="display-title text-5xl font-bold tracking-tight text-foreground md:text-7xl whitespace-nowrap">
					{formatCurrency(result.fireNumber)}
				</h2>
			</div>

			{/* Four metric cards — 2 per row — below the corpus number */}
			<div className="mt-6 grid gap-3 sm:grid-cols-2">
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

			{/* Description */}
			<p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
				<strong>{formatCurrency(result.fireNumber)}</strong> is the estimated
				corpus you would need by age{" "}
				<strong>{result.inputs.targetRetirementAge}</strong> for your
				investments to support your expected expenses without relying on a
				salary.
			</p>

			{/* Best next move */}
			{bestLever ? (
				<div
					className={cn(
						subSurfaceClassName,
						"mt-4 flex items-center justify-between gap-3 border-primary/20 bg-primary/5 px-4 py-3",
					)}
				>
					<div className="min-w-0">
						<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
							Next move
						</p>
						<p className="truncate text-sm font-semibold text-foreground">
							{bestLever.label}
						</p>
					</div>
					<div className="flex shrink-0 items-center gap-2 text-right">
						<p className="hidden text-xs font-medium text-muted-foreground sm:block">
							{bestLever.yearsSaved && bestLever.yearsSaved > 0
								? `${bestLever.yearsSaved.toFixed(
										bestLever.yearsSaved % 1 === 0 ? 0 : 1,
									)} years earlier`
								: "See why"}
						</p>
					</div>
				</div>
			) : null}
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
		<div className="rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
			<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
				<Icon className="size-3.5 text-primary" />
				{label}
			</div>
			<p className="mt-2 text-lg font-bold text-foreground">{value}</p>
			<p className="mt-1 text-[11px] leading-snug text-muted-foreground">
				{subtext}
			</p>
		</div>
	);
}

function StrategySection({ result }: { result: FireResult }) {
	const primaryLevers = result.leverScenarios.slice(0, 4);

	return (
		<section className={cn(surfaceClassName, sectionPaddingClassName)}>
			<SectionHeading
				kicker="Strategy"
				title="Optimize your plan"
				description="Different levers and paths that reshape your timeline."
			/>
			<Tabs defaultValue="moves" className="mt-5">
				<TabsList className="grid w-full grid-cols-3 rounded-lg bg-muted p-1 sm:max-w-md">
					<TabsTrigger value="moves" className="rounded-md text-xs sm:text-sm">
						Key Levers
					</TabsTrigger>
					<TabsTrigger value="paths" className="rounded-md text-xs sm:text-sm">
						FIRE Types
					</TabsTrigger>
					<TabsTrigger
						value="assumptions"
						className="rounded-md text-xs sm:text-sm"
					>
						Assumptions
					</TabsTrigger>
				</TabsList>

				<TabsContent value="moves" className="mt-4">
					<div className="grid gap-3 sm:grid-cols-2">
						{primaryLevers.map((scenario) => (
							<ScenarioCard key={scenario.id} scenario={scenario} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="paths" className="mt-4">
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{result.fireTypes.map((typeResult) => (
							<FireTypeCard key={typeResult.type} typeResult={typeResult} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="assumptions" className="mt-4">
					<div className="grid gap-2.5">
						<AssumptionCard
							icon={ShieldAlert}
							title="33x Corpus Multiple"
							body="Conservative India-oriented benchmark — 33× your inflated annual expenses at target age."
						/>
						<AssumptionCard
							icon={TrendingUp}
							title="Inflation-Adjusted Spending"
							body="Monthly expenses are inflated to your target age before calculating the FIRE number."
						/>
						<AssumptionCard
							icon={PiggyBank}
							title="Liquid Corpus Only"
							body="Existing savings + SIP growth are treated as the investable FIRE corpus."
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
				"flex h-full flex-col rounded-xl border p-4 transition-colors",
				"border-border/60 bg-muted/20 hover:bg-muted/40",
				config.darkBg,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<p className={cn("text-sm font-semibold", config.color)}>
					{typeResult.label}
				</p>
				<Badge
					variant="outline"
					className="bg-background/80 shrink-0 text-[10px]"
				>
					{getTypeBadge(typeResult)}
				</Badge>
			</div>
			<p className="mt-2 text-lg font-bold text-foreground">
				{typeResult.type === "barista"
					? formatMonthly(typeResult.number)
					: formatCurrency(typeResult.number)}
			</p>
			<p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
				{typeResult.description}
			</p>
			<p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
				{getTypeSubtext(typeResult)}
			</p>
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
			? "Your portfolio currently covers expenses under the configured corpus model."
			: "The side income you need each month if you semi-retired now.";
	}

	if (typeResult.yearsToReach === null) {
		return "Not visible within the next 50 years at your current pace.";
	}

	return `At your current pace, you reach this milestone in ${formatYears(typeResult.yearsToReach)}.`;
}

function ScenarioCard({ scenario }: { scenario: LeverScenario }) {
	const yearsSaved = scenario.yearsSaved ?? 0;
	const headline =
		yearsSaved > 0
			? `${yearsSaved.toFixed(yearsSaved % 1 === 0 ? 0 : 1)}y sooner`
			: scenario.newYearsToFire !== null
				? formatYears(scenario.newYearsToFire)
				: "Needs more";

	return (
		<div
			className={cn(
				"flex h-full flex-col rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<p className="text-sm font-semibold leading-snug text-foreground">
					{scenario.label}
				</p>
				<Badge
					variant="outline"
					className={cn(
						"shrink-0 capitalize text-[10px]",
						getImpactClasses(scenario.impact),
					)}
				>
					{scenario.impact}
				</Badge>
			</div>
			<div className="mt-3 flex items-baseline gap-2">
				<p
					className={cn(
						"text-xl font-bold tracking-tight",
						yearsSaved > 0
							? "text-emerald-600 dark:text-emerald-400"
							: "text-foreground",
					)}
				>
					{headline}
				</p>
				<span className="text-[11px] text-muted-foreground">
					→ {formatCurrency(scenario.newFireNumber)}
				</span>
			</div>
			<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
				{scenario.description}
			</p>
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
		<div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
			<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Icon className="size-4" />
			</span>
			<div className="min-w-0">
				<h3 className="text-sm font-semibold text-foreground">{title}</h3>
				<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
					{body}
				</p>
			</div>
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

	const crossoverPoint = result.projectionPoints.find(
		(point) => point.corpus >= point.fireTarget,
	);

	const chartData = result.projectionPoints.map((point) => ({
		label: point.year === 0 ? "Now" : `Age ${point.age}`,
		age: point.age,
		corpus: point.corpus,
		fireTarget: point.fireTarget,
		annualExpenses: point.annualExpenses,
	}));

	return (
		<section className={cn(surfaceClassName, sectionPaddingClassName)}>
			<SectionHeading
				kicker="Trajectory"
				title="Wealth Projection"
				description="Corpus growth vs your inflation-adjusted FIRE number."
			/>

			<div className="mt-5 space-y-5">
				<div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm md:p-4">
					<ChartContainer config={chartConfig} className="h-88 w-full">
						<ComposedChart
							accessibilityLayer
							data={chartData}
							margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
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
									strokeWidth={2}
									strokeDasharray="5 4"
									label={{
										value: `FIRE @ ${crossoverPoint.age}`,
										position: "top",
										fill: "var(--color-primary)",
										fontSize: 12,
										fontWeight: 700,
									}}
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
									r={9}
									fill="var(--color-primary)"
									stroke="var(--color-background)"
									strokeWidth={3}
								/>
							) : null}
						</ComposedChart>
					</ChartContainer>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					{compactInsights.map((insight) => (
						<div
							key={insight.id}
							className={cn(
								"rounded-xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors",
								getInsightToneClasses(insight.tone),
							)}
						>
							<div className="flex items-start justify-between gap-4">
								<p className="text-sm font-bold leading-snug opacity-80">
									{insight.title}
								</p>
								<p className="shrink-0 text-right text-2xl font-extrabold leading-none tracking-tight">
									{insight.value}
								</p>
							</div>
							<p className="mt-3 text-sm leading-relaxed opacity-85">
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
		<section className={cn(surfaceClassName, sectionPaddingClassName)}>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				<div className="flex items-end justify-between gap-3">
					<div className="min-w-0">
						<p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
							Data
						</p>
						<h2 className="mt-1 text-xl font-semibold text-foreground md:text-2xl">
							Year-by-year breakdown
						</h2>
						<p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Every year of compounding driving the projection.
						</p>
					</div>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="shrink-0 hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/40"
						>
							{open ? "Hide" : "View"}
							<ChevronDown
								className={cn(
									"ml-1.5 size-4 transition-transform",
									open ? "rotate-180" : undefined,
								)}
							/>
						</Button>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent className="mt-5 overflow-x-auto">
					<div className="min-w-[680px] rounded-lg border border-border bg-card">
						<Table>
							<TableHeader className="bg-muted/50">
								<TableRow>
									<TableHead className="w-20 font-semibold">Age</TableHead>
									<TableHead className="font-semibold">
										Invested Corpus
									</TableHead>
									<TableHead className="font-semibold">
										Total Investment
									</TableHead>
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
											{formatCurrency(point.totalInvestment)}
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

export function FirePage() {
	const [draft, setDraft] = useState<FireInputDraft>(() =>
		createDraft(FIRE_DEFAULTS),
	);
	const [accuracyOpen, setAccuracyOpen] = useState(false);
	const [tableOpen, setTableOpen] = useState(false);
	const [storageReady, setStorageReady] = useState(false);
	const [loadedFromStorage, setLoadedFromStorage] = useState(false);

	useEffect(() => {
		const stored = loadStoredFireState();
		if (stored) {
			setDraft(stored.draft);
			setAccuracyOpen(stored.accuracyOpen);
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
			tableOpen,
		});
	}, [accuracyOpen, draft, storageReady, tableOpen]);

	const inputs = useMemo(() => buildInputsFromDraft(draft), [draft]);
	const result = useMemo(() => calculateFire(inputs), [inputs]);

	const setField = (key: keyof FireInputs, value: string) => {
		setDraft((current) => ({
			...current,
			[key]: value,
		}));
	};

	return (
		<ToolPageShell
			title="FIRE Calculator"
			className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
			backLinkClassName="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
		>
			<div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
				<InputPanel
					draft={draft}
					onFieldChange={setField}
					accuracyOpen={accuracyOpen}
					onAccuracyOpenChange={setAccuracyOpen}
					onReset={() => {
						setDraft(createDraft(FIRE_DEFAULTS));
						setAccuracyOpen(false);
						setTableOpen(false);
						setLoadedFromStorage(false);
					}}
					loadedFromStorage={loadedFromStorage}
				/>

				<div className="space-y-5 min-w-0">
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
		</ToolPageShell>
	);
}
