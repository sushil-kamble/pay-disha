import { describe, expect, it } from "vitest";

import {
	applyFitAndBlendedScores,
	buildTopInsights,
	computeFinanceScores,
	qualitativeScore,
} from "./scoring";
import { createTestOffer } from "./test-helpers";
import type { OfferComputed } from "./types";

function createComputedOffer(
	overrides: Partial<OfferComputed> = {},
): OfferComputed {
	const offer = overrides.offer ?? createTestOffer();

	return {
		offer,
		annualGuaranteedCash: 0,
		expectedVariableAnnualCash: 0,
		firstYearEquityValue: 0,
		annualEmployerRetirement: 0,
		annualExpenses: 0,
		annualBenefitValue: 0,
		firstYearOneTimeUpside: 0,
		firstYearRiskDeductions: 0,
		monthlyTakeHome: 0,
		firstYearRealizedValue: 0,
		steadyStateAnnualValue: 0,
		value24Months: 0,
		value36Months: 0,
		downside12Months: 0,
		upside36Months: 0,
		riskAdjustedValue: 0,
		financeScore: 0,
		fitScore: 0,
		blendedScore: 0,
		insights: [],
		projection: [
			{ year: 1, value: 0 },
			{ year: 2, value: 0 },
			{ year: 3, value: 0 },
		],
		...overrides,
	};
}

describe("job offer comparator scoring", () => {
	it("maps qualitative inputs to a bounded 0-100 score", () => {
		expect(
			qualitativeScore({
				roleExcitement: 5,
				managerConfidence: 5,
				workLifeSustainability: 5,
				growthConfidence: 5,
				brandValue: 5,
				jobSecurity: 5,
			}),
		).toBe(100);

		expect(
			qualitativeScore({
				roleExcitement: 1,
				managerConfidence: 2,
				workLifeSustainability: 3,
				growthConfidence: 4,
				brandValue: 5,
				jobSecurity: 3,
			}),
		).toBe(60);
	});

	it("normalizes finance scores across a spread and gives tied offers full marks", () => {
		const scored = computeFinanceScores([
			createComputedOffer({ riskAdjustedValue: 1000000 }),
			createComputedOffer({ riskAdjustedValue: 2000000 }),
			createComputedOffer({ riskAdjustedValue: 3000000 }),
		]);

		expect(scored.map((offer) => offer.financeScore)).toEqual([0, 50, 100]);

		const tied = computeFinanceScores([
			createComputedOffer({ riskAdjustedValue: 1500000 }),
			createComputedOffer({ riskAdjustedValue: 1500000 }),
		]);

		expect(tied.every((offer) => offer.financeScore === 100)).toBe(true);
	});

	it("uses finance-only mode or normalized fit weighting as configured", () => {
		const financeOnly = applyFitAndBlendedScores(
			[
				createComputedOffer({
					financeScore: 82,
					offer: createTestOffer({
						qualitative: {
							roleExcitement: 1,
							managerConfidence: 1,
							workLifeSustainability: 1,
							growthConfidence: 1,
							brandValue: 1,
							jobSecurity: 1,
						},
					}),
				}),
			],
			false,
			75,
			25,
		);

		expect(financeOnly[0]?.blendedScore).toBe(82);

		const weighted = applyFitAndBlendedScores(
			[
				createComputedOffer({
					financeScore: 80,
					offer: createTestOffer({
						qualitative: {
							roleExcitement: 5,
							managerConfidence: 5,
							workLifeSustainability: 4,
							growthConfidence: 4,
							brandValue: 4,
							jobSecurity: 4,
						},
					}),
				}),
			],
			true,
			80,
			40,
		);

		expect(weighted[0]?.fitScore).toBeCloseTo(86.6667, 3);
		expect(weighted[0]?.blendedScore).toBeCloseTo(82.2222, 3);
	});

	it("builds insights for risk, equity cliffs, work costs, promotion, and flat profiles", () => {
		const offer = createTestOffer({
			variableAnnualTarget: 250000,
			expectedBonusPayoutPct: 70,
			equityType: "rsu",
			equityCliffMonths: 12,
			expectedPromotionMonths: 18,
			joiningBonus: 150000,
			relocationSupportOneTime: 50000,
			expensesMonthly: 11000,
		});

		const insights = buildTopInsights(
			offer,
			createComputedOffer({ offer, annualExpenses: 132000 }),
		);

		expect(insights).toEqual([
			"Variable payout confidence is low, so downside protection matters.",
			"Equity has a 12-month cliff. Early exits reduce realized upside.",
			"Role-related expenses are materially reducing effective value.",
			"Promotion timeline is relatively near-term and can shift 24-36 month value.",
			"Year-1 value is boosted by one-time payouts, so compare steady-state too.",
		]);

		expect(
			buildTopInsights(
				createTestOffer(),
				createComputedOffer({ annualExpenses: 0 }),
			),
		).toEqual([
			"This offer profile is balanced with low assumption sensitivity.",
		]);
	});
});
