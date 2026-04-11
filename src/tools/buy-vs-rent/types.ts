export type BuyVsRentVerdict = "buy" | "rent" | "close-call";

export type InsightTone = "positive" | "neutral" | "caution";
export type BenchmarkBand = "good" | "watch" | "risky";
export type RecommendedTaxRegime = "new" | "old";

export type ScenarioLabel =
	| "lower-housing-upside"
	| "base-case"
	| "stronger-housing-market";

export interface BuyVsRentInputs {
	propertyPriceLakhs: number;
	monthlyRent: number;
	stayYears: number;
	downPaymentPct: number;
	homeLoanRatePct: number;
	loanTenureYears: number;
	propertyAppreciationPct: number;
	rentIncreasePct: number;
	investmentReturnPct: number;
	inflationRatePct: number;
	annualMaintenancePct: number;
	annualOwnerFixedCosts: number;
	purchaseCostPct: number;
	saleCostPct: number;
	rentDepositMonths: number;
	rentBrokerageMonths: number;
	annualCtcLakhs: number;
	ageYears: number;
	salaryGrowthPct: number;
	startYear: number;
}

export interface BuyVsRentPoint {
	year: number;
	label: string;
	propertyValue: number;
	outstandingLoan: number;
	buyHomeEquity: number;
	buyInvestmentCorpus: number;
	rentInvestmentCorpus: number;
	rentDepositValue: number;
	buyNetWorth: number;
	rentNetWorth: number;
	gap: number;
	realBuyNetWorth: number;
	realRentNetWorth: number;
	realGap: number;
	buyAnnualOutgo: number;
	rentAnnualOutgo: number;
	buyMonthlyOutgo: number;
	rentMonthlyOutgo: number;
	annualPrincipalPaid: number;
	annualInterestPaid: number;
	annualMaintenancePaid: number;
	annualRentPaid: number;
	monthlyTakeHomeOldRegime: number | null;
	monthlyTakeHomeNewRegime: number | null;
	monthlyTakeHomeRecommended: number | null;
	buyStressRatio: number | null;
	rentStressRatio: number | null;
}

export interface AffordabilityBenchmark {
	label: string;
	value: string;
	band: BenchmarkBand;
	description: string;
}

export interface BuyVsRentInsight {
	title: string;
	value: string;
	description: string;
	tone: InsightTone;
}

export interface BuyVsRentScenarioSummary {
	label: ScenarioLabel;
	verdict: BuyVsRentVerdict;
	gap: number;
	buyNetWorth: number;
	rentNetWorth: number;
	propertyAppreciationPct: number;
	investmentReturnPct: number;
	rentIncreasePct: number;
}

export interface BuyVsRentSummary {
	verdict: BuyVsRentVerdict;
	confidence: "high" | "medium" | "low";
	story: string;
	horizonYears: number;
	financialGap: number;
	buyNetWorth: number;
	rentNetWorth: number;
	breakEvenYear: number | null;
	upfrontBuyCash: number;
	upfrontRentCash: number;
	upfrontGap: number;
	firstYearBuyMonthlyOutgo: number;
	firstYearRentMonthlyOutgo: number;
	finalYearBuyMonthlyOutgo: number;
	finalYearRentMonthlyOutgo: number;
	finalHomeEquity: number;
	finalRentCorpus: number;
	monthlyTakeHomeOldRegime: number | null;
	monthlyTakeHomeNewRegime: number | null;
	monthlyTakeHomeRecommended: number | null;
	recommendedTaxRegime: RecommendedTaxRegime | null;
	recommendedTaxRegimeNote: string;
	buyStressRatio: number | null;
	rentStressRatio: number | null;
	priceToIncomeRatio: number;
	priceToIncomeBand: BenchmarkBand;
	emiToIncomeRatio: number | null;
	emiToIncomeBand: BenchmarkBand | null;
	ageTenureBand: BenchmarkBand;
	affordabilityBenchmarks: AffordabilityBenchmark[];
	buyBecomesReasonableAfterYear: number | null;
	reasons: string[];
	decisionNote: string;
	insights: BuyVsRentInsight[];
	scenarios: BuyVsRentScenarioSummary[];
}

export interface BuyVsRentResult {
	inputs: BuyVsRentInputs;
	points: BuyVsRentPoint[];
	summary: BuyVsRentSummary;
}
