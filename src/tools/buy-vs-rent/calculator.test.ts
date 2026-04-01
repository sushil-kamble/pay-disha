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
		});

		expect(inputs.propertyPriceLakhs).toBeGreaterThanOrEqual(5);
		expect(inputs.monthlyRent).toBeGreaterThanOrEqual(1000);
		expect(inputs.stayYears).toBeLessThanOrEqual(30);
		expect(inputs.annualMaintenancePct).toBeLessThanOrEqual(8);
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

	it("allows tax savings to swing close calls", () => {
		const withoutTax = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 9,
			propertyAppreciationPct: 6,
			investmentReturnPct: 9.5,
			purchaseCostPct: 7,
		});

		const withTax = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 9,
			propertyAppreciationPct: 6,
			investmentReturnPct: 9.5,
			purchaseCostPct: 7,
			annualBuyTaxBenefit: 180000,
			annualRentTaxBenefit: 40000,
		});

		expect(withTax.summary.financialGap).toBeGreaterThan(
			withoutTax.summary.financialGap,
		);
		expect(withTax.summary.totalBuyTaxBenefit).toBeGreaterThan(
			withTax.summary.totalRentTaxBenefit,
		);
	});

	it("builds year-by-year points including a current snapshot", () => {
		const result = calculateBuyVsRent({ stayYears: 3 });

		expect(result.points).toHaveLength(4);
		expect(result.points[0].label).toBe("Now");
		expect(result.points.at(-1)?.label).toBe("Year 3");
	});
});
