export type BuyVsRentVerdict = "buy" | "rent" | "close-call";
export type MarketType = "metro" | "large-city" | "smaller-city";
export type ScenarioConfidence = "strong-signal" | "sensitive" | "close-call";
export type AffordabilityBand = "comfortable" | "watch" | "stretched";

export interface QuickInputs {
	propertyPriceLakhs: number;
	monthlyRent: number;
	stayYears: number;
	monthlyTakeHome: number;
	availableCashLakhs: number;
}

export interface AdvancedAssumptions {
	marketType: MarketType;
	loanRatePct: number;
	loanTenureYears: number;
	extraBuyingCostPct: number;
	monthlyOwnerCost: number;
	rentSetupCost: number;
	rentIncreasePct: number;
	propertyAppreciationPct: number;
	investmentReturnPct: number;
	saleCostPct: number;
}

export type BuyVsRentInputs = QuickInputs & AdvancedAssumptions;

export interface BuyVsRentPoint {
	year: number;
	label: string;
	homeValue: number;
	outstandingLoan: number;
	buyNetWorth: number;
	rentNetWorth: number;
	gap: number;
	buyMonthlyCost: number;
	rentMonthlyCost: number;
	buyerInvestments: number;
	renterInvestments: number;
}

export interface AnswerChangingLever {
	label: string;
	value: string;
	description: string;
	tone: "buy" | "rent" | "neutral";
}

export interface ScenarioResult {
	name: "Conservative" | "Balanced" | "Optimistic";
	verdict: BuyVsRentVerdict;
	gap: number;
}

export interface DecisionResult {
	verdict: BuyVsRentVerdict;
	confidence: ScenarioConfidence;
	headline: string;
	explanation: string;
	wealthGap: number;
	breakEvenYear: number | null;
	buyMonthlyPressure: number | null;
	rentMonthlyPressure: number | null;
	affordabilityBand: AffordabilityBand;
	upfrontCashNeeded: number;
	cashShortfall: number;
	liquidityNote: string;
	monthlyBuyCost: number;
	monthlyRentCost: number;
	buyNetWorth: number;
	rentNetWorth: number;
	keyDrivers: string[];
	answerChangingLevers: AnswerChangingLever[];
	scenarios: ScenarioResult[];
}

export interface BuyVsRentResult {
	inputs: BuyVsRentInputs;
	points: BuyVsRentPoint[];
	decision: DecisionResult;
}
