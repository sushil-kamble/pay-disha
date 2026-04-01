import {
	ArrowLeft,
	Copy,
	Download,
	Info,
	LineChart as LineChartIcon,
	Plus,
	Sparkles,
	Target,
	X,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
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
import { Switch } from "#/components/ui/switch";
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
	calculateAdvancedProjection,
	calculateSimpleProjection,
	formatLpa,
	formatShortCurrency,
	lpaToRupees,
} from "#/tools/salary-growth/calculator";
import {
	ADVANCED_PLACEHOLDERS,
	CHART_SERIES,
	DEFAULT_ADVANCED_INPUTS,
	DEFAULT_ADVANCED_OVERRIDES,
	DEFAULT_SIMPLE_INPUTS,
	SALARY_GROWTH_FINANCIAL_CONTEXT,
	SALARY_GROWTH_STORAGE_KEYS,
	SALARY_MILESTONES,
	SIMPLE_PLACEHOLDERS,
} from "#/tools/salary-growth/constants";
import type {
	AdvancedProjectionResult,
	FutureSalaryOverride,
	ProjectionPoint,
	SalaryGrowthMode,
	SalaryHistoryEntry,
	SimpleProjectionResult,
} from "#/tools/salary-growth/types";

type EditableSalaryRow = {
	id: string;
	year: string;
	salaryLpa: string;
};

type PersistedEditableSalaryRow = {
	year: string;
	salaryLpa: string;
};

type PersistedSimpleState = {
	simpleSalary: string;
	simpleBump: string;
	simpleYears: string;
	simpleInflationRate: string;
	simpleInflation: boolean;
};

type PersistedAdvancedState = {
	historyRows: PersistedEditableSalaryRow[];
	overrideRows: PersistedEditableSalaryRow[];
	annualIncrement: string;
	switchEveryYears: string;
	switchHike: string;
	advancedYears: string;
	advancedInflationRate: string;
	advancedInflation: boolean;
	assumptionsOpen: boolean;
	overridesOpen: boolean;
};

let rowId = 0;

function createRowId(prefix: string) {
	rowId += 1;
	return `${prefix}-${rowId}`;
}

function toEditableRows(
	entries: Array<SalaryHistoryEntry | FutureSalaryOverride>,
	prefix: string,
) {
	return entries.map((entry) => ({
		id: createRowId(prefix),
		year: String(entry.year),
		salaryLpa: String(entry.salaryLpa),
	}));
}

function toPersistedRows(
	rows: EditableSalaryRow[],
): PersistedEditableSalaryRow[] {
	return rows.map((row) => ({
		year: row.year,
		salaryLpa: row.salaryLpa,
	}));
}

function isPersistedRowArray(
	value: unknown,
): value is PersistedEditableSalaryRow[] {
	return Array.isArray(value) && value.every(isPersistedRow);
}

function isPersistedRow(value: unknown): value is PersistedEditableSalaryRow {
	if (!value || typeof value !== "object") return false;

	const row = value as Record<string, unknown>;
	return typeof row.year === "string" && typeof row.salaryLpa === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function restoreEditableRows(
	rows: PersistedEditableSalaryRow[],
	prefix: string,
): EditableSalaryRow[] {
	return rows.map((row) => ({
		id: createRowId(prefix),
		year: row.year,
		salaryLpa: row.salaryLpa,
	}));
}

function parseStoredJson(rawValue: string | null) {
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
}

function loadStoredSimpleState(): PersistedSimpleState | null {
	const parsed = parseStoredJson(
		window.localStorage.getItem(SALARY_GROWTH_STORAGE_KEYS.simple),
	);

	if (!isRecord(parsed)) return null;
	if (
		typeof parsed.simpleSalary !== "string" ||
		typeof parsed.simpleBump !== "string" ||
		typeof parsed.simpleYears !== "string" ||
		typeof parsed.simpleInflationRate !== "string" ||
		typeof parsed.simpleInflation !== "boolean"
	) {
		return null;
	}

	return parsed as PersistedSimpleState;
}

function loadStoredAdvancedState(): PersistedAdvancedState | null {
	const parsed = parseStoredJson(
		window.localStorage.getItem(SALARY_GROWTH_STORAGE_KEYS.advanced),
	);

	if (!isRecord(parsed)) return null;
	if (
		!isPersistedRowArray(parsed.historyRows) ||
		!isPersistedRowArray(parsed.overrideRows) ||
		typeof parsed.annualIncrement !== "string" ||
		typeof parsed.switchEveryYears !== "string" ||
		typeof parsed.switchHike !== "string" ||
		typeof parsed.advancedYears !== "string" ||
		typeof parsed.advancedInflationRate !== "string" ||
		typeof parsed.advancedInflation !== "boolean" ||
		typeof parsed.assumptionsOpen !== "boolean" ||
		typeof parsed.overridesOpen !== "boolean"
	) {
		return null;
	}

	return parsed as PersistedAdvancedState;
}

function saveStoredJson(storageKey: string, value: unknown) {
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(value));
	} catch {
		// Ignore storage write failures such as private browsing quotas.
	}
}

function parseNumber(value: string) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseYear(value: string) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : null;
}

function mapRowsToHistory(rows: EditableSalaryRow[]): SalaryHistoryEntry[] {
	return rows.map((row) => ({
		year: parseYear(row.year) ?? Number.NaN,
		salaryLpa: parseNumber(row.salaryLpa) ?? Number.NaN,
	}));
}

function buildCsv(points: ProjectionPoint[]) {
	const headers = [
		"Year",
		"Nominal Salary (LPA)",
		"Real Salary (LPA)",
		"Actual Salary (LPA)",
		"Projected Salary (LPA)",
		"Stay Salary (LPA)",
		"Event Type",
		"Growth %",
		"Annualized Growth %",
		"Milestone",
	];

	const rows = points.map((point) =>
		[
			point.year,
			point.nominalSalaryLpa,
			point.realSalaryLpa ?? "",
			point.actualSalaryLpa ?? "",
			point.projectedSalaryLpa ?? "",
			point.staySalaryLpa ?? "",
			point.eventType,
			point.growthPct ?? "",
			point.annualizedGrowthPct ?? "",
			point.milestoneLabel ?? "",
		].join(","),
	);

	return [headers.join(","), ...rows].join("\n");
}

