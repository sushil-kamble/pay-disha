import type {
	AdvancedSalaryGrowthInputs,
	FutureSalaryOverride,
	SalaryHistoryEntry,
	SimpleSalaryGrowthInputs,
} from "./types";

export const DEFAULT_BASE_YEAR = new Date().getFullYear();

export const SALARY_GROWTH_FINANCIAL_CONTEXT =
	"All calculations run privately in your browser";

export const SALARY_GROWTH_STORAGE_KEYS = {
	mode: "salary-growth:mode",
	simple: "salary-growth:simple",
	advanced: "salary-growth:advanced",
} as const;

export const SIMPLE_INPUT_LIMITS = {
	minSalaryLpa: 0.1,
	maxSalaryLpa: 1000,
	minYearlyIncrementPct: 0,
	maxYearlyIncrementPct: 100,
	minProjectionYears: 1,
	maxProjectionYears: 40,
	minInflationRatePct: 0,
	maxInflationRatePct: 20,
} as const;

export const ADVANCED_INPUT_LIMITS = {
	minYear: 1980,
	maxYear: DEFAULT_BASE_YEAR + 50,
	minSalaryLpa: 0.1,
	maxSalaryLpa: 1000,
	minProjectionYears: 1,
	maxProjectionYears: 40,
	minAnnualIncrementPct: 0,
	maxAnnualIncrementPct: 100,
	minSwitchEveryYears: 1,
	maxSwitchEveryYears: 15,
	minSwitchHikePct: 0,
	maxSwitchHikePct: 200,
	minInflationRatePct: 0,
	maxInflationRatePct: 20,
} as const;

export const SALARY_MILESTONES = [
	{ label: "25L", valueLpa: 25 },
	{ label: "50L", valueLpa: 50 },
	{ label: "1Cr", valueLpa: 100 },
] as const;

export const DEFAULT_SIMPLE_INPUTS: SimpleSalaryGrowthInputs = {
	currentSalaryLpa: 12,
	yearlyIncrementPct: 10,
	projectionYears: 10,
	inflationAdjusted: true,
	inflationRatePct: 6,
	baseYear: DEFAULT_BASE_YEAR,
};

export const DEFAULT_ADVANCED_HISTORY: SalaryHistoryEntry[] = [
	{ year: 2022, salaryLpa: 8 },
	{ year: 2023, salaryLpa: 8.4 },
	{ year: 2024, salaryLpa: 15 },
	{ year: 2025, salaryLpa: 20 },
	{ year: 2026, salaryLpa: 30 },
];

export const DEFAULT_ADVANCED_OVERRIDES: FutureSalaryOverride[] = [
	{ year: 2029, salaryLpa: 52 },
];

export const DEFAULT_ADVANCED_INPUTS: AdvancedSalaryGrowthInputs = {
	history: DEFAULT_ADVANCED_HISTORY,
	annualIncrementPct: 10,
	switchEveryYears: 3,
	switchHikePct: 30,
	projectionYears: 10,
	inflationAdjusted: true,
	inflationRatePct: 6,
	overrides: DEFAULT_ADVANCED_OVERRIDES,
};

export const SIMPLE_PLACEHOLDERS = {
	currentSalaryLpa: "12",
	yearlyIncrementPct: "10",
	projectionYears: "10",
	inflationRatePct: "6",
} as const;

export const ADVANCED_PLACEHOLDERS = {
	year: "2026",
	salaryLpa: "30",
	annualIncrementPct: "10",
	switchEveryYears: "3",
	switchHikePct: "30",
	projectionYears: "10",
	inflationRatePct: "6",
	overrideYear: "2029",
	overrideSalaryLpa: "52",
} as const;

export const VALIDATION_MESSAGES = {
	historyYearRequired: "Each salary history row needs a valid year.",
	historySalaryRequired: "Each salary history row needs a positive salary.",
	historyYearDuplicate: "Salary history years must be unique.",
	overrideYearRequired: "Each future override needs a valid year.",
	overrideSalaryRequired: "Each future override needs a positive salary.",
	overrideYearDuplicate: "Future override years must be unique.",
	overrideYearMustBeFuture:
		"Future override years must be later than your latest salary year.",
	needAtLeastOneHistoryRow:
		"Add at least one salary history row to build a forecast.",
} as const;

export const CHART_SERIES = {
	nominal: "Nominal Salary",
	real: "Inflation-adjusted Salary",
	actual: "Actual Salary",
	projected: "Projected Salary",
	stay: "Stay in same company",
} as const;
