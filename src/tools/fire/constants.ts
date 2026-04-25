import type { FireInputs, FireType } from "./types";

export const FIRE_STORAGE_KEY = "fire:inputs";

export const FIRE_DEFAULTS: FireInputs = {
	currentAge: 28,
	monthlyExpenses: 50000,
	existingSavings: 500000,
	targetRetirementAge: 45,
	monthlySip: 20000,
	annualSipStepUpPct: 0,
	expectedReturnPct: 12,
	inflationPct: 6,
};

export const FIRE_MARKET_ASSUMPTIONS = {
	// India-focused FIRE planning commonly uses about 30x-33x annual expenses.
	corpusMultiple: 33,
} as const;

export const FIRE_LIMITS = {
	minAge: 18,
	maxAge: 65,
	minRetirementAge: 25,
	maxRetirementAge: 70,
	minMonthlyExpenses: 5000,
	maxMonthlyExpenses: 1000000,
	minExistingSavings: 0,
	maxExistingSavings: 100000000,
	minMonthlySip: 0,
	maxMonthlySip: 1000000,
	minAnnualSipStepUpPct: 0,
	maxAnnualSipStepUpPct: 100,
	minExpectedReturnPct: 4,
	maxExpectedReturnPct: 20,
	minInflationPct: 2,
	maxInflationPct: 15,
};

export const FIRE_TYPE_CONFIG: Record<
	FireType,
	{
		factor: number | null;
		label: string;
		color: string;
		bg: string;
		darkBg: string;
		description: string;
	}
> = {
	lean: {
		factor: 0.7,
		label: "Lean FIRE",
		color: "text-amber-600",
		bg: "bg-amber-50",
		darkBg: "dark:bg-amber-950/30",
		description: "Bare essentials — frugal but free",
	},
	regular: {
		factor: 1.0,
		label: "FIRE",
		color: "text-emerald-600",
		bg: "bg-emerald-50",
		darkBg: "dark:bg-emerald-950/30",
		description: "Your current lifestyle, sustained forever",
	},
	comfort: {
		factor: 1.4,
		label: "Comfort FIRE",
		color: "text-blue-600",
		bg: "bg-blue-50",
		darkBg: "dark:bg-blue-950/30",
		description: "Current lifestyle + upgrades and buffer",
	},
	coast: {
		factor: null,
		label: "Coast FIRE",
		color: "text-violet-600",
		bg: "bg-violet-50",
		darkBg: "dark:bg-violet-950/30",
		description: "Save enough now, let compounding finish the job",
	},
	barista: {
		factor: null,
		label: "Barista FIRE",
		color: "text-rose-600",
		bg: "bg-rose-50",
		darkBg: "dark:bg-rose-950/30",
		description: "Semi-retire now, cover the gap with part-time income",
	},
};

export const CORPUS_MILESTONES = [
	{ label: "25L", value: 2500000 },
	{ label: "50L", value: 5000000 },
	{ label: "1Cr", value: 10000000 },
	{ label: "5Cr", value: 50000000 },
	{ label: "10Cr", value: 100000000 },
];

export const FIRE_EDUCATION: Record<string, string> = {
	inflation:
		"India's average CPI inflation over the past 20 years is around 6%. Urban living costs often outpace this.",
	returns:
		"The Nifty 50 has delivered ~12% CAGR over 20+ years. After inflation, real returns are ~6%.",
	stepUp:
		"Step-up means increasing your SIP every year as income grows. A 0% step-up keeps the SIP fixed.",
	coastFire:
		"Coast FIRE means you already have enough invested that compounding alone will get you to your FIRE number by retirement. You can stop saving aggressively and just cover current expenses.",
	baristaFire:
		"Barista FIRE means your portfolio covers most expenses, but you work part-time to fill the gap. In India, think freelancing, teaching, or a passion project.",
	fireNumber:
		"Your FIRE number is the corpus target based on the configured multiple of your annual expenses.",
};