function buildSimpleReportText(result: SimpleProjectionResult) {
	return [
		"Salary Growth Calculator — Simple projection",
		`Current salary: ${formatLpa(result.inputs.currentSalaryLpa)}`,
		`Yearly increment: ${result.inputs.yearlyIncrementPct}%`,
		`Projection horizon: ${result.inputs.projectionYears} years`,
		`Projected salary: ${formatLpa(result.projectedSalaryLpa)}`,
		result.projectedRealSalaryLpa !== null
			? `Inflation-adjusted salary: ${formatLpa(result.projectedRealSalaryLpa)}`
			: null,
		...result.insights.map(
			(insight) => `${insight.title}: ${insight.value}. ${insight.description}`,
		),
	]
		.filter(Boolean)
		.join("\n");
}

function buildAdvancedReportText(result: AdvancedProjectionResult) {
	if (!result.report)
		return "Add valid history rows to generate your advanced salary report.";

	return [
		"Salary Growth Calculator — Advanced projection",
		result.report.narrative,
		`Latest salary: ${formatLpa(result.report.latestSalaryLpa)}`,
		`Projected end salary: ${formatLpa(result.report.projectedEndSalaryLpa)}`,
		result.report.projectedEndRealSalaryLpa !== null
			? `Inflation-adjusted projection: ${formatLpa(result.report.projectedEndRealSalaryLpa)}`
			: null,
		result.report.cagrPct !== null
			? `Historical CAGR: ${result.report.cagrPct.toFixed(1)}%`
			: null,
		result.report.nextMilestoneYear && result.report.nextMilestoneLabel
			? `Next milestone: ${result.report.nextMilestoneLabel} in ${result.report.nextMilestoneYear}`
			: null,
		result.report.switchVsStayDeltaLpa !== null
			? `Switch vs stay delta: ${formatLpa(result.report.switchVsStayDeltaLpa)}`
			: null,
	]
		.filter(Boolean)
		.join("\n");
}

async function copyTextToClipboard(text: string) {
	if (!navigator.clipboard?.writeText) {
		throw new Error("Clipboard is not available in this browser.");
	}
	await navigator.clipboard.writeText(text);
}

function downloadTextFile(filename: string, content: string) {
	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const url = window.URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	window.URL.revokeObjectURL(url);
}

function getInsightCardClasses(tone: "positive" | "neutral" | "caution") {
	if (tone === "positive") {
		return {
			card: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.82),rgba(240,253,250,0.96))] text-emerald-950 shadow-[0_20px_50px_-42px_rgba(16,185,129,0.45)] dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-50",
			title: "text-emerald-900/70 dark:text-emerald-100/72",
			value: "text-emerald-950 dark:text-emerald-50",
			copy: "text-emerald-900/82 dark:text-emerald-100/84",
		};
	}

	if (tone === "caution") {
		return {
			card: "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.92),rgba(255,247,237,0.98))] text-amber-950 shadow-[0_20px_50px_-42px_rgba(245,158,11,0.45)] dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-50",
			title: "text-amber-950/70 dark:text-amber-100/72",
			value: "text-amber-950 dark:text-amber-50",
			copy: "text-amber-950/82 dark:text-amber-100/84",
		};
	}

	return {
		card: "border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] text-foreground shadow-[0_20px_45px_-44px_rgba(15,23,42,0.45)] dark:bg-muted/35",
		title: "text-foreground/62",
		value: "text-foreground",
		copy: "text-foreground/78",
	};
}

function getEventBadgeClasses(eventType: ProjectionPoint["eventType"]) {
	if (eventType === "switch") return "bg-emerald-500/10 text-emerald-700";
	if (eventType === "override") return "bg-cyan-500/10 text-cyan-700";
	if (eventType === "history") return "bg-primary/10 text-primary";
	return "bg-muted text-muted-foreground";
}

