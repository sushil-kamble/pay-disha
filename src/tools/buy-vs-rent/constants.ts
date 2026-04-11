import type { BuyVsRentCityTier, BuyVsRentInputs } from "./types";

export const BUY_VS_RENT_STORAGE_KEY = "payday.buy-vs-rent";

export const DEFAULT_BUY_VS_RENT_INPUTS: BuyVsRentInputs = {
	propertyPriceLakhs: 90,
	monthlyRent: 30000,
	stayYears: 8,
	downPaymentLakhs: 18,
	homeLoanRatePct: 8.75,
	loanTenureYears: 20,
	annualCtcLakhs: 18,
	cityTier: "tier-1",
	ageYears: 30,
	salaryGrowthPct: 8,
	startYear: new Date().getFullYear(),
};

export const BUY_VS_RENT_MARKET_ASSUMPTIONS = {
	investmentReturnPct: 9,
	inflationRatePct: 4.6,
	annualMaintenancePct: 0.5,
	annualOwnerFixedCosts: 24000,
	purchaseCostPct: 7,
	saleCostPct: 2,
	rentDepositMonths: 2,
	rentBrokerageMonths: 1,
	propertyAppreciationPct: 6,
	rentIncreasePct: 6,
} as const;

export const BUY_VS_RENT_CITY_TIER_OPTIONS = [
	{
		value: "tier-1",
		label: "Tier 1",
		cities: "Mumbai, Bengaluru, Delhi NCR, Hyderabad",
	},
	{
		value: "tier-2",
		label: "Tier 2",
		cities: "Ahmedabad, Jaipur, Chandigarh, Lucknow",
	},
	{
		value: "tier-3",
		label: "Tier 3",
		cities: "Mysuru, Dehradun, Nashik, Raipur",
	},
] as const satisfies readonly {
	value: BuyVsRentCityTier;
	label: string;
	cities: string;
}[];

// City tier should only nudge the model. Home price and current rent are already
// explicit user inputs, so hidden tier defaults should stay modest and coherent.
export const BUY_VS_RENT_CITY_TIER_ASSUMPTIONS = {
	"tier-1": {
		propertyAppreciationAdjustmentPct: 0.4,
		rentIncreaseAdjustmentPct: 0.5,
		annualMaintenanceAdjustmentPct: 0.05,
		annualOwnerFixedCostsAdjustment: 12000,
		saleCostAdjustmentPct: 0,
		rentDepositMonthsAdjustment: 1,
	},
	"tier-2": {
		propertyAppreciationAdjustmentPct: 0,
		rentIncreaseAdjustmentPct: 0,
		annualMaintenanceAdjustmentPct: 0,
		annualOwnerFixedCostsAdjustment: 0,
		saleCostAdjustmentPct: 0,
		rentDepositMonthsAdjustment: 0,
	},
	"tier-3": {
		propertyAppreciationAdjustmentPct: -0.3,
		rentIncreaseAdjustmentPct: -0.5,
		annualMaintenanceAdjustmentPct: -0.05,
		annualOwnerFixedCostsAdjustment: -6000,
		saleCostAdjustmentPct: 0.5,
		rentDepositMonthsAdjustment: -1,
	},
} as const satisfies Record<
	BuyVsRentCityTier,
	{
		propertyAppreciationAdjustmentPct: number;
		rentIncreaseAdjustmentPct: number;
		annualMaintenanceAdjustmentPct: number;
		annualOwnerFixedCostsAdjustment: number;
		saleCostAdjustmentPct: number;
		rentDepositMonthsAdjustment: number;
	}
>;

export const BUY_VS_RENT_LIMITS = {
	minPropertyPriceLakhs: 5,
	maxPropertyPriceLakhs: 5000,
	minMonthlyRent: 1000,
	maxMonthlyRent: 500000,
	minStayYears: 1,
	maxStayYears: 30,
	minDownPaymentLakhs: 0,
	maxDownPaymentLakhs: 5000,
	minInterestPct: 0,
	maxInterestPct: 25,
	minLoanTenureYears: 1,
	maxLoanTenureYears: 35,
	minAppreciationPct: -5,
	maxAppreciationPct: 20,
	minRentIncreasePct: 0,
	maxRentIncreasePct: 20,
	minInvestmentReturnPct: 0,
	maxInvestmentReturnPct: 25,
	minInflationRatePct: 0,
	maxInflationRatePct: 20,
	minAnnualMaintenancePct: 0,
	maxAnnualMaintenancePct: 8,
	minAnnualOwnerFixedCosts: 0,
	maxAnnualOwnerFixedCosts: 500000,
	minPurchaseCostPct: 0,
	maxPurchaseCostPct: 15,
	minSaleCostPct: 0,
	maxSaleCostPct: 10,
	minDepositMonths: 0,
	maxDepositMonths: 24,
	minBrokerageMonths: 0,
	maxBrokerageMonths: 3,
	minAnnualCtcLakhs: 3,
	maxAnnualCtcLakhs: 500,
	minAgeYears: 21,
	maxAgeYears: 65,
	minSalaryGrowthPct: 0,
	maxSalaryGrowthPct: 20,
} as const;

export const BUY_VS_RENT_BENCHMARKS = {
	priceToIncome: {
		goodMax: 4.5,
		watchMax: 6.5,
	},
	emiToIncome: {
		goodMax: 0.3,
		watchMax: 0.4,
		softWarning: 0.35,
	},
	ageTenure: {
		goodMaxLoanEndAge: 50,
		watchMaxLoanEndAge: 60,
	},
} as const;

export const BUY_VS_RENT_SCENARIO_OFFSETS = {
	"lower-housing-upside": {
		propertyAppreciationPct: -2,
		investmentReturnPct: 1.5,
		rentIncreasePct: -1,
	},
	"base-case": {
		propertyAppreciationPct: 0,
		investmentReturnPct: 0,
		rentIncreasePct: 0,
	},
	"stronger-housing-market": {
		propertyAppreciationPct: 2,
		investmentReturnPct: -1.5,
		rentIncreasePct: 1,
	},
} as const;

export const BUY_VS_RENT_SCENARIO_LABELS = {
	"lower-housing-upside": "Lower housing upside",
	"base-case": "Base case",
	"stronger-housing-market": "Stronger housing market",
} as const;

export const BUY_VS_RENT_VERDICT_LABELS = {
	buy: "Buy",
	rent: "Rent",
	"close-call": "Close call",
} as const;
