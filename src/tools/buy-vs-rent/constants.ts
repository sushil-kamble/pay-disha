import type { BuyVsRentInputs } from "./types";

export const DEFAULT_BUY_VS_RENT_INPUTS: BuyVsRentInputs = {
	propertyPriceLakhs: 90,
	monthlyRent: 30000,
	stayYears: 8,
	downPaymentPct: 20,
	homeLoanRatePct: 8.75,
	loanTenureYears: 20,
	propertyAppreciationPct: 6,
	rentIncreasePct: 6,
	investmentReturnPct: 10,
	inflationRatePct: 6,
	annualMaintenancePct: 1.4,
	annualOwnerFixedCosts: 36000,
	purchaseCostPct: 7,
	saleCostPct: 2,
	rentDepositMonths: 3,
	rentBrokerageMonths: 1,
	annualBuyTaxBenefit: 0,
	annualRentTaxBenefit: 0,
	monthlyTakeHomePay: null,
	startYear: new Date().getFullYear(),
};

export const BUY_VS_RENT_LIMITS = {
	minPropertyPriceLakhs: 5,
	maxPropertyPriceLakhs: 5000,
	minMonthlyRent: 1000,
	maxMonthlyRent: 500000,
	minStayYears: 1,
	maxStayYears: 30,
	minDownPaymentPct: 0,
	maxDownPaymentPct: 100,
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
	minAnnualTaxBenefit: 0,
	maxAnnualTaxBenefit: 1000000,
	minMonthlyTakeHomePay: 0,
	maxMonthlyTakeHomePay: 1000000,
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
