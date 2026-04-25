import { describe, expect, it } from "vitest";

import { calculateFire, calculateFireTarget } from "#/tools/fire/calculator";
import { FIRE_DEFAULTS, FIRE_MARKET_ASSUMPTIONS } from "#/tools/fire/constants";

describe("fire calculator", () => {
	it("builds the FIRE target from the configured corpus multiple", () => {
		const target = calculateFireTarget(
			{
				monthlyExpenses: 30000,
				inflationPct: 0,
			},
			10,
		);

		expect(target).toBe(30000 * 12 * FIRE_MARKET_ASSUMPTIONS.corpusMultiple);
	});

	it("marks FIRE as immediate when current savings already cover the target", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 40,
			monthlyExpenses: 10000,
			existingSavings: 4000000,
			monthlySip: 0,
			inflationPct: 0,
		});

		expect(result.fireNumber).toBe(3960000);
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
			existingSavings: 1000000,
			monthlySip: 0,
			inflationPct: 10,
		});

		expect(result.baristaFireMonthlyIncome).toBe(47475);
	});

	it("pushes the FIRE timeline later when inflation keeps moving the goalposts", () => {
		const lowInflation = calculateFire({
			...FIRE_DEFAULTS,
			existingSavings: 1000000,
			monthlySip: 30000,
			inflationPct: 0,
		});

		const highInflation = calculateFire({
			...FIRE_DEFAULTS,
			existingSavings: 1000000,
			monthlySip: 30000,
			inflationPct: 8,
		});

		expect(lowInflation.yearsToFire).not.toBeNull();
		expect(highInflation.yearsToFire).not.toBeNull();
		expect(
			(highInflation.yearsToFire ?? 0) - (lowInflation.yearsToFire ?? 0),
		).toBeGreaterThan(0);
	});

	it("inflates the FIRE number to the target retirement age", () => {
		const retireAt40 = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 40,
			monthlyExpenses: 50000,
			inflationPct: 6,
		});
		const retireAt50 = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 50,
			monthlyExpenses: 50000,
			inflationPct: 6,
		});

		expect(retireAt40.fireNumber).toBe(35458784);
		expect(retireAt50.fireNumber).toBe(63501282);
	});

	it("matches an inflated FIRE number for common India calculator inputs", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 26,
			targetRetirementAge: 45,
			monthlyExpenses: 40000,
			inflationPct: 6,
		});

		expect(result.fireNumber).toBe(47925496);
		expect(result.leanFireNumber).toBe(33547847);
		expect(result.comfortFireNumber).toBe(67095695);
	});

	it("uses the entered annual return as CAGR instead of over-compounding monthly", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 31,
			monthlyExpenses: 10000,
			existingSavings: 120000,
			monthlySip: 0,
			expectedReturnPct: 12,
			inflationPct: 0,
		});

		expect(result.projectedCorpusAtRetirement).toBe(134400);
	});

	it("applies annual SIP step-up after each completed year", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 33,
			monthlyExpenses: 10000,
			existingSavings: 0,
			monthlySip: 10000,
			annualSipStepUpPct: 10,
			expectedReturnPct: 0,
			inflationPct: 0,
		});

		expect(result.projectionPoints[1]?.corpus).toBe(120000);
		expect(result.projectionPoints[2]?.corpus).toBe(252000);
		expect(result.projectionPoints[3]?.corpus).toBe(397200);
		expect(result.projectionPoints[1]?.totalInvestment).toBe(120000);
		expect(result.projectionPoints[2]?.totalInvestment).toBe(252000);
		expect(result.projectionPoints[3]?.totalInvestment).toBe(397200);
		expect(result.projectedCorpusAtRetirement).toBe(397200);
	});

	it("keeps projection table money values in nominal future terms", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 32,
			monthlyExpenses: 10000,
			existingSavings: 0,
			monthlySip: 12000,
			annualSipStepUpPct: 0,
			expectedReturnPct: 0,
			inflationPct: 20,
		});

		expect(result.projectionPoints[1]?.corpus).toBe(144000);
		expect(result.projectionPoints[1]?.totalInvestment).toBe(144000);
		expect(result.projectionPoints[1]?.annualExpenses).toBe(144000);
		expect(result.projectionPoints[2]?.corpus).toBe(288000);
		expect(result.projectionPoints[2]?.annualExpenses).toBe(172800);
	});

	it("includes lean, regular, and comfort FIRE targets in projection points", () => {
		const result = calculateFire({
			...FIRE_DEFAULTS,
			currentAge: 30,
			targetRetirementAge: 31,
			monthlyExpenses: 10000,
			inflationPct: 0,
		});

		expect(result.projectionPoints[0]).toMatchObject({
			leanFireTarget: 2772000,
			fireTarget: 3960000,
			comfortFireTarget: 5544000,
		});
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
		expect(
			result.leverScenarios.some((scenario) => scenario.id === "step-up-sip"),
		).toBe(true);
		expect(
			result.leverScenarios.some((scenario) => scenario.id === "retire-later"),
		).toBe(false);
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
