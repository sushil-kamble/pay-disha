import type { SipGoalPreset, SipInputs, SipScenarioBandLabel } from "./types";

export const SIP_STORAGE_KEY = "sip-calculator:state";

export const SIP_GOAL_PRESETS: Record<
	SipGoalPreset,
	{
		label: string;
		description: string;
		defaultGoalInflationPct: number;
		helper: string;
	}
> = {
	"wealth-milestone": {
		label: "Wealth milestone",
		description:
			"For corpus goals like 1 Cr, 2 Cr, or your first serious investing landmark.",
		defaultGoalInflationPct: 0,
		helper:
			"The target itself does not inflate. Your 1 Cr target remains 1 Cr.",
	},
	"home-down-payment": {
		label: "Home down payment",
		description:
			"For future house-buying goals where property prices keep climbing.",
		defaultGoalInflationPct: 6,
		helper:
			"Home prices often move faster than generic inflation in Indian cities.",
	},
	"child-education": {
		label: "Child education",
		description:
			"For education costs that tend to rise faster than normal living costs.",
		defaultGoalInflationPct: 10,
		helper: "Education inflation is usually much steeper than headline CPI.",
	},
	custom: {
		label: "Custom",
		description:
			"Use your own target and assumptions for any future money goal.",
		defaultGoalInflationPct: 6,
		helper:
			"Use this when your goal is personal and does not match a preset path.",
	},
};

export function getSipDefaults(
	startYear = new Date().getFullYear(),
): SipInputs {
	return {
		goalPreset: "wealth-milestone",
		targetAmountToday: 10000000,
		yearsToGoal: 15,
		monthlySip: 25000,
		startingCorpus: 0,
		annualStepUpPct: 0,
		expectedReturnPct: 12,
		realValueInflationPct: 6,
		goalInflationPct:
			SIP_GOAL_PRESETS["wealth-milestone"].defaultGoalInflationPct,
		monthlyExpenses: null,
		startYear,
	};
}

export const SIP_LIMITS = {
	minTargetAmountToday: 100000,
	maxTargetAmountToday: 500000000,
	minYearsToGoal: 1,
	maxYearsToGoal: 50,
	minMonthlySip: 0,
	maxMonthlySip: 5000000,
	minStartingCorpus: 0,
	maxStartingCorpus: 500000000,
	minAnnualStepUpPct: 0,
	maxAnnualStepUpPct: 50,
	minExpectedReturnPct: 1,
	maxExpectedReturnPct: 25,
	minRealValueInflationPct: 0,
	maxRealValueInflationPct: 15,
	minGoalInflationPct: 0,
	maxGoalInflationPct: 20,
	minMonthlyExpenses: 0,
	maxMonthlyExpenses: 1000000,
};

export const SIP_MILESTONES = [
	{ label: "25L", value: 2500000 },
	{ label: "50L", value: 5000000 },
	{ label: "1Cr", value: 10000000 },
	{ label: "2Cr", value: 20000000 },
	{ label: "5Cr", value: 50000000 },
] as const;

export const SIP_DELAY_YEARS = [1, 3, 5] as const;

export const SIP_SCENARIO_BANDS: Array<{
	label: SipScenarioBandLabel;
	annualReturnPct: number;
}> = [
	{ label: "cautious", annualReturnPct: 10 },
	{ label: "base", annualReturnPct: 12 },
	{ label: "stretch", annualReturnPct: 14 },
];

export const SIP_EDUCATION = {
	expectedReturn:
		"Use a realistic long-term expectation, not your best recent year. For Indian equity-heavy SIP plans, 10% to 12% is a more responsible planning range.",
	goalInflation:
		"This inflates the price tag of the goal itself. Homes and education often rise faster than generic inflation.",
	realValueInflation:
		"This converts future corpus into today's purchasing power so you can see what the money really means.",
	stepUp:
		"Step-up means increasing your SIP every year as your salary grows. Small annual increases often beat one-time heroic jumps.",
	monthlyExpenses:
		"Optional. If you add current expenses, the tool translates your future corpus into years of lifestyle freedom.",
};
