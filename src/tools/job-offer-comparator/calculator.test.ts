import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/tools/inhand-salary/calculator", () => ({
	calculate: vi.fn(),
}));

import { calculate as calculateInHand } from "#/tools/inhand-salary/calculator";
import type { CalculationResult } from "#/tools/inhand-salary/types";
import { compareOffers } from "./calculator";
import {
	createTestConfig,
	createTestOffer,
	type OfferOverrides,
} from "./test-helpers";

const mockedCalculateInHand = vi.mocked(calculateInHand);

function buildTaxResult(
	ctcLakhs: number,
	pfMonthly: number,
): CalculationResult {
	const grossIncome = ctcLakhs * 100000;
	const totalPF = pfMonthly * 24;
	const inHandYearly = grossIncome - totalPF;

	return {
		grossIncome,
		standardDeduction: 0,
		taxableIncomeBeforeExemptions: grossIncome,
		exemptionsApplied: 0,
		taxableIncome: grossIncome,
		baseTax: 0,
		rebateApplied: false,
		rebateAmount: 0,
		taxAfterRebate: 0,
		surchargeRate: 0,
		surcharge: 0,
		marginalRelief: 0,
		educationCess: 0,
		professionalTax: 0,
		totalTax: 0,
		taxMonthly: 0,
		pfEmployeeYearly: pfMonthly * 12,
		pfEmployerYearly: pfMonthly * 12,
		totalPF,
		inHandYearly,
		inHandMonthly: inHandYearly / 12,
		slabs: [],
	};
}

function buildComparison(
	primary: OfferOverrides = {},
	secondary: OfferOverrides = {},
	scenario: "conservative" | "expected" | "upside" = "expected",
) {
	const offerA = createTestOffer({
		id: "offer-a",
		label: "Offer A",
		companyName: "Offer A Co",
		...primary,
	});
	const offerB = createTestOffer({
		id: "offer-b",
		label: "Offer B",
		companyName: "Offer B Co",
		...secondary,
	});

	const result = compareOffers(
		[offerA, offerB],
		createTestConfig({ scenario, includeQualitativeFit: false }),
	);

	return {
		offerA,
		offerB,
		result,
		computedA: result.offers.find((offer) => offer.offer.id === offerA.id),
		computedB: result.offers.find((offer) => offer.offer.id === offerB.id),
	};
}