function formatGrowthPct(value: number | null) {
	if (value === null) return "—";
	return `${value.toFixed(1)}%`;
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

export function SalaryGrowthPage() {
	const [mode, setMode] = useState<SalaryGrowthMode>("simple");
	const [simpleSalary, setSimpleSalary] = useState(
		String(DEFAULT_SIMPLE_INPUTS.currentSalaryLpa),
	);
	const [simpleBump, setSimpleBump] = useState(
		String(DEFAULT_SIMPLE_INPUTS.yearlyIncrementPct),
	);
	const [simpleYears, setSimpleYears] = useState(
		String(DEFAULT_SIMPLE_INPUTS.projectionYears),
	);
	const [simpleInflationRate, setSimpleInflationRate] = useState(
		String(DEFAULT_SIMPLE_INPUTS.inflationRatePct),
	);
	const [simpleInflation, setSimpleInflation] = useState(
		DEFAULT_SIMPLE_INPUTS.inflationAdjusted,
	);

	const [historyRows, setHistoryRows] = useState<EditableSalaryRow[]>(
		toEditableRows(DEFAULT_ADVANCED_INPUTS.history, "history"),
	);
	const [overrideRows, setOverrideRows] = useState<EditableSalaryRow[]>(
		toEditableRows(DEFAULT_ADVANCED_OVERRIDES, "override"),
	);
	const [annualIncrement, setAnnualIncrement] = useState(
		String(DEFAULT_ADVANCED_INPUTS.annualIncrementPct),
	);
	const [switchEveryYears, setSwitchEveryYears] = useState(
		String(DEFAULT_ADVANCED_INPUTS.switchEveryYears),
	);
	const [switchHike, setSwitchHike] = useState(
		String(DEFAULT_ADVANCED_INPUTS.switchHikePct),
	);
	const [advancedYears, setAdvancedYears] = useState(
		String(DEFAULT_ADVANCED_INPUTS.projectionYears),
	);
	const [advancedInflationRate, setAdvancedInflationRate] = useState(
		String(DEFAULT_ADVANCED_INPUTS.inflationRatePct),
	);
	const [advancedInflation, setAdvancedInflation] = useState(
		DEFAULT_ADVANCED_INPUTS.inflationAdjusted,
	);
	const [assumptionsOpen, setAssumptionsOpen] = useState(true);
	const [overridesOpen, setOverridesOpen] = useState(false);
	const [actionMessage, setActionMessage] = useState<{
		tone: "positive" | "neutral" | "caution";
		text: string;
	} | null>(null);
	const [storageReady, setStorageReady] = useState(false);
	const [simpleLoadedFromStorage, setSimpleLoadedFromStorage] = useState(false);
	const [advancedLoadedFromStorage, setAdvancedLoadedFromStorage] =
		useState(false);

	useEffect(() => {
		const storedMode = window.localStorage.getItem(
			SALARY_GROWTH_STORAGE_KEYS.mode,
		);
		if (storedMode === "simple" || storedMode === "advanced") {
			setMode(storedMode);
		}

		const storedSimple = loadStoredSimpleState();
		if (storedSimple) {
			setSimpleSalary(storedSimple.simpleSalary);
			setSimpleBump(storedSimple.simpleBump);
			setSimpleYears(storedSimple.simpleYears);
			setSimpleInflationRate(storedSimple.simpleInflationRate);
			setSimpleInflation(storedSimple.simpleInflation);
			setSimpleLoadedFromStorage(true);
		}

		const storedAdvanced = loadStoredAdvancedState();
		if (storedAdvanced) {
			setHistoryRows(
				restoreEditableRows(storedAdvanced.historyRows, "history"),
			);
			setOverrideRows(
				restoreEditableRows(storedAdvanced.overrideRows, "override"),
			);
			setAnnualIncrement(storedAdvanced.annualIncrement);
			setSwitchEveryYears(storedAdvanced.switchEveryYears);
			setSwitchHike(storedAdvanced.switchHike);
			setAdvancedYears(storedAdvanced.advancedYears);
			setAdvancedInflationRate(storedAdvanced.advancedInflationRate);
			setAdvancedInflation(storedAdvanced.advancedInflation);
			setAssumptionsOpen(storedAdvanced.assumptionsOpen);
			setOverridesOpen(storedAdvanced.overridesOpen);
			setAdvancedLoadedFromStorage(true);
		}

		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;
		saveStoredJson(SALARY_GROWTH_STORAGE_KEYS.mode, mode);
	}, [mode, storageReady]);

	useEffect(() => {
		if (!storageReady) return;
		saveStoredJson(SALARY_GROWTH_STORAGE_KEYS.simple, {
			simpleSalary,
			simpleBump,
			simpleYears,
			simpleInflationRate,
			simpleInflation,
		} satisfies PersistedSimpleState);
	}, [
		simpleSalary,
		simpleBump,
		simpleYears,
		simpleInflationRate,
		simpleInflation,
		storageReady,
	]);

	useEffect(() => {
		if (!storageReady) return;
		saveStoredJson(SALARY_GROWTH_STORAGE_KEYS.advanced, {
			historyRows: toPersistedRows(historyRows),
			overrideRows: toPersistedRows(overrideRows),
			annualIncrement,
			switchEveryYears,
			switchHike,
			advancedYears,
			advancedInflationRate,
			advancedInflation,
			assumptionsOpen,
			overridesOpen,
		} satisfies PersistedAdvancedState);
	}, [
		historyRows,
		overrideRows,
		annualIncrement,
		switchEveryYears,
		switchHike,
		advancedYears,
		advancedInflationRate,
		advancedInflation,
		assumptionsOpen,
		overridesOpen,
		storageReady,
	]);

	const simpleResult = calculateSimpleProjection({
		currentSalaryLpa:
			parseNumber(simpleSalary) ?? DEFAULT_SIMPLE_INPUTS.currentSalaryLpa,
		yearlyIncrementPct:
			parseNumber(simpleBump) ?? DEFAULT_SIMPLE_INPUTS.yearlyIncrementPct,
		projectionYears:
			parseNumber(simpleYears) ?? DEFAULT_SIMPLE_INPUTS.projectionYears,
		inflationAdjusted: simpleInflation,
		inflationRatePct:
			parseNumber(simpleInflationRate) ??
			DEFAULT_SIMPLE_INPUTS.inflationRatePct,
		baseYear: DEFAULT_SIMPLE_INPUTS.baseYear,
	});

	const advancedResult = calculateAdvancedProjection({
		history: mapRowsToHistory(historyRows),
		annualIncrementPct:
			parseNumber(annualIncrement) ??
			DEFAULT_ADVANCED_INPUTS.annualIncrementPct,
		switchEveryYears:
			parseNumber(switchEveryYears) ?? DEFAULT_ADVANCED_INPUTS.switchEveryYears,
		switchHikePct:
			parseNumber(switchHike) ?? DEFAULT_ADVANCED_INPUTS.switchHikePct,
		projectionYears:
			parseNumber(advancedYears) ?? DEFAULT_ADVANCED_INPUTS.projectionYears,
		inflationAdjusted: advancedInflation,
		inflationRatePct:
			parseNumber(advancedInflationRate) ??
			DEFAULT_ADVANCED_INPUTS.inflationRatePct,
		overrides: mapRowsToHistory(overrideRows),
	});

	const activePoints =
		mode === "simple" ? simpleResult.points : advancedResult.points;

	async function handleCopyReport() {
		try {
			const text =
				mode === "simple"
					? buildSimpleReportText(simpleResult)
					: buildAdvancedReportText(advancedResult);
			await copyTextToClipboard(text);
			setActionMessage({
				tone: "positive",
				text: "Report copied to your clipboard.",
			});
		} catch (error) {
			setActionMessage({
				tone: "caution",
				text:
					error instanceof Error
						? error.message
						: "Unable to copy the report right now.",
			});
		}
	}

	function handleDownloadCsv() {
		downloadTextFile(
			mode === "simple"
				? "salary-growth-simple.csv"
				: "salary-growth-advanced.csv",
			buildCsv(activePoints),
		);
		setActionMessage({
			tone: "positive",
			text: "CSV download started.",
		});
	}

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<SiteNav />
			<main className="page-wrap pb-20 pt-8">
				<div className="rise-in mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div>
						<a
							href="/"
							className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							<ArrowLeft className="size-3.5" />
							Back to Tools
						</a>
						<h1 className="display-title text-4xl font-bold leading-tight md:text-5xl">
							Salary Growth Calculator
						</h1>
						<p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">
							Model how your salary grows over time, compare switches vs staying
							put, and see the inflation-adjusted reality behind the headline
							number.
						</p>
					</div>
					<Badge
						variant="secondary"
						className="rounded-full px-3 py-1 text-xs font-semibold"
					>
						{SALARY_GROWTH_FINANCIAL_CONTEXT}
					</Badge>
				</div>

				<Tabs
					value={mode}
					onValueChange={(value) => setMode(value as SalaryGrowthMode)}
					className="space-y-6"
				>
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<TabsList className="h-auto rounded-2xl bg-muted/70 p-1.5">
							<TabsTrigger
								value="simple"
								className="rounded-xl px-4 py-2 data-[state=active]:bg-background"
							>
								Simple mode
							</TabsTrigger>
							<TabsTrigger
								value="advanced"
								className="rounded-xl px-4 py-2 data-[state=active]:bg-background"
							>
								Advanced mode
							</TabsTrigger>
						</TabsList>

						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<Badge variant="outline" className="rounded-full">
								<LineChartIcon className="mr-1 size-3" />
								Interactive projection
							</Badge>
							<Badge variant="outline" className="rounded-full">
								<Sparkles className="mr-1 size-3" />
								Inflation-aware
							</Badge>
						</div>
					</div>

					<TabsContent value="simple" className="mt-0">
						<div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
							<div className="lg:sticky lg:top-21">
								<SimpleInputPanel
									simpleSalary={simpleSalary}
									setSimpleSalary={setSimpleSalary}
									simpleBump={simpleBump}
									setSimpleBump={setSimpleBump}
									simpleYears={simpleYears}
									setSimpleYears={setSimpleYears}
									simpleInflation={simpleInflation}
									setSimpleInflation={setSimpleInflation}
									simpleInflationRate={simpleInflationRate}
									setSimpleInflationRate={setSimpleInflationRate}
									loadedFromStorage={simpleLoadedFromStorage}
								/>
							</div>
							<SimpleResultsPanel
								result={simpleResult}
								onCopyReport={handleCopyReport}
								onDownloadCsv={handleDownloadCsv}
								actionMessage={actionMessage}
							/>
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="mt-0">
						<div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start">
							<div className="lg:sticky lg:top-21">
								<AdvancedInputPanel
									historyRows={historyRows}
									setHistoryRows={setHistoryRows}
									overrideRows={overrideRows}
									setOverrideRows={setOverrideRows}
									annualIncrement={annualIncrement}
									setAnnualIncrement={setAnnualIncrement}
									switchEveryYears={switchEveryYears}
									setSwitchEveryYears={setSwitchEveryYears}
									switchHike={switchHike}
									setSwitchHike={setSwitchHike}
									advancedYears={advancedYears}
									setAdvancedYears={setAdvancedYears}
									advancedInflation={advancedInflation}
									setAdvancedInflation={setAdvancedInflation}
									advancedInflationRate={advancedInflationRate}
									setAdvancedInflationRate={setAdvancedInflationRate}
									assumptionsOpen={assumptionsOpen}
									setAssumptionsOpen={setAssumptionsOpen}
									overridesOpen={overridesOpen}
									setOverridesOpen={setOverridesOpen}
									validationErrors={advancedResult.validationErrors}
									loadedFromStorage={advancedLoadedFromStorage}
								/>
							</div>
							<AdvancedResultsPanel
								result={advancedResult}
								onCopyReport={handleCopyReport}
								onDownloadCsv={handleDownloadCsv}
								actionMessage={actionMessage}
							/>
						</div>
					</TabsContent>
				</Tabs>
			</main>
			<SiteFooter />
		</div>
	);
}

