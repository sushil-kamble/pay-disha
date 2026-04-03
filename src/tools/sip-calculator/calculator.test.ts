import { describe, expect, it } from "vitest";

import {
	calculateSipPlan,
	inflateAmount,
	toEffectiveMonthlyRate,
} from "#/tools/sip-calculator/calculator";
import { getSipDefaults } from "#/tools/sip-calculator/constants";

describe("sip calculator", () => {
	it("matches the standard SIP future value for zero step-up and zero starting corpus", () => {
		const inputs = {
			...getSipDefaults(2026),
			targetAmountToday: 5000000,
			yearsToGoal: 10,
			monthlySip: 10000,
			startingCorpus: 0,
			annualStepUpPct: 0,
			expectedReturnPct: 12,
			goalInflationPct: 0,
			realValueInflationPct: 0,
		};
		const result = calculateSipPlan(inputs);
		const monthlyRate = toEffectiveMonthlyRate(12);
		const months = inputs.yearsToGoal * 12;
		const expectedFutureValue =
			inputs.monthlySip * (((1 + monthlyRate) ** months - 1) / monthlyRate);

		expect(result.projectedCorpusAtTarget).toBeCloseTo(expectedFutureValue, -3);
	});

	it("inflates the goal cost based on the selected target inflation", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 2000000,
			yearsToGoal: 12,
			monthlySip: 0,
			expectedReturnPct: 0,
			goalInflationPct: 10,
		});

		expect(result.goalAmountAtTarget).toBeCloseTo(
			inflateAmount(2000000, 10, 12),
			0,
		);
	});

	it("solves the required monthly SIP and annual step-up for off-track plans", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 10000000,
			yearsToGoal: 10,
			monthlySip: 15000,
			startingCorpus: 0,
			annualStepUpPct: 0,
			expectedReturnPct: 12,
			goalInflationPct: 0,
		});

		expect(result.requiredMonthlySip).not.toBeNull();
		expect((result.requiredMonthlySip ?? 0) > 15000).toBe(true);
		expect(result.requiredAnnualStepUpPct).not.toBeNull();
		expect((result.requiredAnnualStepUpPct ?? 0) > 0).toBe(true);
	});

	it("shows extra years when the goal is missed at the chosen horizon", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 15000000,
			yearsToGoal: 10,
			monthlySip: 10000,
			startingCorpus: 0,
			goalInflationPct: 0,
		});

		expect(result.isOnTrack).toBe(false);
		expect(result.extraYearsNeeded).not.toBeNull();
		expect((result.extraYearsNeeded ?? 0) > 0).toBe(true);
	});

	it("builds delay costs for one, three, and five years", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 10000000,
			yearsToGoal: 15,
			monthlySip: 15000,
			startingCorpus: 0,
			goalInflationPct: 0,
		});

		expect(result.delayCosts.map((delay) => delay.delayYears)).toEqual([
			1, 3, 5,
		]);
		expect(result.delayCosts[0]?.requiredMonthlySip).not.toBeNull();
		expect((result.delayCosts[0]?.additionalMonthlySip ?? 0) > 0).toBe(true);
	});

	it("converts the target-year corpus into today's purchasing power", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 5000000,
			yearsToGoal: 10,
			monthlySip: 10000,
			startingCorpus: 0,
			expectedReturnPct: 12,
			realValueInflationPct: 6,
			goalInflationPct: 0,
		});

		expect(result.realCorpusAtTarget).toBeLessThan(
			result.projectedCorpusAtTarget,
		);
	});

	it("surfaces lever scenarios, milestone hits, and fixed sensitivity bands", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 10000000,
			yearsToGoal: 15,
			monthlySip: 25000,
			startingCorpus: 100000,
			goalInflationPct: 0,
		});

		expect(result.leverScenarios).toHaveLength(4);
		expect(result.milestoneHits).toHaveLength(5);
		expect(result.scenarioBands.map((band) => band.annualReturnPct)).toEqual([
			10, 12, 14,
		]);
	});

	it("handles already-funded goals without requiring more SIP", () => {
		const result = calculateSipPlan({
			...getSipDefaults(2026),
			targetAmountToday: 3000000,
			yearsToGoal: 8,
			monthlySip: 0,
			startingCorpus: 5000000,
			expectedReturnPct: 10,
			goalInflationPct: 0,
		});

		expect(result.isOnTrack).toBe(true);
		expect(result.requiredMonthlySip).toBe(0);
		expect(result.yearsToTarget).toBe(0);
	});
});
