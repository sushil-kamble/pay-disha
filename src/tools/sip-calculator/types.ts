export type SipGoalPreset =
	| "wealth-milestone"
	| "home-down-payment"
	| "child-education"
	| "custom";

export type SipInsightTone = "positive" | "neutral" | "caution" | "surprise";

export type SipLeverImpact = "high" | "medium" | "low";

export type SipScenarioBandLabel = "cautious" | "base" | "stretch";

export interface SipInputs {
	goalPreset: SipGoalPreset;
	targetAmountToday: number;
	yearsToGoal: number;
	monthlySip: number;
	startingCorpus: number;
	annualStepUpPct: number;
	expectedReturnPct: number;
	realValueInflationPct: number;
	goalInflationPct: number;
	monthlyExpenses: number | null;
	startYear: number;
}

export interface SipProjectionPoint {
	yearOffset: number;
	calendarYear: number;
	investedAmount: number;
	corpus: number;
	gains: number;
	realCorpus: number;
	goalAmount: number;
	gap: number;
}

export interface SipMilestoneHit {
	label: string;
	value: number;
	yearOffset: number | null;
	calendarYear: number | null;
}

export interface SipDelayCost {
	delayYears: number;
	requiredMonthlySip: number | null;
	additionalMonthlySip: number | null;
	projectedCorpus: number;
	gap: number;
}

export interface SipScenarioBand {
	label: SipScenarioBandLabel;
	annualReturnPct: number;
	projectedCorpus: number;
	gap: number;
	isOnTrack: boolean;
}

export interface SipInsight {
	id: string;
	title: string;
	value: string;
	description: string;
	tone: SipInsightTone;
}

export interface SipLeverScenario {
	id: string;
	label: string;
	description: string;
	projectedCorpus: number;
	gap: number;
	isOnTrack: boolean;
	yearsToTarget: number | null;
	impact: SipLeverImpact;
}

export interface SipResult {
	inputs: SipInputs;
	goalCalendarYear: number;
	goalAmountAtTarget: number;
	projectedCorpusAtTarget: number;
	realCorpusAtTarget: number;
	targetGap: number;
	isOnTrack: boolean;
	requiredMonthlySip: number | null;
	requiredAnnualStepUpPct: number | null;
	yearsToTarget: number | null;
	extraYearsNeeded: number | null;
	delayCosts: SipDelayCost[];
	projectionPoints: SipProjectionPoint[];
	milestoneHits: SipMilestoneHit[];
	scenarioBands: SipScenarioBand[];
	compoundingCrossoverYear: number | null;
	compoundingCrossoverCalendarYear: number | null;
	contributionsAtTarget: number;
	gainsAtTarget: number;
	contributionSharePct: number;
	growthSharePct: number;
	startingCorpusFutureValue: number;
	startingCorpusSharePct: number;
	insights: SipInsight[];
	leverScenarios: SipLeverScenario[];
}
