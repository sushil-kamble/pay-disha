export interface FireInputs {
	currentAge: number;
	monthlyExpenses: number;
	existingSavings: number;
	targetRetirementAge: number;
	monthlySip: number;
	expectedReturnPct: number;
	inflationPct: number;
	swrPct: number;
	healthcareInflationPct: number;
	monthlyHealthcareBudget: number;
	epfMonthlyContribution: number;
	epfInterestPct: number;
}

export type FireType = "lean" | "regular" | "comfort" | "coast" | "barista";

export interface FireTypeResult {
	type: FireType;
	label: string;
	number: number;
	description: string;
	yearsToReach: number | null;
	ageAtReach: number | null;
	isAchievable: boolean;
}

export interface FireProjectionPoint {
	year: number;
	age: number;
	corpus: number;
	epfCorpus: number;
	totalWealth: number;
	fireTarget: number;
	annualExpenses: number;
}

export type InsightTone = "positive" | "neutral" | "caution" | "surprise";

export interface FireInsight {
	id: string;
	title: string;
	value: string;
	description: string;
	tone: InsightTone;
}

export interface LeverScenario {
	id: string;
	label: string;
	description: string;
	originalYearsToFire: number;
	newYearsToFire: number | null;
	yearsSaved: number | null;
	newFireNumber: number;
	impact: "high" | "medium" | "low";
}

export interface FireResult {
	inputs: FireInputs;
	fireNumber: number;
	fireMultiplier: number;
	leanFireNumber: number;
	comfortFireNumber: number;
	coastFireNumber: number;
	baristaFireMonthlyIncome: number;
	futureAnnualExpenses: number;
	futureMonthlyExpenses: number;
	yearsToFire: number | null;
	fireAge: number | null;
	projectedCorpusAtRetirement: number;
	epfCorpusAtRetirement: number;
	shortfall: number;
	fireTypes: FireTypeResult[];
	projectionPoints: FireProjectionPoint[];
	insights: FireInsight[];
	leverScenarios: LeverScenario[];
}
