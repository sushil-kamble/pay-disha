import { describe, expect, it } from "vitest";

import { calculateFire, calculateFireTarget } from "#/tools/fire/calculator";
import { FIRE_DEFAULTS } from "#/tools/fire/constants";

describe("fire calculator", () => {
	it("builds the FIRE target with separate healthcare inflation", () => {
		const target = calculateFireTarget(
			{
				monthlyExpenses: 30000,
				monthlyHealthcareBudget: 5000,
				inflationPct: 0,
				healthcareInflationPct: 10,
				swrPct: 4,
			},
			10,
		);

		expect(target).toBeCloseTo(11390614, 0);
	});

	it("marks FIRE as immediate when current savings already cover the target", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 40,
			monthlyExpenses: 10000,
			monthlyHealthcareBudget: 0,
			existingSavings: 4000000,
			monthlySip: 0,
			inflationPct: 0,
			healthcareInflationPct: 0,
			swrPct: 4,
		});

		expect(result.fireNumber).toBe(3000000);
		expect(result.yearsToFire).toBe(0);
		expect(result.fireAge).toBe(30);
		expect(result.baristaFireMonthlyIncome).toBe(0);
	});

	it("uses current expenses for Barista FIRE instead of inflated retirement expenses", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 28,
			targetRetirementAge: 48,
			monthlyExpenses: 50000,
			monthlyHealthcareBudget: 0,
			existingSavings: 1000000,
			monthlySip: 0,
			swrPct: 3,
			inflationPct: 10,
			healthcareInflationPct: 10,
		});

		expect(result.baristaFireMonthlyIncome).toBe(47500);
	});

	it("pushes the FIRE timeline later when inflation keeps moving the goalposts", () => {
		const lowInflation = calculateFire({
			...FIRE_DEFAULTS,
			existingSavings: 1000000,
			monthlySip: 30000,
			inflationPct: 0,
			healthcareInflationPct: 0,
			monthlyHealthcareBudget: 0,
		});

		const highInflation = calculateFire({
			...FIRE_DEFAULTS,
			existingSavings: 1000000,
			monthlySip: 30000,
			inflationPct: 8,
			healthcareInflationPct: 8,
			monthlyHealthcareBudget: 0,
		});

		expect(lowInflation.yearsToFire).not.toBeNull();
		expect(highInflation.yearsToFire).not.toBeNull();
		expect(
			(highInflation.yearsToFire ?? 0) - (lowInflation.yearsToFire ?? 0),
		).toBeGreaterThan(0);
	});

	it("builds five lever scenarios and shows SIP increases improving the timeline", () => {
		const result = calculateFire(FIRE_DEFAULTS);
		const increaseSip = result.leverScenarios.find(
			(scenario) => scenario.id === "increase-sip",
		);

		expect(result.leverScenarios).toHaveLength(5);
		expect(increaseSip).toBeDefined();
		expect(increaseSip?.newYearsToFire).not.toBeNull();
		expect(increaseSip?.yearsSaved ?? 0).toBeGreaterThan(0);
	});

	it("includes a current snapshot and extends the table past retirement age", () => {
		const result = calculateFire(FIRE_DEFAULTS);

		expect(result.projectionPoints[0]).toMatchObject({
			year: 0,
			age: FIRE_DEFAULTS.currentAge,
		});
		expect(result.projectionPoints.at(-1)?.age).toBe(
			FIRE_DEFAULTS.targetRetirementAge + 5,
		);
	});
});
