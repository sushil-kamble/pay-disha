import { describe, expect, it } from "vitest";

import {
	calculateBuyVsRent,
	calculateEmi,
	formatCurrency,
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
			annualCtcLakhs: 1,
			ageYears: 90,
			salaryGrowthPct: 40,
		});

		expect(inputs.propertyPriceLakhs).toBeGreaterThanOrEqual(5);
		expect(inputs.monthlyRent).toBeGreaterThanOrEqual(1000);
		expect(inputs.stayYears).toBeLessThanOrEqual(30);
		expect(inputs.annualCtcLakhs).toBeGreaterThanOrEqual(3);
		expect(inputs.ageYears).toBeLessThanOrEqual(65);
		expect(inputs.salaryGrowthPct).toBeLessThanOrEqual(20);
	});

	it("favours renting when the horizon is short", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 120,
			monthlyRent: 28000,
			stayYears: 5,
			downPaymentLakhs: 24,
			homeLoanRatePct: 9,
			loanTenureYears: 20,
			cityTier: "tier-1",
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
			downPaymentLakhs: 17.5,
			homeLoanRatePct: 8,
			loanTenureYears: 20,
			cityTier: "tier-2",
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
			annualCtcLakhs: 20,
			salaryGrowthPct: 0,
		});

		const highGrowth = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 9,
			annualCtcLakhs: 20,
			salaryGrowthPct: 15,
		});

		expect(
			highGrowth.points.at(-1)?.buyStressRatio ?? Number.POSITIVE_INFINITY,
		).toBeLessThan(
			noGrowth.points.at(-1)?.buyStressRatio ?? Number.POSITIVE_INFINITY,
		);
		expect(
			highGrowth.summary.finalYearBuyStressRatio ?? Number.POSITIVE_INFINITY,
		).toBeLessThan(
			noGrowth.summary.finalYearBuyStressRatio ?? Number.POSITIVE_INFINITY,
		);
		expect(
			highGrowth.summary.finalYearMonthlyTakeHomeRecommended ?? 0,
		).toBeGreaterThan(
			noGrowth.summary.finalYearMonthlyTakeHomeRecommended ?? 0,
		);
	});

	it("classifies affordability benchmarks for stretched setups", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 260,
			monthlyRent: 45000,
			stayYears: 10,
			downPaymentLakhs: 39,
			homeLoanRatePct: 9.5,
			annualCtcLakhs: 20,
			ageYears: 46,
		});

		expect(result.summary.priceToIncomeBand).toBe("risky");
		expect(result.summary.affordabilityBenchmarks.length).toBeGreaterThan(0);
		expect(result.summary.emiToIncomeBand).not.toBeNull();
		expect(result.summary.ageTenureBand).toBe("watch");
	});

	it("provides benchmark signals for balanced setups", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 70,
			monthlyRent: 30000,
			stayYears: 8,
			downPaymentLakhs: 17.5,
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

	it("caps down payment at the property price", () => {
		const inputs = normaliseInputs({
			propertyPriceLakhs: 80,
			downPaymentLakhs: 120,
		});

		expect(inputs.downPaymentLakhs).toBe(80);
	});

	it("uses city tier to adjust rent friction and carrying costs", () => {
		const tierOne = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 8,
			cityTier: "tier-1",
		});
		const tierThree = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 8,
			cityTier: "tier-3",
		});

		expect(tierOne.summary.upfrontRentCash).toBeGreaterThan(
			tierThree.summary.upfrontRentCash,
		);
		expect(tierOne.summary.firstYearBuyMonthlyOutgo).toBeGreaterThan(
			tierThree.summary.firstYearBuyMonthlyOutgo,
		);
		expect(tierOne.summary.finalYearRentMonthlyOutgo).toBeGreaterThan(
			tierThree.summary.finalYearRentMonthlyOutgo,
		);
	});

	it("gives tier 2 cities a modest housing growth edge over tier 3", () => {
		const tierTwo = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 10,
			cityTier: "tier-2",
		});
		const tierThree = calculateBuyVsRent({
			propertyPriceLakhs: 85,
			monthlyRent: 30000,
			stayYears: 10,
			cityTier: "tier-3",
		});

		expect(tierTwo.summary.finalHomeEquity).toBeGreaterThan(
			tierThree.summary.finalHomeEquity,
		);
	});

	it("keeps buyer ending value aligned with the actual wealth verdict", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 30,
			monthlyRent: 20000,
			stayYears: 8,
			downPaymentLakhs: 20,
			loanTenureYears: 15,
			cityTier: "tier-1",
		});

		expect(result.summary.verdict).toBe("buy");
		expect(result.summary.buyNetWorth).toBeGreaterThan(
			result.summary.rentNetWorth,
		);
		expect(result.summary.finalBuyInvestmentCorpus).toBeGreaterThan(0);
		expect(result.summary.buyNetWorth).toBeCloseTo(
			result.summary.finalHomeEquity + result.summary.finalBuyInvestmentCorpus,
			0,
		);
	});

	it("shows negative equity when sale proceeds would not clear the loan", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 100,
			downPaymentLakhs: 0,
			stayYears: 1,
			cityTier: "tier-3",
		});

		expect(result.points[0].buyHomeEquity).toBeLessThan(0);
		expect(result.points[0].buyNetWorth).toBeLessThan(0);
	});

	it("does not apply the age-repayment benchmark to full-cash purchases", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 50,
			downPaymentLakhs: 50,
			stayYears: 5,
			loanTenureYears: 20,
			ageYears: 45,
		});

		expect(result.summary.ageTenureBand).toBeNull();
		expect(
			result.summary.affordabilityBenchmarks.some((benchmark) =>
				benchmark.label.includes("Age and repayment"),
			),
		).toBe(false);
	});

	it("keeps tier 1 at least as buy-friendly as tier 2 for the same home and rent inputs", () => {
		const sharedInputs = {
			propertyPriceLakhs: 90,
			monthlyRent: 30000,
			stayYears: 8,
			downPaymentLakhs: 18,
			homeLoanRatePct: 8.75,
			loanTenureYears: 20,
			annualCtcLakhs: 18,
			ageYears: 30,
			salaryGrowthPct: 8,
		};
		const tierOne = calculateBuyVsRent({
			...sharedInputs,
			cityTier: "tier-1",
		});
		const tierTwo = calculateBuyVsRent({
			...sharedInputs,
			cityTier: "tier-2",
		});
		const tierThree = calculateBuyVsRent({
			...sharedInputs,
			cityTier: "tier-3",
		});

		expect(tierOne.summary.financialGap).toBeGreaterThan(
			tierTwo.summary.financialGap,
		);
		expect(tierTwo.summary.financialGap).toBeGreaterThan(
			tierThree.summary.financialGap,
		);
	});

	it("reports a later break-even year even when the selected horizon still favors renting", () => {
		const result = calculateBuyVsRent({
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
		});

		expect(result.summary.verdict).toBe("rent");
		expect(result.summary.breakEvenYear).not.toBeNull();
		expect(result.summary.breakEvenYear).toBeGreaterThan(
			result.summary.horizonYears,
		);
	});

	it("keeps the upfront ask insight aligned with the upfront difference", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 120,
			monthlyRent: 45000,
			stayYears: 20,
			downPaymentLakhs: 24,
			homeLoanRatePct: 8.5,
			loanTenureYears: 20,
			cityTier: "tier-1",
		});

		const upfrontAskInsight = result.summary.insights.find(
			(insight) => insight.title === "Upfront ask",
		);

		expect(upfrontAskInsight).toBeDefined();
		expect(upfrontAskInsight?.value).toBe(
			formatCurrency(Math.abs(result.summary.upfrontGap)),
		);
		expect(upfrontAskInsight?.description).toContain(
			formatCurrency(result.summary.upfrontBuyCash),
		);
		expect(upfrontAskInsight?.description).toContain(
			formatCurrency(result.summary.upfrontRentCash),
		);
	});
});