function SimpleInputPanel({
	simpleSalary,
	setSimpleSalary,
	simpleBump,
	setSimpleBump,
	simpleYears,
	setSimpleYears,
	simpleInflation,
	setSimpleInflation,
	simpleInflationRate,
	setSimpleInflationRate,
	loadedFromStorage,
}: {
	simpleSalary: string;
	setSimpleSalary: (value: string) => void;
	simpleBump: string;
	setSimpleBump: (value: string) => void;
	simpleYears: string;
	setSimpleYears: (value: string) => void;
	simpleInflation: boolean;
	setSimpleInflation: (value: boolean) => void;
	simpleInflationRate: string;
	setSimpleInflationRate: (value: string) => void;
	loadedFromStorage: boolean;
}) {
	return (
		<div className="island-shell rounded-2xl p-6">
			<p className="island-kicker mb-5">Simple setup</p>

			<div className="space-y-5">
				<Field
					id="simple-salary"
					label="Current salary"
					suffix="LPA"
					value={simpleSalary}
					onChange={setSimpleSalary}
					placeholder={SIMPLE_PLACEHOLDERS.currentSalaryLpa}
				/>
				<Field
					id="simple-bump"
					label="Yearly increment"
					suffix="%"
					value={simpleBump}
					onChange={setSimpleBump}
					placeholder={SIMPLE_PLACEHOLDERS.yearlyIncrementPct}
				/>
				<Field
					id="simple-years"
					label="Projection horizon"
					suffix="years"
					value={simpleYears}
					onChange={setSimpleYears}
					placeholder={SIMPLE_PLACEHOLDERS.projectionYears}
				/>

				<Separator />

				<div className="rounded-2xl border border-border bg-background/70 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="flex items-center gap-1.5">
								<p className="text-sm font-semibold text-foreground">
									Adjust for inflation
								</p>
								<TooltipInfo text="Shows the future salary in today's rupees so you can see the real purchasing power." />
							</div>
							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								Turn this on when you care about real buying power, not just the
								headline salary.
							</p>
						</div>
						<Switch
							checked={simpleInflation}
							onCheckedChange={setSimpleInflation}
							aria-label="Adjust for inflation"
						/>
					</div>

					<div className="mt-4">
						<Field
							id="simple-inflation"
							label="Inflation rate"
							suffix="%"
							value={simpleInflationRate}
							onChange={setSimpleInflationRate}
							placeholder={SIMPLE_PLACEHOLDERS.inflationRatePct}
							disabled={!simpleInflation}
						/>
					</div>
				</div>
			</div>

			<BrowserStorageDisclaimer loadedFromStorage={loadedFromStorage} />
		</div>
	);
}

