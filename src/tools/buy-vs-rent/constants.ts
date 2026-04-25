import type { AdvancedAssumptions, MarketType, QuickInputs } from "./types";

export const BUY_VS_RENT_STORAGE_KEY = "payday.buy-vs-rent.v2";

export const DEFAULT_QUICK_INPUTS: QuickInputs = {
	propertyPriceLakhs: 90,
	monthlyRent: 30000,
	stayYears: 8,
	monthlyTakeHome: 125000,
	availableCashLakhs: 25,
};

export const MARKET_TYPE_OPTIONS = [
	{
		value: "metro",
		label: "Metro / Tier 1",
		description: "Higher buying friction, deposits, and rent growth.",
	},
	{
		value: "large-city",
		label: "Large city / Tier 2",
		description: "Balanced default for most urban markets.",
	},
	{
		value: "smaller-city",
		label: "Smaller city / Tier 3",
		description: "Lower friction and slightly softer growth.",
	},
] as const satisfies readonly {
	value: MarketType;
	label: string;
	description: string;
}[];

export const MARKET_DEFAULTS = {
	metro: {
		extraBuyingCostPct: 8,
		rentSetupMonths: 4,
		rentIncreasePct: 7,
		propertyAppreciationPct: 5.5,
		ownerCostAnnualPct: 0.9,
	},
	"large-city": {
		extraBuyingCostPct: 7,
		rentSetupMonths: 3,
		rentIncreasePct: 6,
		propertyAppreciationPct: 5,
		ownerCostAnnualPct: 0.75,
	},
	"smaller-city": {
		extraBuyingCostPct: 6,
		rentSetupMonths: 2,
		rentIncreasePct: 5,
		propertyAppreciationPct: 4.5,
		ownerCostAnnualPct: 0.65,
	},
} as const satisfies Record<
	MarketType,
	{
		extraBuyingCostPct: number;
		rentSetupMonths: number;
		rentIncreasePct: number;
		propertyAppreciationPct: number;
		ownerCostAnnualPct: number;
	}
>;

export const DEFAULT_ADVANCED_ASSUMPTIONS: AdvancedAssumptions = {
	marketType: "large-city",
	loanRatePct: 7.75,
	loanTenureYears: 20,
	extraBuyingCostPct: MARKET_DEFAULTS["large-city"].extraBuyingCostPct,
	monthlyOwnerCost: 5625,
	rentSetupCost: DEFAULT_QUICK_INPUTS.monthlyRent * 3,
	rentIncreasePct: MARKET_DEFAULTS["large-city"].rentIncreasePct,
	propertyAppreciationPct:
		MARKET_DEFAULTS["large-city"].propertyAppreciationPct,
	investmentReturnPct: 9,
	saleCostPct: 2,
};

export const BUY_VS_RENT_LIMITS = {
	minPropertyPriceLakhs: 5,
	maxPropertyPriceLakhs: 5000,
	minMonthlyRent: 1000,
	maxMonthlyRent: 500000,
	minStayYears: 1,
	maxStayYears: 30,
	minMonthlyTakeHome: 10000,
	maxMonthlyTakeHome: 5000000,
	minAvailableCashLakhs: 0,
	maxAvailableCashLakhs: 5000,
	minLoanRatePct: 0,
	maxLoanRatePct: 25,
	minLoanTenureYears: 1,
	maxLoanTenureYears: 35,
	minExtraBuyingCostPct: 0,
	maxExtraBuyingCostPct: 20,
	minMonthlyOwnerCost: 0,
	maxMonthlyOwnerCost: 500000,
	minRentSetupCost: 0,
	maxRentSetupCost: 5000000,
	minRentIncreasePct: 0,
	maxRentIncreasePct: 20,
	minPropertyAppreciationPct: -5,
	maxPropertyAppreciationPct: 20,
	minInvestmentReturnPct: 0,
	maxInvestmentReturnPct: 25,
	minSaleCostPct: 0,
	maxSaleCostPct: 10,
} as const;

export const AFFORDABILITY_THRESHOLDS = {
	comfortableMax: 0.35,
	watchMax: 0.4,
} as const;

export const VERDICT_LABELS = {
	buy: "Buy",
	rent: "Rent",
	"close-call": "Close call",
} as const;
