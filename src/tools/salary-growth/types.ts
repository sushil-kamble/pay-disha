export type SalaryGrowthMode = "simple" | "advanced";

export type ProjectionEventType =
	| "history"
	| "increment"
	| "switch"
	| "override";

export interface SalaryHistoryEntry {
	year: number;
	salaryLpa: number;
}

export interface FutureSalaryOverride {
	year: number;
	salaryLpa: number;
}

export interface SimpleSalaryGrowthInputs {
	currentSalaryLpa: number;
	yearlyIncrementPct: number;
	projectionYears: number;
	inflationAdjusted: boolean;
	inflationRatePct: number;
	baseYear: number;
}

export interface AdvancedSalaryGrowthInputs {
	history: SalaryHistoryEntry[];
	annualIncrementPct: number;
	switchEveryYears: number;
	switchHikePct: number;
	projectionYears: number;
	inflationAdjusted: boolean;
	inflationRatePct: number;
	overrides: FutureSalaryOverride[];
}

export interface ProjectionPoint {
	year: number;
	label: string;
	nominalSalaryLpa: number;
	realSalaryLpa: number | null;
	actualSalaryLpa: number | null;
	projectedSalaryLpa: number | null;
	staySalaryLpa: number | null;
	eventType: ProjectionEventType;
	growthPct: number | null;
	annualizedGrowthPct: number | null;
	milestoneLabel: string | null;
}

export interface HistoricalIntervalInsight {
	fromYear: number;
	toYear: number;
	startSalaryLpa: number;
	endSalaryLpa: number;
	absoluteGrowthLpa: number;
	growthPct: number;
	annualizedGrowthPct: number;
}

export interface SalaryInsight {
	title: string;
	value: string;
	description: string;
	tone: "positive" | "neutral" | "caution";
}

export interface SalaryGrowthReport {
	narrative: string;
	insights: SalaryInsight[];
	startSalaryLpa: number;
	latestSalaryLpa: number;
	absoluteGrowthLpa: number;
	totalMultiple: number;
	cagrPct: number | null;
	bestInterval: HistoricalIntervalInsight | null;
	weakestInterval: HistoricalIntervalInsight | null;
	nextMilestoneYear: number | null;
	nextMilestoneLabel: string | null;
	projectedEndSalaryLpa: number;
	projectedEndRealSalaryLpa: number | null;
	switchVsStayDeltaLpa: number | null;
}

export interface SimpleProjectionResult {
	inputs: SimpleSalaryGrowthInputs;
	points: ProjectionPoint[];
	projectedSalaryLpa: number;
	projectedRealSalaryLpa: number | null;
	totalGainLpa: number;
	realGainLpa: number | null;
	firstMilestoneLabel: string | null;
	firstMilestoneYear: number | null;
	insights: SalaryInsight[];
}

export interface AdvancedProjectionResult {
	inputs: AdvancedSalaryGrowthInputs;
	validationErrors: string[];
	normalizedHistory: SalaryHistoryEntry[];
	normalizedOverrides: FutureSalaryOverride[];
	points: ProjectionPoint[];
	historicalIntervals: HistoricalIntervalInsight[];
	report: SalaryGrowthReport | null;
}