function AdvancedInputPanel({
	historyRows,
	setHistoryRows,
	overrideRows,
	setOverrideRows,
	annualIncrement,
	setAnnualIncrement,
	switchEveryYears,
	setSwitchEveryYears,
	switchHike,
	setSwitchHike,
	advancedYears,
	setAdvancedYears,
	advancedInflation,
	setAdvancedInflation,
	advancedInflationRate,
	setAdvancedInflationRate,
	assumptionsOpen,
	setAssumptionsOpen,
	overridesOpen,
	setOverridesOpen,
	validationErrors,
	loadedFromStorage,
}: {
	historyRows: EditableSalaryRow[];
	setHistoryRows: Dispatch<SetStateAction<EditableSalaryRow[]>>;
	overrideRows: EditableSalaryRow[];
	setOverrideRows: Dispatch<SetStateAction<EditableSalaryRow[]>>;
	annualIncrement: string;
	setAnnualIncrement: (value: string) => void;
	switchEveryYears: string;
	setSwitchEveryYears: (value: string) => void;
	switchHike: string;
	setSwitchHike: (value: string) => void;
	advancedYears: string;
	setAdvancedYears: (value: string) => void;
	advancedInflation: boolean;
	setAdvancedInflation: (value: boolean) => void;
	advancedInflationRate: string;
	setAdvancedInflationRate: (value: string) => void;
	assumptionsOpen: boolean;
	setAssumptionsOpen: (value: boolean) => void;
	overridesOpen: boolean;
	setOverridesOpen: (value: boolean) => void;
	validationErrors: string[];
	loadedFromStorage: boolean;
}) {
	function updateRows(
		setRows: Dispatch<SetStateAction<EditableSalaryRow[]>>,
		id: string,
		field: "year" | "salaryLpa",
		value: string,
	) {
		setRows((current) =>
			current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
		);
	}

	function removeRow(
		setRows: Dispatch<SetStateAction<EditableSalaryRow[]>>,
		id: string,
	) {
		setRows((current) => current.filter((row) => row.id !== id));
	}

	function addHistoryRow() {
		const lastRow = historyRows.at(-1);
		const nextYear = (parseYear(lastRow?.year ?? "") ?? 2026) + 1;
		setHistoryRows((current) => [
			...current,
			{
				id: createRowId("history"),
				year: String(nextYear),
				salaryLpa: lastRow?.salaryLpa ?? ADVANCED_PLACEHOLDERS.salaryLpa,
			},
		]);
	}

	function addOverrideRow() {
		const historyYears = historyRows
			.map((row) => parseYear(row.year))
			.filter((value): value is number => value !== null);
		const overrideYears = overrideRows
			.map((row) => parseYear(row.year))
			.filter((value): value is number => value !== null);
		const latestYear = Math.max(...historyYears, ...overrideYears, 2026);

		setOverrideRows((current) => [
			...current,
			{
				id: createRowId("override"),
				year: String(latestYear + 1),
				salaryLpa: ADVANCED_PLACEHOLDERS.overrideSalaryLpa,
			},
		]);
	}

	return (
		<div className="island-shell rounded-2xl p-6">
			<p className="island-kicker mb-2">Advanced setup</p>
			<p className="mb-5 text-sm leading-relaxed text-muted-foreground">
				Start with the sample timeline, then replace it with your own history.
				Non-sequential years are fine.
			</p>

			{validationErrors.length > 0 && (
				<div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
					<p className="font-semibold">
						Fix these inputs to unlock the forecast:
					</p>
					<ul className="mt-2 list-disc pl-5">
						{validationErrors.map((error) => (
							<li key={error}>{error}</li>
						))}
					</ul>
				</div>
			)}

			<div className="space-y-6">
				<div>
					<div className="mb-3 flex items-center justify-between">
						<div>
							<h2 className="text-sm font-semibold text-foreground">
								Salary history
							</h2>
							<p className="text-xs text-muted-foreground">
								Replace the demo values with your own timeline.
							</p>
						</div>
						<Button type="button" size="sm" onClick={addHistoryRow}>
							<Plus className="size-4" />
							Add row
						</Button>
					</div>
					<div className="space-y-3">
						{historyRows.map((row, index) => (
							<div
								key={row.id}
								className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-2xl border border-border bg-background/70 p-3"
							>
								<Field
									id={`${row.id}-year`}
									label={index === 0 ? "Year" : " "}
									ariaLabel={`Salary history year ${index + 1}`}
									value={row.year}
									onChange={(value) =>
										updateRows(setHistoryRows, row.id, "year", value)
									}
									placeholder={ADVANCED_PLACEHOLDERS.year}
								/>
								<Field
									id={`${row.id}-salary`}
									label={index === 0 ? "Salary" : " "}
									ariaLabel={`Salary history salary ${index + 1}`}
									value={row.salaryLpa}
									onChange={(value) =>
										updateRows(setHistoryRows, row.id, "salaryLpa", value)
									}
									placeholder={ADVANCED_PLACEHOLDERS.salaryLpa}
									suffix="LPA"
								/>
								<div className="flex items-end">
									<Button
										type="button"
										size="icon-sm"
										variant="ghost"
										onClick={() => removeRow(setHistoryRows, row.id)}
										aria-label="Remove salary history row"
									>
										<X className="size-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>

				<Collapsible open={assumptionsOpen} onOpenChange={setAssumptionsOpen}>
					<div className="rounded-2xl border border-border bg-background/70 p-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<div className="flex items-center gap-1.5">
									<h2 className="text-sm font-semibold text-foreground">
										Forecast assumptions
									</h2>
									<TooltipInfo text="These assumptions drive the future path after your latest entered salary year." />
								</div>
								<p className="text-xs text-muted-foreground">
									Keep this section tight. You only need a few assumptions.
								</p>
							</div>
							<CollapsibleTrigger asChild>
								<Button type="button" variant="outline" size="sm">
									{assumptionsOpen ? "Hide" : "Show"}
								</Button>
							</CollapsibleTrigger>
						</div>

						<CollapsibleContent className="mt-4 space-y-4">
							<Field
								id="annual-increment"
								label="Same-company yearly increment"
								suffix="%"
								value={annualIncrement}
								onChange={setAnnualIncrement}
								placeholder={ADVANCED_PLACEHOLDERS.annualIncrementPct}
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									id="switch-every-years"
									label="Switch every"
									suffix="years"
									value={switchEveryYears}
									onChange={setSwitchEveryYears}
									placeholder={ADVANCED_PLACEHOLDERS.switchEveryYears}
								/>
								<Field
									id="switch-hike"
									label="Expected switch hike"
									suffix="%"
									value={switchHike}
									onChange={setSwitchHike}
									placeholder={ADVANCED_PLACEHOLDERS.switchHikePct}
								/>
							</div>
							<Field
								id="advanced-years"
								label="Forecast horizon after latest year"
								suffix="years"
								value={advancedYears}
								onChange={setAdvancedYears}
								placeholder={ADVANCED_PLACEHOLDERS.projectionYears}
							/>

							<div className="rounded-2xl border border-border bg-muted/40 p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-foreground">
											Adjust advanced forecast for inflation
										</p>
										<p className="text-xs text-muted-foreground">
											Show both past and future salaries in latest-year
											purchasing power.
										</p>
									</div>
									<Switch
										checked={advancedInflation}
										onCheckedChange={setAdvancedInflation}
										aria-label="Adjust advanced forecast for inflation"
									/>
								</div>
								<div className="mt-4">
									<Field
										id="advanced-inflation"
										label="Inflation rate"
										suffix="%"
										value={advancedInflationRate}
										onChange={setAdvancedInflationRate}
										placeholder={ADVANCED_PLACEHOLDERS.inflationRatePct}
										disabled={!advancedInflation}
									/>
								</div>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				<Collapsible open={overridesOpen} onOpenChange={setOverridesOpen}>
					<div className="rounded-2xl border border-border bg-background/70 p-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h2 className="text-sm font-semibold text-foreground">
									Future override years
								</h2>
								<p className="text-xs text-muted-foreground">
									Use this if you already know a future salary target.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={addOverrideRow}
								>
									<Plus className="size-4" />
									Add override
								</Button>
								<CollapsibleTrigger asChild>
									<Button type="button" variant="outline" size="sm">
										{overridesOpen ? "Hide" : "Show"}
									</Button>
								</CollapsibleTrigger>
							</div>
						</div>

						<CollapsibleContent className="mt-4 space-y-3">
							{overrideRows.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
									No overrides yet. Add one only if you want to pin an exact
									future year and salary.
								</div>
							) : (
								overrideRows.map((row, index) => (
									<div
										key={row.id}
										className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-2xl border border-border bg-muted/35 p-3"
									>
										<Field
											id={`${row.id}-year`}
											label={index === 0 ? "Year" : " "}
											ariaLabel={`Future override year ${index + 1}`}
											value={row.year}
											onChange={(value) =>
												updateRows(setOverrideRows, row.id, "year", value)
											}
											placeholder={ADVANCED_PLACEHOLDERS.overrideYear}
										/>
										<Field
											id={`${row.id}-salary`}
											label={index === 0 ? "Salary" : " "}
											ariaLabel={`Future override salary ${index + 1}`}
											value={row.salaryLpa}
											onChange={(value) =>
												updateRows(setOverrideRows, row.id, "salaryLpa", value)
											}
											placeholder={ADVANCED_PLACEHOLDERS.overrideSalaryLpa}
											suffix="LPA"
										/>
										<div className="flex items-end">
											<Button
												type="button"
												size="icon-sm"
												variant="ghost"
												onClick={() => removeRow(setOverrideRows, row.id)}
												aria-label="Remove future override row"
											>
												<X className="size-4" />
											</Button>
										</div>
									</div>
								))
							)}
						</CollapsibleContent>
					</div>
				</Collapsible>
			</div>

			<BrowserStorageDisclaimer loadedFromStorage={loadedFromStorage} />
		</div>
	);
}

function BrowserStorageDisclaimer({
	loadedFromStorage,
}: {
	loadedFromStorage: boolean;
}) {
	return (
		<p className="mt-5 text-xs leading-relaxed text-muted-foreground">
			{loadedFromStorage
				? "These values were loaded from local storage in this browser. They stay only on this browser and are not stored on our servers."
				: "Your latest inputs are saved only in local storage in this browser, so they are not stored on our servers."}
		</p>
	);
}

function SimpleResultsPanel({
	result,
	onCopyReport,
	onDownloadCsv,
	actionMessage,
}: {
	result: SimpleProjectionResult;
	onCopyReport: () => void;
	onDownloadCsv: () => void;
	actionMessage: {
		tone: "positive" | "neutral" | "caution";
		text: string;
	} | null;
}) {
	return (
		<div className="space-y-5">
			<SummaryCards
				cards={[
					{
						label: "Projected salary",
						value: formatLpa(result.projectedSalaryLpa),
						subtext: `${formatShortCurrency(lpaToRupees(result.projectedSalaryLpa))} a year`,
						emphasis: true,
					},
					{
						label: "Total nominal gain",
						value: formatLpa(result.totalGainLpa),
						subtext: `From ${formatLpa(result.inputs.currentSalaryLpa)} today`,
					},
					{
						label: "Real gain",
						value:
							result.realGainLpa !== null ? formatLpa(result.realGainLpa) : "—",
						subtext:
							result.projectedRealSalaryLpa !== null
								? `Inflation-adjusted salary ${formatLpa(result.projectedRealSalaryLpa)}`
								: "Turn on inflation adjustment to see this.",
					},
				]}
			/>

			<div className="island-shell rounded-2xl p-5">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="island-kicker mb-1">Projection curve</p>
						<h2 className="text-xl font-semibold text-foreground">
							See the growth path year by year
						</h2>
					</div>
					<ExportActions
						onCopyReport={onCopyReport}
						onDownloadCsv={onDownloadCsv}
						actionMessage={actionMessage}
					/>
				</div>
				<SalaryChart mode="simple" points={result.points} />
			</div>

			<InsightsGrid insights={result.insights} />
			<ProjectionTable points={result.points} />
		</div>
	);
}

function AdvancedResultsPanel({
	result,
	onCopyReport,
	onDownloadCsv,
	actionMessage,
}: {
	result: AdvancedProjectionResult;
	onCopyReport: () => void;
	onDownloadCsv: () => void;
	actionMessage: {
		tone: "positive" | "neutral" | "caution";
		text: string;
	} | null;
}) {
	if (result.validationErrors.length > 0 || !result.report) {
		return (
			<div className="flex min-h-105 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-background/50 px-6 py-16 text-center">
				<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<Target className="size-8" />
				</div>
				<div className="max-w-lg">
					<p className="text-base font-semibold text-foreground">
						Advanced insights unlock as soon as the timeline is valid
					</p>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						Add at least one valid salary history row, fix duplicate years, and
						keep override years after your latest salary year.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<SummaryCards
				cards={[
					{
						label: "Latest salary",
						value: formatLpa(result.report.latestSalaryLpa),
						subtext: `Historical multiple ${result.report.totalMultiple.toFixed(2)}x`,
						emphasis: true,
					},
					{
						label: "Projected end salary",
						value: formatLpa(result.report.projectedEndSalaryLpa),
						subtext:
							result.report.projectedEndRealSalaryLpa !== null
								? `Real salary ${formatLpa(result.report.projectedEndRealSalaryLpa)}`
								: "Nominal forecast only",
					},
					{
						label: "Switch vs stay",
						value:
							result.report.switchVsStayDeltaLpa !== null
								? formatLpa(result.report.switchVsStayDeltaLpa)
								: "—",
						subtext:
							result.report.switchVsStayDeltaLpa !== null
								? "Forecast end difference"
								: "Needs forecast years to compare",
					},
				]}
			/>

			<div className="island-shell rounded-2xl p-5">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="island-kicker mb-1">Growth report</p>
						<h2 className="text-xl font-semibold text-foreground">
							Historical progression and future path
						</h2>
					</div>
					<ExportActions
						onCopyReport={onCopyReport}
						onDownloadCsv={onDownloadCsv}
						actionMessage={actionMessage}
					/>
				</div>
				<p className="rounded-2xl border border-border bg-background/70 p-4 text-sm leading-relaxed text-muted-foreground">
					{result.report.narrative}
				</p>
				<div className="mt-5">
					<SalaryChart mode="advanced" points={result.points} />
				</div>
			</div>

			<InsightsGrid insights={result.report.insights} />
			<HistoricalIntervals intervals={result.historicalIntervals} />
			<ProjectionTable points={result.points} />
		</div>
	);
}

function SummaryCards({
	cards,
}: {
	cards: Array<{
		label: string;
		value: string;
		subtext: string;
		emphasis?: boolean;
	}>;
}) {
	return (
		<div className="grid gap-3 sm:grid-cols-3">
			{cards.map((card) => (
				<div
					key={card.label}
					className={cn(
						"rounded-2xl p-4",
						card.emphasis
							? "bg-[linear-gradient(135deg,#083344_0%,#0f766e_55%,#14b8a6_100%)] text-white shadow-lg shadow-cyan-500/20"
							: "island-shell",
					)}
				>
					<p
						className={cn(
							"mb-2 text-sm font-semibold tracking-tight",
							card.emphasis ? "text-cyan-50" : "text-foreground/72",
						)}
					>
						{card.label}
					</p>
					<p className="text-2xl font-bold tracking-tight">{card.value}</p>
					<p
						className={cn(
							"mt-2 text-sm leading-relaxed",
							card.emphasis ? "text-cyan-50/90" : "text-muted-foreground",
						)}
					>
						{card.subtext}
					</p>
				</div>
			))}
		</div>
	);
}

function ExportActions({
	onCopyReport,
	onDownloadCsv,
	actionMessage,
}: {
	onCopyReport: () => void;
	onDownloadCsv: () => void;
	actionMessage: {
		tone: "positive" | "neutral" | "caution";
		text: string;
	} | null;
}) {
	return (
		<div className="flex flex-col items-start gap-2 md:items-end">
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onDownloadCsv}
				>
					<Download className="size-4" />
					Download CSV
				</Button>
				<Button type="button" size="sm" onClick={onCopyReport}>
					<Copy className="size-4" />
					Copy report
				</Button>
			</div>
			{actionMessage && (
				<p
					className={cn(
						"text-xs",
						actionMessage.tone === "caution"
							? "text-amber-600"
							: "text-muted-foreground",
					)}
				>
					{actionMessage.text}
				</p>
			)}
		</div>
	);
}

function SalaryChart({
	mode,
	points,
}: {
	mode: SalaryGrowthMode;
	points: ProjectionPoint[];
}) {
	const maxSalary = Math.max(
		...points.map((point) => point.nominalSalaryLpa),
		0,
	);
	const visibleMilestones = SALARY_MILESTONES.filter(
		(milestone) => maxSalary >= milestone.valueLpa,
	);

	const simpleChartConfig: ChartConfig = {
		nominalSalaryLpa: {
			label: CHART_SERIES.nominal,
			color: "var(--chart-1)",
		},
		realSalaryLpa: {
			label: CHART_SERIES.real,
			color: "var(--chart-2)",
		},
	};

	const advancedChartConfig: ChartConfig = {
		actualSalaryLpa: {
			label: CHART_SERIES.actual,
			color: "var(--chart-1)",
		},
		projectedSalaryLpa: {
			label: CHART_SERIES.projected,
			color: "var(--chart-2)",
		},
		realSalaryLpa: {
			label: CHART_SERIES.real,
			color: "var(--chart-3)",
		},
		staySalaryLpa: {
			label: CHART_SERIES.stay,
			color: "var(--chart-5)",
		},
	};

	const config: ChartConfig =
		mode === "simple" ? simpleChartConfig : advancedChartConfig;

	return (
		<ChartContainer config={config} className="h-80 w-full">
			<ComposedChart
				accessibilityLayer
				data={points}
				margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					minTickGap={24}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					width={56}
					tickFormatter={(value) => `${value}L`}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={(value, name) => (
								<div className="flex min-w-40 items-center justify-between gap-4">
									<span className="text-muted-foreground">
										{config[String(name)]?.label ?? String(name)}
									</span>
									<span className="font-semibold text-foreground">
										{formatLpa(Number(value))}
									</span>
								</div>
							)}
						/>
					}
				/>
				<ChartLegend content={<ChartLegendContent />} />

				{visibleMilestones.map((milestone) => (
					<ReferenceLine
						key={milestone.label}
						y={milestone.valueLpa}
						stroke="var(--border)"
						strokeDasharray="4 4"
						label={{
							value: milestone.label,
							position: "insideTopLeft",
							fill: "var(--muted-foreground)",
							fontSize: 11,
						}}
					/>
				))}

				{mode === "simple" ? (
					<>
						<Area
							type="monotone"
							dataKey="nominalSalaryLpa"
							stroke="var(--color-nominalSalaryLpa)"
							fill="var(--color-nominalSalaryLpa)"
							fillOpacity={0.18}
							strokeWidth={3}
						/>
						<Line
							type="monotone"
							dataKey="realSalaryLpa"
							stroke="var(--color-realSalaryLpa)"
							strokeWidth={2.25}
							dot={false}
							connectNulls={false}
						/>
					</>
				) : (
					<>
						<Line
							type="monotone"
							dataKey="actualSalaryLpa"
							stroke="var(--color-actualSalaryLpa)"
							strokeWidth={3}
							connectNulls={false}
						/>
						<Line
							type="monotone"
							dataKey="projectedSalaryLpa"
							stroke="var(--color-projectedSalaryLpa)"
							strokeWidth={3}
							connectNulls={false}
						/>
						<Line
							type="monotone"
							dataKey="staySalaryLpa"
							stroke="var(--color-staySalaryLpa)"
							strokeDasharray="7 5"
							strokeWidth={2}
							dot={false}
							connectNulls={false}
						/>
						<Line
							type="monotone"
							dataKey="realSalaryLpa"
							stroke="var(--color-realSalaryLpa)"
							strokeWidth={2}
							dot={false}
							connectNulls={false}
						/>

						{points
							.filter(
								(point) =>
									point.eventType === "switch" ||
									point.eventType === "override",
							)
							.map((point) => (
								<ReferenceDot
									key={`${point.year}-${point.eventType}`}
									x={point.label}
									y={point.nominalSalaryLpa}
									r={5}
									fill={
										point.eventType === "switch"
											? "var(--color-projectedSalaryLpa)"
											: "var(--color-realSalaryLpa)"
									}
									stroke="var(--background)"
								/>
							))}
					</>
				)}
			</ComposedChart>
		</ChartContainer>
	);
}

function InsightsGrid({
	insights,
}: {
	insights: Array<{
		title: string;
		value: string;
		description: string;
		tone: "positive" | "neutral" | "caution";
	}>;
}) {
	return (
		<div className="flex flex-col gap-4">
			{insights.map((insight) => {
				const visuals = getInsightCardClasses(insight.tone);

				return (
					<div
						key={insight.title}
						className={cn(
							"rounded-xl border px-4 py-3 md:px-4 md:py-3.5",
							visuals.card,
						)}
					>
						<div className="grid gap-3 md:grid-cols-[minmax(0,240px)_1fr] md:items-start md:gap-5">
							<div className="space-y-1">
								<p
									className={cn(
										"text-sm font-medium tracking-tight",
										visuals.title,
									)}
								>
									{insight.title}
								</p>
								<p
									className={cn(
										"text-[2rem] font-semibold leading-none tracking-tight",
										visuals.value,
									)}
								>
									{insight.value}
								</p>
							</div>
							<div className="flex min-h-full items-center">
								<p
									className={cn(
										"max-w-3xl text-sm leading-6 md:text-[0.95rem]",
										visuals.copy,
									)}
								>
									{insight.description}
								</p>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function HistoricalIntervals({
	intervals,
}: {
	intervals: AdvancedProjectionResult["historicalIntervals"];
}) {
	if (intervals.length === 0) {
		return null;
	}

	return (
		<div className="island-shell rounded-2xl p-5">
			<p className="island-kicker mb-3">Historical jumps</p>
			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
				{intervals.map((interval) => (
					<div
						key={`${interval.fromYear}-${interval.toYear}`}
						className="rounded-2xl border border-border bg-background/70 p-4"
					>
						<p className="text-sm font-semibold text-foreground">
							{interval.fromYear} → {interval.toYear}
						</p>
						<p className="mt-2 text-lg font-bold text-foreground">
							{formatLpa(interval.endSalaryLpa)}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Annualized growth {interval.annualizedGrowthPct.toFixed(1)}%
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							From {formatLpa(interval.startSalaryLpa)} with a jump of{" "}
							{formatLpa(interval.absoluteGrowthLpa)}.
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

function ProjectionTable({ points }: { points: ProjectionPoint[] }) {
	return (
		<div className="island-shell overflow-hidden rounded-2xl p-5">
			<div className="mb-4">
				<p className="island-kicker mb-1">Year-by-year view</p>
				<h2 className="text-xl font-semibold text-foreground">
					The full salary path in one table
				</h2>
			</div>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Year</TableHead>
							<TableHead>Salary</TableHead>
							<TableHead>Real salary</TableHead>
							<TableHead>Event</TableHead>
							<TableHead>Growth</TableHead>
							<TableHead>Annualized</TableHead>
							<TableHead>Milestone</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{points.map((point) => (
							<TableRow key={`${point.year}-${point.eventType}`}>
								<TableCell className="font-medium">{point.year}</TableCell>
								<TableCell>{formatLpa(point.nominalSalaryLpa)}</TableCell>
								<TableCell>
									{point.realSalaryLpa !== null
										? formatLpa(point.realSalaryLpa)
										: "—"}
								</TableCell>
								<TableCell>
									<span
										className={cn(
											"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
											getEventBadgeClasses(point.eventType),
										)}
									>
										{point.eventType}
									</span>
								</TableCell>
								<TableCell>{formatGrowthPct(point.growthPct)}</TableCell>
								<TableCell>
									{formatGrowthPct(point.annualizedGrowthPct)}
								</TableCell>
								<TableCell>{point.milestoneLabel ?? "—"}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function Field({
	id,
	label,
	value,
	onChange,
	placeholder,
	suffix,
	disabled,
	ariaLabel,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	suffix?: string;
	disabled?: boolean;
	ariaLabel?: string;
}) {
	return (
		<div>
			<Label
				htmlFor={id}
				className="mb-2 block text-sm font-semibold text-foreground"
			>
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type="number"
					aria-label={ariaLabel}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					className={cn(suffix ? "pr-14" : undefined)}
				/>
				{suffix ? (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
		</div>
	);
}
