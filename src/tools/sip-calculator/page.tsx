import { Link } from "@tanstack/react-router";
import {
	ChevronDown,
	Compass,
	Info,
	PiggyBank,
	RefreshCcw,
	Rocket,
	ShieldCheck,
	Sparkles,
	Target,
	TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
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
import {
	calculateSipPlan,
	formatCurrency,
} from "#/tools/sip-calculator/calculator";
import {
	getSipDefaults,
	SIP_EDUCATION,
	SIP_GOAL_PRESETS,
	SIP_LIMITS,
	SIP_STORAGE_KEY,
} from "#/tools/sip-calculator/constants";
import type {
	SipGoalPreset,
	SipInputs,
	SipInsight,
	SipLeverScenario,
	SipProjectionPoint,
	SipResult,
} from "#/tools/sip-calculator/types";

type SipInputDraft = {
	goalPreset: SipGoalPreset;
	targetAmountToday: string;
	yearsToGoal: string;
	monthlySip: string;
	startingCorpus: string;
	annualStepUpPct: string;
	expectedReturnPct: string;
	realValueInflationPct: string;
	goalInflationPct: string;
	monthlyExpenses: string;
};

type PersistedSipState = {
	draft: SipInputDraft;
	advancedOpen: boolean;
	tableOpen: boolean;
	assumptionsOpen: boolean;
};

const DEFAULT_INPUTS = getSipDefaults();
const surfaceClassName =
	"rounded-[28px] border border-border/80 bg-background/85 shadow-sm shadow-black/5 backdrop-blur";
const subSurfaceClassName =
	"rounded-2xl border border-border/80 bg-background/70";

function createDraft(inputs: SipInputs): SipInputDraft {
	return {
		goalPreset: inputs.goalPreset,
		targetAmountToday: String(inputs.targetAmountToday),
		yearsToGoal: String(inputs.yearsToGoal),
		monthlySip: String(inputs.monthlySip),
		startingCorpus: String(inputs.startingCorpus),
		annualStepUpPct: String(inputs.annualStepUpPct),
		expectedReturnPct: String(inputs.expectedReturnPct),
		realValueInflationPct: String(inputs.realValueInflationPct),
		goalInflationPct: String(inputs.goalInflationPct),
		monthlyExpenses:
			inputs.monthlyExpenses !== null ? String(inputs.monthlyExpenses) : "",
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSipGoalPreset(value: unknown): value is SipGoalPreset {
	return typeof value === "string" && value in SIP_GOAL_PRESETS;
}

function isSipInputDraft(value: unknown): value is SipInputDraft {
	if (!isRecord(value)) return false;

	return (
		isSipGoalPreset(value.goalPreset) &&
		typeof value.targetAmountToday === "string" &&
		typeof value.yearsToGoal === "string" &&
		typeof value.monthlySip === "string" &&
		typeof value.startingCorpus === "string" &&
		typeof value.annualStepUpPct === "string" &&
		typeof value.expectedReturnPct === "string" &&
		typeof value.realValueInflationPct === "string" &&
		typeof value.goalInflationPct === "string" &&
		typeof value.monthlyExpenses === "string"
	);
}

function parseStoredJson(rawValue: string | null) {
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
}

function loadStoredState(): PersistedSipState | null {
	const parsed = parseStoredJson(window.localStorage.getItem(SIP_STORAGE_KEY));
	if (!isRecord(parsed)) return null;
	if (
		!isSipInputDraft(parsed.draft) ||
		typeof parsed.advancedOpen !== "boolean" ||
		typeof parsed.tableOpen !== "boolean" ||
		typeof parsed.assumptionsOpen !== "boolean"
	) {
		return null;
	}

	return parsed as PersistedSipState;
}

function saveStoredState(value: PersistedSipState) {
	try {
		window.localStorage.setItem(SIP_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Ignore storage write issues such as private-mode quota limits.
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

function parseOptionalNumber(value: string) {
	if (!value.trim()) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function buildInputsFromDraft(draft: SipInputDraft): SipInputs {
	return {
		goalPreset: draft.goalPreset,
		targetAmountToday: clamp(
			parseNumber(draft.targetAmountToday, DEFAULT_INPUTS.targetAmountToday),
			SIP_LIMITS.minTargetAmountToday,
			SIP_LIMITS.maxTargetAmountToday,
		),
		yearsToGoal: clamp(
			parseInteger(draft.yearsToGoal, DEFAULT_INPUTS.yearsToGoal),
			SIP_LIMITS.minYearsToGoal,
			SIP_LIMITS.maxYearsToGoal,
		),
		monthlySip: clamp(
			parseNumber(draft.monthlySip, DEFAULT_INPUTS.monthlySip),
			SIP_LIMITS.minMonthlySip,
			SIP_LIMITS.maxMonthlySip,
		),
		startingCorpus: clamp(
			parseNumber(draft.startingCorpus, DEFAULT_INPUTS.startingCorpus),
			SIP_LIMITS.minStartingCorpus,
			SIP_LIMITS.maxStartingCorpus,
		),
		annualStepUpPct: clamp(
			parseNumber(draft.annualStepUpPct, DEFAULT_INPUTS.annualStepUpPct),
			SIP_LIMITS.minAnnualStepUpPct,
			SIP_LIMITS.maxAnnualStepUpPct,
		),
		expectedReturnPct: clamp(
			parseNumber(draft.expectedReturnPct, DEFAULT_INPUTS.expectedReturnPct),
			SIP_LIMITS.minExpectedReturnPct,
			SIP_LIMITS.maxExpectedReturnPct,
		),
		realValueInflationPct: clamp(
			parseNumber(
				draft.realValueInflationPct,
				DEFAULT_INPUTS.realValueInflationPct,
			),
			SIP_LIMITS.minRealValueInflationPct,
			SIP_LIMITS.maxRealValueInflationPct,
		),
		goalInflationPct: clamp(
			parseNumber(draft.goalInflationPct, DEFAULT_INPUTS.goalInflationPct),
			SIP_LIMITS.minGoalInflationPct,
			SIP_LIMITS.maxGoalInflationPct,
		),
		monthlyExpenses: (() => {
			const parsed = parseOptionalNumber(draft.monthlyExpenses);
			if (parsed === null) return null;
			return clamp(
				parsed,
				SIP_LIMITS.minMonthlyExpenses,
				SIP_LIMITS.maxMonthlyExpenses,
			);
		})(),
		startYear: DEFAULT_INPUTS.startYear,
	};
}

function formatYears(value: number | null) {
	if (value === null) return "Not visible";
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)} years`;
}

function getInsightToneClasses(tone: SipInsight["tone"]) {
	if (tone === "positive") {
		return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100";
	}

	if (tone === "caution") {
		return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
	}

	if (tone === "surprise") {
		return "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100";
	}

	return "border-border bg-muted/40 text-foreground";
}

function getImpactClasses(impact: SipLeverScenario["impact"]) {
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
					<Info className="size-3.5" />
				</button>
			</TooltipTrigger>
			<TooltipContent className="max-w-72 p-3 text-sm leading-relaxed text-pretty">
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
	prefix,
	suffix,
	helper,
	tooltip,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	prefix?: string;
	suffix?: string;
	helper?: string;
	tooltip?: string;
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
					className={cn(
						"h-11",
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
				<p className="text-xs leading-relaxed text-muted-foreground">
					{helper}
				</p>
			) : null}
		</div>
	);
}

function GoalPresetCard({
	preset,
	active,
	onSelect,
}: {
	preset: SipGoalPreset;
	active: boolean;
	onSelect: (preset: SipGoalPreset) => void;
}) {
	const config = SIP_GOAL_PRESETS[preset];

	return (
		<button
			type="button"
			onClick={() => onSelect(preset)}
			className={cn(
				"rounded-2xl border px-4 py-4 text-left transition-all",
				active
					? "border-primary bg-primary/8 shadow-sm shadow-primary/10"
					: "border-border bg-background/70 hover:border-primary/30 hover:bg-muted/30",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-foreground">
						{config.label}
					</p>
					<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
						{config.description}
					</p>
				</div>
				<Badge
					variant="outline"
					className={cn(
						"shrink-0 text-[10px]",
						active ? "border-primary/30 bg-primary/10 text-primary" : undefined,
					)}
				>
					{config.defaultGoalInflationPct}% infl.
				</Badge>
			</div>
		</button>
	);
}

function InputPanel({
	draft,
	onFieldChange,
	onGoalPresetChange,
	advancedOpen,
	onAdvancedOpenChange,
	onReset,
	loadedFromStorage,
}: {
	draft: SipInputDraft;
	onFieldChange: (
		key: keyof Omit<SipInputDraft, "goalPreset">,
		value: string,
	) => void;
	onGoalPresetChange: (value: SipGoalPreset) => void;
	advancedOpen: boolean;
	onAdvancedOpenChange: (open: boolean) => void;
	onReset: () => void;
	loadedFromStorage: boolean;
}) {
	const activeGoalPreset = SIP_GOAL_PRESETS[draft.goalPreset];

	return (
		<div className={cn(surfaceClassName, "p-5 lg:sticky lg:top-24 lg:p-6")}>
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-primary">Quick Start</p>
					<h2 className="mt-1 text-xl font-semibold text-foreground">
						Plan the future in 30 seconds
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Pick the goal, type today&apos;s price tag, and see the path.
					</p>
				</div>
				<Button type="button" variant="outline" size="sm" onClick={onReset}>
					<RefreshCcw className="mr-2 size-3.5" />
					Reset
				</Button>
			</div>

			<div className="mt-6 grid gap-3">
				{(Object.keys(SIP_GOAL_PRESETS) as SipGoalPreset[]).map((preset) => (
					<GoalPresetCard
						key={preset}
						preset={preset}
						active={preset === draft.goalPreset}
						onSelect={onGoalPresetChange}
					/>
				))}
			</div>

			<p className="mt-4 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
				{activeGoalPreset.helper}
			</p>

			<div className="mt-6 grid gap-5">
				<NumberField
					id="goal-amount"
					label="Goal cost today"
					value={draft.targetAmountToday}
					onChange={(value) => onFieldChange("targetAmountToday", value)}
					prefix="₹"
					helper="What this goal would cost if you had to pay for it right now."
				/>
				<NumberField
					id="years-to-goal"
					label="Years to goal"
					value={draft.yearsToGoal}
					onChange={(value) => onFieldChange("yearsToGoal", value)}
					suffix="years"
					helper="This sets the deadline. The tool will tell you if your current SIP misses it."
				/>
				<NumberField
					id="monthly-sip"
					label="Current monthly SIP"
					value={draft.monthlySip}
					onChange={(value) => onFieldChange("monthlySip", value)}
					prefix="₹"
					helper="Start with what you can honestly sustain today."
				/>
			</div>

			<Separator className="my-6" />

			<Collapsible open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
				<div className={cn(subSurfaceClassName, "p-4")}>
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="text-sm font-medium text-foreground">
								Advanced assumptions
							</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								Starting corpus, step-up, return, and inflation.
							</p>
						</div>
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2"
							>
								{advancedOpen ? "Hide" : "Show"}
								<ChevronDown
									className={cn(
										"ml-1 size-4 transition-transform",
										advancedOpen ? "rotate-180" : undefined,
									)}
								/>
							</Button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent className="mt-5 space-y-5">
						<div className="grid gap-5 sm:grid-cols-2">
							<NumberField
								id="starting-corpus"
								label="Starting corpus"
								value={draft.startingCorpus}
								onChange={(value) => onFieldChange("startingCorpus", value)}
								prefix="₹"
								helper="Any money already invested for this journey."
							/>
							<NumberField
								id="step-up"
								label="Annual SIP step-up"
								value={draft.annualStepUpPct}
								onChange={(value) => onFieldChange("annualStepUpPct", value)}
								suffix="%"
								tooltip={SIP_EDUCATION.stepUp}
							/>
							<NumberField
								id="expected-return"
								label="Expected return"
								value={draft.expectedReturnPct}
								onChange={(value) => onFieldChange("expectedReturnPct", value)}
								suffix="%"
								tooltip={SIP_EDUCATION.expectedReturn}
							/>
							<NumberField
								id="goal-inflation"
								label="Goal inflation"
								value={draft.goalInflationPct}
								onChange={(value) => onFieldChange("goalInflationPct", value)}
								suffix="%"
								tooltip={SIP_EDUCATION.goalInflation}
							/>
							<NumberField
								id="real-inflation"
								label="Real-value inflation"
								value={draft.realValueInflationPct}
								onChange={(value) =>
									onFieldChange("realValueInflationPct", value)
								}
								suffix="%"
								tooltip={SIP_EDUCATION.realValueInflation}
							/>
							<NumberField
								id="monthly-expenses"
								label="Current monthly expenses"
								value={draft.monthlyExpenses}
								onChange={(value) => onFieldChange("monthlyExpenses", value)}
								prefix="₹"
								tooltip={SIP_EDUCATION.monthlyExpenses}
								helper="Optional. Used only to translate the corpus into lifestyle freedom."
							/>
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>

			<p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
				<ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
				{loadedFromStorage
					? "Values were restored from local storage. They stay on this device."
					: "Everything runs in your browser. No account, no tracking, no fund pushing."}
			</p>
		</div>
	);
}

function HeroMetric({
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
		<div className="rounded-2xl border border-white/15 bg-white/7 p-4 backdrop-blur">
			<div className="flex items-center gap-2 text-sm font-medium text-white/75">
				<Icon className="size-4" />
				{label}
			</div>
			<p className="mt-2 text-xl font-semibold text-white">{value}</p>
			<p className="mt-1 text-xs text-white/65">{subtext}</p>
		</div>
	);
}

function HeroCard({ result }: { result: SipResult }) {
	const preset = SIP_GOAL_PRESETS[result.inputs.goalPreset];
	const bestLever =
		result.leverScenarios.find((scenario) => scenario.impact === "high") ??
		result.leverScenarios[0];

	return (
		<section
			className={cn(surfaceClassName, "overflow-hidden p-6 md:p-8")}
			style={{
				background:
					"linear-gradient(145deg, rgba(7,89,133,0.96) 0%, rgba(15,118,110,0.94) 42%, rgba(180,83,9,0.88) 100%)",
			}}
		>
			<div className="flex flex-wrap items-center gap-2">
				<Badge
					variant="outline"
					className={cn(
						"border-white/20 bg-white/10 text-white",
						result.isOnTrack ? "shadow-emerald-900/20" : "shadow-amber-900/20",
					)}
				>
					{result.isOnTrack ? "On track" : "Gap to close"}
				</Badge>
				<Badge className="border-transparent bg-white/12 text-white hover:bg-white/12">
					<Sparkles className="mr-1 size-3.5" />
					{preset.label}
				</Badge>
				<Badge
					variant="outline"
					className="border-white/20 bg-white/10 text-white"
				>
					Target year {result.goalCalendarYear}
				</Badge>
			</div>

			<div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
				<div>
					<p className="text-sm font-medium text-white/75">Your goal becomes</p>
					<h2 className="mt-2 text-5xl font-bold tracking-tight text-white md:text-7xl">
						{formatCurrency(result.goalAmountAtTarget)}
					</h2>
					<p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75">
						Today&apos;s {formatCurrency(result.inputs.targetAmountToday)} goal
						turns into {formatCurrency(result.goalAmountAtTarget)} by{" "}
						{result.goalCalendarYear}. At your current pace, your corpus reaches{" "}
						{formatCurrency(result.projectedCorpusAtTarget)}
						{result.targetGap >= 0
							? `, leaving a ${formatCurrency(Math.abs(result.targetGap))} buffer.`
							: `, leaving a ${formatCurrency(Math.abs(result.targetGap))} gap.`}
					</p>
				</div>

				<div className="rounded-3xl border border-white/15 bg-black/10 p-5 backdrop-blur-md">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
						Best next move
					</p>
					<p className="mt-2 text-lg font-semibold text-white">
						{bestLever?.label ?? "Keep the plan alive"}
					</p>
					<p className="mt-2 text-sm leading-relaxed text-white/75">
						{bestLever
							? bestLever.gap >= 0
								? `${bestLever.label} gets the plan on time with ${formatCurrency(Math.abs(bestLever.gap))} to spare.`
								: `${bestLever.label} narrows the miss to ${formatCurrency(Math.abs(bestLever.gap))} and improves the path to ${formatYears(bestLever.yearsToTarget)}.`
							: "Compounding still rewards consistency more than complexity."}
					</p>
				</div>
			</div>

			<div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<HeroMetric
					label="Current pace"
					value={
						result.yearsToTarget !== null
							? `~${Math.ceil(result.inputs.startYear + result.yearsToTarget)}`
							: "Not visible"
					}
					subtext={formatYears(result.yearsToTarget)}
					icon={Compass}
				/>
				<HeroMetric
					label="Required SIP"
					value={
						result.requiredMonthlySip !== null
							? `${formatCurrency(result.requiredMonthlySip)}/mo`
							: "Not visible"
					}
					subtext={`Current ${formatCurrency(result.inputs.monthlySip)}/mo`}
					icon={Target}
				/>
				<HeroMetric
					label="Real value"
					value={formatCurrency(result.realCorpusAtTarget)}
					subtext="In today's rupees"
					icon={PiggyBank}
				/>
				<HeroMetric
					label="Growth share"
					value={`${Math.round(result.growthSharePct)}%`}
					subtext={`${formatCurrency(result.gainsAtTarget)} from compounding`}
					icon={TrendingUp}
				/>
			</div>
		</section>
	);
}

function InsightsGrid({ insights }: { insights: SipInsight[] }) {
	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<SectionHeading
				kicker="Insights"
				title="What the future is really saying"
				description="These cards translate the projection into decisions, tradeoffs, and hidden costs."
			/>
			<div className="grid gap-4 md:grid-cols-2">
				{insights.map((insight) => (
					<div
						key={insight.id}
						className={cn(
							"rounded-2xl border p-5",
							getInsightToneClasses(insight.tone),
						)}
					>
						<p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
							{insight.title}
						</p>
						<p className="mt-3 text-2xl font-semibold">{insight.value}</p>
						<p className="mt-3 text-sm leading-relaxed opacity-90">
							{insight.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function ProjectionChart({
	points,
	mode,
	goalCalendarYear,
}: {
	points: SipProjectionPoint[];
	mode: "goal-gap" | "real" | "growth";
	goalCalendarYear: number;
}) {
	const chartData = points.map((point) => ({
		label: String(point.calendarYear),
		calendarYear: point.calendarYear,
		corpus: point.corpus,
		goalAmount: point.goalAmount,
		realCorpus: point.realCorpus,
		investedAmount: point.investedAmount,
		gains: point.gains,
	}));

	const configMap: Record<"goal-gap" | "real" | "growth", ChartConfig> = {
		"goal-gap": {
			corpus: {
				label: "Projected corpus",
				color: "var(--chart-2)",
			},
			goalAmount: {
				label: "Goal cost",
				color: "var(--chart-1)",
			},
		},
		real: {
			corpus: {
				label: "Nominal corpus",
				color: "var(--chart-1)",
			},
			realCorpus: {
				label: "Real corpus",
				color: "var(--chart-2)",
			},
		},
		growth: {
			investedAmount: {
				label: "Your money in",
				color: "var(--chart-3)",
			},
			gains: {
				label: "Market growth",
				color: "var(--chart-1)",
			},
		},
	};

	const chartConfig = configMap[mode];

	return (
		<ChartContainer config={chartConfig} className="h-84 w-full">
			<ComposedChart
				accessibilityLayer
				data={chartData}
				margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
			>
				<CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					minTickGap={28}
					tickMargin={10}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					width={62}
					tickMargin={10}
					tickFormatter={(value) =>
						formatCurrency(Number(value)).replace("₹", "")
					}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={(value, name) => (
								<div className="flex min-w-45 items-center justify-between gap-4">
									<span className="text-sm text-muted-foreground">
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

				{mode === "goal-gap" ? (
					<>
						<Area
							type="monotone"
							dataKey="corpus"
							stroke="var(--color-corpus)"
							fill="url(#sipGoalGradient)"
							fillOpacity={1}
							strokeWidth={2.5}
						/>
						<defs>
							<linearGradient id="sipGoalGradient" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-corpus)"
									stopOpacity={0.28}
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
							dataKey="goalAmount"
							stroke="var(--color-goalAmount)"
							strokeWidth={2.5}
							strokeDasharray="6 6"
							dot={false}
						/>
					</>
				) : null}

				{mode === "real" ? (
					<>
						<Area
							type="monotone"
							dataKey="corpus"
							stroke="var(--color-corpus)"
							fill="var(--color-corpus)"
							fillOpacity={0.14}
							strokeWidth={2.5}
						/>
						<Line
							type="monotone"
							dataKey="realCorpus"
							stroke="var(--color-realCorpus)"
							strokeWidth={2.5}
							dot={false}
						/>
					</>
				) : null}

				{mode === "growth" ? (
					<>
						<Area
							type="monotone"
							dataKey="investedAmount"
							stroke="var(--color-investedAmount)"
							fill="var(--color-investedAmount)"
							fillOpacity={0.14}
							strokeWidth={2.5}
						/>
						<Line
							type="monotone"
							dataKey="gains"
							stroke="var(--color-gains)"
							strokeWidth={2.5}
							dot={false}
						/>
					</>
				) : null}

				<ReferenceLine
					x={String(goalCalendarYear)}
					stroke="var(--color-primary)"
					strokeDasharray="4 4"
					opacity={0.55}
				/>
			</ComposedChart>
		</ChartContainer>
	);
}

function ProjectionSection({ result }: { result: SipResult }) {
	const milestoneCards = result.milestoneHits.slice(0, 5);

	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<SectionHeading
				kicker="Trajectory"
				title="See the journey, not just the finish line"
				description="Switch between gap view, real purchasing power, and the split between your contributions and market growth."
				action={
					<div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-right">
						<p className="text-sm font-semibold text-primary">
							{result.compoundingCrossoverCalendarYear
								? `Compounding takes over in ${result.compoundingCrossoverCalendarYear}`
								: "Compounding has not overtaken contributions yet"}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{result.compoundingCrossoverCalendarYear
								? "That is when gains become larger than the money you put in."
								: "The early years are still mostly driven by your own savings."}
						</p>
					</div>
				}
			/>

			<Tabs defaultValue="goal-gap" className="mt-6">
				<TabsList className="grid w-full max-w-xl grid-cols-3 rounded-xl bg-muted p-1">
					<TabsTrigger value="goal-gap" className="rounded-lg">
						Corpus vs Goal
					</TabsTrigger>
					<TabsTrigger value="real" className="rounded-lg">
						Nominal vs Real
					</TabsTrigger>
					<TabsTrigger value="growth" className="rounded-lg">
						Invested vs Growth
					</TabsTrigger>
				</TabsList>

				<TabsContent value="goal-gap" className="mt-6">
					<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
						<ProjectionChart
							points={result.projectionPoints}
							mode="goal-gap"
							goalCalendarYear={result.goalCalendarYear}
						/>
					</div>
				</TabsContent>

				<TabsContent value="real" className="mt-6">
					<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
						<ProjectionChart
							points={result.projectionPoints}
							mode="real"
							goalCalendarYear={result.goalCalendarYear}
						/>
					</div>
				</TabsContent>

				<TabsContent value="growth" className="mt-6">
					<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
						<ProjectionChart
							points={result.projectionPoints}
							mode="growth"
							goalCalendarYear={result.goalCalendarYear}
						/>
					</div>
				</TabsContent>
			</Tabs>

			<div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="grid gap-3 sm:grid-cols-3">
					{result.scenarioBands.map((band) => (
						<div key={band.label} className={cn(subSurfaceClassName, "p-4")}>
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm font-semibold capitalize text-foreground">
									{band.label}
								</p>
								<Badge
									variant="outline"
									className={cn(
										"text-[10px]",
										band.isOnTrack
											? "border-emerald-200 bg-emerald-50 text-emerald-700"
											: "border-amber-200 bg-amber-50 text-amber-700",
									)}
								>
									{band.annualReturnPct}%
								</Badge>
							</div>
							<p className="mt-3 text-xl font-semibold text-foreground">
								{formatCurrency(band.projectedCorpus)}
							</p>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{band.isOnTrack
									? `${formatCurrency(Math.abs(band.gap))} above the target at this return path.`
									: `${formatCurrency(Math.abs(band.gap))} short if returns settle near ${band.annualReturnPct}%.`}
							</p>
						</div>
					))}
				</div>

				<div className={cn(subSurfaceClassName, "p-4")}>
					<p className="text-sm font-semibold text-foreground">
						Milestone radar
					</p>
					<div className="mt-4 space-y-3">
						{milestoneCards.map((milestone) => (
							<div
								key={milestone.label}
								className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2.5"
							>
								<div>
									<p className="text-sm font-medium text-foreground">
										{milestone.label}
									</p>
									<p className="text-xs text-muted-foreground">
										{formatCurrency(milestone.value)}
									</p>
								</div>
								<p className="text-sm font-semibold text-foreground">
									{milestone.yearOffset !== null
										? `In ${formatYears(milestone.yearOffset)}`
										: "Not visible"}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function LeverSection({ result }: { result: SipResult }) {
	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<SectionHeading
				kicker="Levers"
				title="The fastest ways to close the gap"
				description="These are explicit plan changes, not wishful return assumptions."
			/>
			<div className="grid gap-4 md:grid-cols-2">
				{result.leverScenarios.map((scenario) => (
					<div key={scenario.id} className={cn(subSurfaceClassName, "p-5")}>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-base font-semibold text-foreground">
									{scenario.label}
								</p>
								<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
									{scenario.description}
								</p>
							</div>
							<Badge
								variant="outline"
								className={cn(
									"capitalize text-[10px]",
									getImpactClasses(scenario.impact),
								)}
							>
								{scenario.impact} impact
							</Badge>
						</div>

						<div className="mt-5 grid gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-border/70 bg-background/70 px-3 py-3">
								<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
									Target-year corpus
								</p>
								<p className="mt-2 text-sm font-semibold text-foreground">
									{formatCurrency(scenario.projectedCorpus)}
								</p>
							</div>
							<div className="rounded-xl border border-border/70 bg-background/70 px-3 py-3">
								<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
									Gap after change
								</p>
								<p
									className={cn(
										"mt-2 text-sm font-semibold",
										scenario.gap >= 0
											? "text-emerald-700 dark:text-emerald-300"
											: "text-amber-700 dark:text-amber-300",
									)}
								>
									{scenario.gap >= 0
										? `+${formatCurrency(Math.abs(scenario.gap))}`
										: formatCurrency(scenario.gap)}
								</p>
							</div>
						</div>

						<p className="mt-4 text-xs leading-relaxed text-muted-foreground">
							{scenario.yearsToTarget !== null
								? `With this change, the goal shows up in ${formatYears(scenario.yearsToTarget)}.`
								: "Even with this change, the goal is still outside the modeled horizon."}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

function YearByYearTable({
	points,
	open,
	onOpenChange,
}: {
	points: SipProjectionPoint[];
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
							Year-by-year breakdown
						</h2>
						<p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
							Inspect the exact annual path of corpus, gains, and the moving
							goal cost.
						</p>
					</div>
					<CollapsibleTrigger asChild>
						<Button type="button" variant="outline" size="sm">
							{open ? "Hide table" : "View details"}
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
					<div className="min-w-190 rounded-xl border border-border bg-card">
						<Table>
							<TableHeader className="bg-muted/50">
								<TableRow>
									<TableHead className="font-semibold">Year</TableHead>
									<TableHead className="font-semibold">Corpus</TableHead>
									<TableHead className="font-semibold">Invested</TableHead>
									<TableHead className="font-semibold">Gains</TableHead>
									<TableHead className="font-semibold">Real Corpus</TableHead>
									<TableHead className="font-semibold">Goal Cost</TableHead>
									<TableHead className="font-semibold">Gap</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{points.map((point) => (
									<TableRow
										key={point.calendarYear}
										className="hover:bg-muted/30"
									>
										<TableCell className="font-medium">
											{point.calendarYear}
										</TableCell>
										<TableCell>{formatCurrency(point.corpus)}</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(point.investedAmount)}
										</TableCell>
										<TableCell>{formatCurrency(point.gains)}</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(point.realCorpus)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatCurrency(point.goalAmount)}
										</TableCell>
										<TableCell
											className={cn(
												"font-medium",
												point.gap >= 0
													? "text-emerald-700 dark:text-emerald-300"
													: "text-amber-700 dark:text-amber-300",
											)}
										>
											{point.gap >= 0
												? `+${formatCurrency(point.gap)}`
												: formatCurrency(point.gap)}
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

function AssumptionsSection({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<section className={cn(surfaceClassName, "p-6 md:p-8")}>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold text-primary">How it works</p>
						<h2 className="mt-1 text-2xl font-semibold text-foreground">
							Assumptions, limits, and when to switch tools
						</h2>
						<p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
							This is a planning engine. It helps you choose the path, not the
							fund.
						</p>
					</div>
					<CollapsibleTrigger asChild>
						<Button type="button" variant="outline" size="sm">
							{open ? "Hide notes" : "Read notes"}
							<ChevronDown
								className={cn(
									"ml-2 size-4 transition-transform",
									open ? "rotate-180" : undefined,
								)}
							/>
						</Button>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent className="mt-8 grid gap-4 md:grid-cols-2">
					<InfoCard
						icon={Rocket}
						title="Monthly simulation"
						body="The tool compounds month by month, applies annual SIP step-ups, and keeps the moving goal cost in sync. That makes reverse solving and delay analysis consistent."
					/>
					<InfoCard
						icon={Sparkles}
						title="Real vs nominal"
						body="Nominal corpus shows the number on the statement. Real corpus discounts inflation so you can judge true purchasing power."
					/>
					<InfoCard
						icon={ShieldCheck}
						title="Planning-only"
						body="No live NAVs, no scheme picks, no lead-gen. The output is a decision aid, not a product recommendation."
					/>
					<div className={cn(subSurfaceClassName, "p-5")}>
						<div className="flex items-center gap-3">
							<span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Target className="size-5" />
							</span>
							<h3 className="text-base font-semibold text-foreground">
								Retirement is a different problem
							</h3>
						</div>
						<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
							If the goal is retirement income rather than a corpus milestone,
							use the{" "}
							<Link
								to="/tools/fire"
								className="font-medium text-primary underline decoration-primary/30 underline-offset-4"
							>
								FIRE calculator
							</Link>{" "}
							so expenses, inflation, and withdrawal safety are modeled
							directly.
						</p>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</section>
	);
}

function InfoCard({
	icon: Icon,
	title,
	body,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	body: string;
}) {
	return (
		<div className={cn(subSurfaceClassName, "p-5")}>
			<div className="flex items-center gap-3">
				<span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

export function SipCalculatorPage() {
	const [draft, setDraft] = useState<SipInputDraft>(() =>
		createDraft(DEFAULT_INPUTS),
	);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [tableOpen, setTableOpen] = useState(false);
	const [assumptionsOpen, setAssumptionsOpen] = useState(false);
	const [storageReady, setStorageReady] = useState(false);
	const [loadedFromStorage, setLoadedFromStorage] = useState(false);

	useEffect(() => {
		const stored = loadStoredState();
		if (stored) {
			setDraft(stored.draft);
			setAdvancedOpen(stored.advancedOpen);
			setTableOpen(stored.tableOpen);
			setAssumptionsOpen(stored.assumptionsOpen);
			setLoadedFromStorage(true);
		}

		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredState({
			draft,
			advancedOpen,
			tableOpen,
			assumptionsOpen,
		});
	}, [advancedOpen, assumptionsOpen, draft, storageReady, tableOpen]);

	const inputs = useMemo(() => buildInputsFromDraft(draft), [draft]);
	const result = useMemo(() => calculateSipPlan(inputs), [inputs]);

	const setField = (
		key: keyof Omit<SipInputDraft, "goalPreset">,
		value: string,
	) => {
		setDraft((current) => ({
			...current,
			[key]: value,
		}));
	};

	const setGoalPreset = (goalPreset: SipGoalPreset) => {
		setDraft((current) => ({
			...current,
			goalPreset,
			goalInflationPct: String(
				SIP_GOAL_PRESETS[goalPreset].defaultGoalInflationPct,
			),
		}));
	};

	return (
		<ToolPageShell
			title="SIP Future Planner"
			description="This is not a generic SIP maturity widget. It shows what your goal will really cost, whether your current SIP gets there, and which levers buy you the most future."
			rootStyle={{
				backgroundImage:
					"radial-gradient(circle at 0% 0%, rgba(13,148,136,0.09), transparent 32%), radial-gradient(circle at 100% 10%, rgba(217,119,6,0.10), transparent 28%), linear-gradient(180deg, rgba(248,250,252,0.96), rgba(248,250,252,1))",
			}}
			className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
			backLinkClassName="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			descriptionClassName="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground"
		>
			<div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
				<InputPanel
					draft={draft}
					onFieldChange={setField}
					onGoalPresetChange={setGoalPreset}
					advancedOpen={advancedOpen}
					onAdvancedOpenChange={setAdvancedOpen}
					onReset={() => {
						setDraft(createDraft(DEFAULT_INPUTS));
						setAdvancedOpen(false);
						setTableOpen(false);
						setAssumptionsOpen(false);
						setLoadedFromStorage(false);
					}}
					loadedFromStorage={loadedFromStorage}
				/>

				<div className="min-w-0 space-y-6">
					<HeroCard result={result} />
					<InsightsGrid insights={result.insights} />
					<ProjectionSection result={result} />
					<LeverSection result={result} />
					<YearByYearTable
						points={result.projectionPoints}
						open={tableOpen}
						onOpenChange={setTableOpen}
					/>
					<AssumptionsSection
						open={assumptionsOpen}
						onOpenChange={setAssumptionsOpen}
					/>
				</div>
			</div>
		</ToolPageShell>
	);
}