describe("job offer comparator calculator", () => {
	beforeEach(() => {
		mockedCalculateInHand.mockReset();
		mockedCalculateInHand.mockImplementation(
			(ctcLakhs: number, pfMonthly: number, _regime, _expectedExemptions) => ({
				...buildTaxResult(ctcLakhs, pfMonthly),
			}),
		);
	});

	it("adds enabled benefits, subtracts work costs, and applies one-time items only in year one", () => {
		const { computedA } = buildComparison({
			fixedAnnualCash: 1200000,
			joiningBonus: 100000,
			retentionBonus: 50000,
			relocationSupportOneTime: 25000,
			noticeBuyoutRisk: 20000,
			clawbackRisk: 30000,
			expensesMonthly: 2000,
			benefits: {
				healthSelf: { enabled: true, monthlyValue: 1000 },
				meal: { enabled: true, monthlyValue: 500 },
				internet: { enabled: false, monthlyValue: 9000 },
			},
		});

		expect(computedA).toBeDefined();
		expect(computedA?.annualBenefitValue).toBe(18000);
		expect(computedA?.annualExpenses).toBe(24000);
		expect(computedA?.firstYearOneTimeUpside).toBe(175000);
		expect(computedA?.firstYearRiskDeductions).toBe(-50000);
		expect(computedA?.monthlyTakeHome).toBe(100000);
		expect(computedA?.firstYearRealizedValue).toBe(1319000);
		expect(computedA?.projection.map((point) => point.value)).toEqual([
			1319000, 1194000, 1194000,
		]);
		expect(computedA?.value24Months).toBe(2513000);
		expect(computedA?.value36Months).toBe(3707000);
		expect(computedA?.steadyStateAnnualValue).toBe(1194000);
	});

	it("models partial first-year increments and later promotion uplift", () => {
		const { computedA } = buildComparison({
			fixedAnnualCash: 1200000,
			expectedAnnualIncrementPct: 12,
			nextIncrementMonth: 7,
			expectedPromotionMonths: 13,
			promotionUpliftPct: 10,
		});

		const yearOne = 1200000 * 1.12 ** 0.5;
		const yearTwo = 1200000 * 1.12 ** 1.5 * 1.1;
		const yearThree = 1200000 * 1.12 ** 2.5 * 1.1;

		expect(computedA?.projection[0]?.value).toBeCloseTo(yearOne, 4);
		expect(computedA?.projection[1]?.value).toBeCloseTo(yearTwo, 4);
		expect(computedA?.projection[2]?.value).toBeCloseTo(yearThree, 4);
		expect(computedA?.annualGuaranteedCash).toBeCloseTo(yearOne, 4);
		expect(computedA?.value24Months).toBeCloseTo(yearOne + yearTwo, 4);
		expect(computedA?.value36Months).toBeCloseTo(
			yearOne + yearTwo + yearThree,
			4,
		);
		expect(computedA?.steadyStateAnnualValue).toBeCloseTo(yearThree, 4);
	});

	it("applies scenario multipliers and risk-adjusted weighting", () => {
		const primary = {
			fixedAnnualCash: 1000000,
			variableAnnualTarget: 200000,
			equityType: "rsu" as const,
			equityAnnualizedValue: 100000,
			expectedBonusPayoutPct: 100,
		};

		const expected = buildComparison(primary, {}, "expected").computedA;
		const conservative = buildComparison(primary, {}, "conservative").computedA;
		const upside = buildComparison(primary, {}, "upside").computedA;

		expect(expected).toBeDefined();
		expect(conservative).toBeDefined();
		expect(upside).toBeDefined();

		expect(conservative?.expectedVariableAnnualCash).toBe(144000);
		expect(expected?.expectedVariableAnnualCash).toBe(200000);
		expect(upside?.expectedVariableAnnualCash).toBeCloseTo(230000, 4);
		expect(conservative?.value36Months ?? 0).toBeLessThan(
			expected?.value36Months ?? 0,
		);
		expect(expected?.value36Months ?? 0).toBeLessThan(
			upside?.value36Months ?? 0,
		);

		const riskAdjusted =
			(expected?.value36Months ?? 0) * 0.6 +
			(conservative?.value36Months ?? 0) * 0.3 +
			(upside?.value36Months ?? 0) * 0.1;

		expect(expected?.riskAdjustedValue).toBeCloseTo(riskAdjusted, 4);
	});

	it("supports different winners by cash-now and long-term value while keeping chart rows aligned", () => {
		const { result, computedA, computedB } = buildComparison(
			{
				fixedAnnualCash: 1500000,
				expectedAnnualIncrementPct: 0,
				promotionUpliftPct: 0,
			},
			{
				fixedAnnualCash: 1200000,
				expectedAnnualIncrementPct: 25,
				expectedPromotionMonths: 24,
				promotionUpliftPct: 40,
			},
		);

		expect(computedA).toBeDefined();
		expect(computedB).toBeDefined();
		expect(result.winners.bestCashNow.offerId).toBe("offer-a");
		expect(result.winners.bestLongTerm.offerId).toBe("offer-b");
		expect(result.chartRows).toHaveLength(3);
		expect(result.chartRows[0]?.["offer-a"]).toBeCloseTo(
			computedA?.projection[0]?.value ?? 0,
			4,
		);
		expect(result.chartRows[2]?.["offer-b"]).toBeCloseTo(
			computedB?.projection[2]?.value ?? 0,
			4,
		);
	});

	it("handles equity type and cliff rules across offers", () => {
		const result = compareOffers(
			[
				createTestOffer({
					id: "offer-rsu",
					label: "RSU Offer",
					equityType: "rsu",
					equityAnnualizedValue: 120000,
					equityCliffMonths: 24,
				}),
				createTestOffer({
					id: "offer-esop",
					label: "ESOP Offer",
					equityType: "esop",
					equityAnnualizedValue: 120000,
					equityCliffMonths: 0,
				}),
				createTestOffer({
					id: "offer-none",
					label: "No Equity Offer",
					equityType: "none",
					equityAnnualizedValue: 120000,
					equityCliffMonths: 24,
				}),
			],
			createTestConfig({ includeQualitativeFit: false }),
		);

		const rsu = result.offers.find((offer) => offer.offer.id === "offer-rsu");
		const esop = result.offers.find((offer) => offer.offer.id === "offer-esop");
		const noEquity = result.offers.find(
			(offer) => offer.offer.id === "offer-none",
		);

		expect(rsu?.projection.map((point) => point.value)).toEqual([
			1200000, 1320000, 1320000,
		]);
		expect(esop?.projection.map((point) => point.value)).toEqual([
			1284000, 1284000, 1284000,
		]);
		expect(noEquity?.projection.map((point) => point.value)).toEqual([
			1200000, 1200000, 1200000,
		]);
		expect(esop?.projection[0]?.value).toBeGreaterThan(
			rsu?.projection[0]?.value ?? 0,
		);
		expect(rsu?.projection[2]?.value).toBeGreaterThan(
			esop?.projection[2]?.value ?? 0,
		);
	});

	it("clamps negative yearly realized values to zero", () => {
		const { computedA } = buildComparison({
			fixedAnnualCash: 0,
			expensesMonthly: 150000,
		});

		expect(computedA?.projection.map((point) => point.value)).toEqual([
			0, 0, 0,
		]);
		expect(computedA?.value36Months).toBe(0);
	});

	it("returns finite values when fixed cash is zero and variable pay is present", () => {
		const { computedA } = buildComparison({
			fixedAnnualCash: 0,
			variableAnnualTarget: 300000,
			expectedBonusPayoutPct: 100,
		});

		expect(computedA?.expectedVariableAnnualCash).toBe(300000);
		expect(Number.isFinite(computedA?.monthlyTakeHome ?? Number.NaN)).toBe(
			true,
		);
		expect(Number.isFinite(computedA?.value36Months ?? Number.NaN)).toBe(true);
	});

	it("falls back to a 72 percent in-hand estimate when the tax calculator returns null", () => {
		mockedCalculateInHand.mockImplementationOnce(() => null);

		const { computedA } = buildComparison({
			fixedAnnualCash: 1200000,
			joiningBonus: 0,
		});

		expect(computedA?.monthlyTakeHome).toBe(72000);
		expect(computedA?.firstYearRealizedValue).toBe(864000);
	});
});
