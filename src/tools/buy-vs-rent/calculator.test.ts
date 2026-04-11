import { describe, expect, it } from "vitest";

import {
	calculateBuyVsRent,
	calculateEmi,
	normaliseInputs,
} from "#/tools/buy-vs-rent/calculator";

describe("buy vs rent calculator", () => {
	it("calculates a standard EMI", () => {
		const emi = calculateEmi(5000000, 8.5, 20);

		expect(emi).toBeCloseTo(43391, 0);
	});

	it("keeps defaults within limits", () => {
		const inputs = normaliseInputs({
			propertyPriceLakhs: 1,
			monthlyRent: 500,
			stayYears: 50,
			annualMaintenancePct: 99,
			annualCtcLakhs: 1,
			ageYears: 90,
			salaryGrowthPct: 40,
		});

		expect(inputs.propertyPriceLakhs).toBeGreaterThanOrEqual(5);
		expect(inputs.monthlyRent).toBeGreaterThanOrEqual(1000);
		expect(inputs.stayYears).toBeLessThanOrEqual(30);
		expect(inputs.annualMaintenancePct).toBeLessThanOrEqual(8);
		expect(inputs.annualCtcLakhs).toBeGreaterThanOrEqual(3);
		expect(inputs.ageYears).toBeLessThanOrEqual(65);
		expect(inputs.salaryGrowthPct).toBeLessThanOrEqual(20);
	});

	it("favours renting when the horizon is short and investment returns are stronger", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 120,
			monthlyRent: 28000,
			stayYears: 5,
			downPaymentPct: 20,
			homeLoanRatePct: 9,
			loanTenureYears: 20,
			propertyAppreciationPct: 4,
			rentIncreasePct: 5,
			investmentReturnPct: 11,
			purchaseCostPct: 8,
			saleCostPct: 2,
		});

		expect(result.summary.verdict).toBe("rent");
		expect(result.summary.financialGap).toBeLessThan(0);
		expect(result.summary.breakEvenYear).toBeNull();
	});

	it("favours buying when the stay is long enough and appreciation is healthy", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 70,
			monthlyRent: 35000,
			stayYears: 15,
			downPaymentPct: 25,
			homeLoanRatePct: 8,
			loanTenureYears: 20,
			propertyAppreciationPct: 7.5,
			rentIncreasePct: 6,
			investmentReturnPct: 8,
			purchaseCostPct: 6,
			saleCostPct: 1.5,
		});

		expect(result.summary.verdict).toBe("buy");
		expect(result.summary.financialGap).toBeGreaterThan(0);
		expect(result.summary.breakEvenYear).not.toBeNull();
	});

	it("estimates take-home in both regimes and uses a conservative regime for stress", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 9,
			propertyAppreciationPct: 6,
			investmentReturnPct: 9.5,
			purchaseCostPct: 7,
			annualCtcLakhs: 30,
			salaryGrowthPct: 8,
		});

		expect(result.summary.monthlyTakeHomeOldRegime).not.toBeNull();
		expect(result.summary.monthlyTakeHomeNewRegime).not.toBeNull();
		expect(result.summary.monthlyTakeHomeRecommended).not.toBeNull();
		expect(result.summary.recommendedTaxRegime).not.toBeNull();

		const lowerEstimate = Math.min(
			result.summary.monthlyTakeHomeOldRegime ?? Number.POSITIVE_INFINITY,
			result.summary.monthlyTakeHomeNewRegime ?? Number.POSITIVE_INFINITY,
		);

		expect(result.summary.monthlyTakeHomeRecommended).toBeCloseTo(
			lowerEstimate,
			0,
		);
	});

	it("reduces long-horizon stress ratio when salary growth is higher", () => {
		const noGrowth = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 9,
			propertyAppreciationPct: 6,
			investmentReturnPct: 9.5,
			purchaseCostPct: 7,
			annualCtcLakhs: 20,
			salaryGrowthPct: 0,
		});

		const highGrowth = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 9,
			propertyAppreciationPct: 6,
			investmentReturnPct: 9.5,
			purchaseCostPct: 7,
			annualCtcLakhs: 20,
			salaryGrowthPct: 15,
		});

		expect(
			highGrowth.points.at(-1)?.buyStressRatio ?? Number.POSITIVE_INFINITY,
		).toBeLessThan(
			noGrowth.points.at(-1)?.buyStressRatio ?? Number.POSITIVE_INFINITY,
		);
	});

	it("classifies affordability benchmarks for stretched setups", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 260,
			monthlyRent: 45000,
			stayYears: 10,
			downPaymentPct: 15,
			homeLoanRatePct: 9.5,
			annualCtcLakhs: 20,
			ageYears: 46,
		});

		expect(result.summary.priceToIncomeBand).toBe("risky");
		expect(result.summary.affordabilityBenchmarks.length).toBeGreaterThan(0);
		expect(result.summary.emiToIncomeBand).not.toBeNull();
		expect(result.summary.ageTenureBand).toBe("risky");
	});

	it("provides benchmark signals for balanced setups", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 70,
			monthlyRent: 30000,
			stayYears: 8,
			downPaymentPct: 25,
			homeLoanRatePct: 8.5,
			annualCtcLakhs: 28,
			ageYears: 30,
			salaryGrowthPct: 8,
		});

		expect(result.summary.priceToIncomeBand).toMatch(/good|watch/);
		expect(
			result.summary.affordabilityBenchmarks.length,
		).toBeGreaterThanOrEqual(2);
	});

	it("builds year-by-year points including a current snapshot", () => {
		const result = calculateBuyVsRent({ stayYears: 3 });

		expect(result.points).toHaveLength(4);
		expect(result.points[0].label).toBe("Now");
		expect(result.points.at(-1)?.label).toBe("Year 3");
	});
});
