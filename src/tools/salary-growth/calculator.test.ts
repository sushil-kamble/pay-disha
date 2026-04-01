import { describe, expect, it } from "vitest";

import {
	buildHistoricalIntervals,
	calculateAdvancedProjection,
	calculateSimpleProjection,
} from "#/tools/salary-growth/calculator";

describe("salary growth calculator", () => {
	it("builds a simple projection with a fixed annual percentage increment", () => {
		const result = calculateSimpleProjection({
			currentSalaryLpa: 10,
			yearlyIncrementPct: 10,
			projectionYears: 3,
			inflationAdjusted: false,
			inflationRatePct: 6,
			baseYear: 2026,
		});

		expect(result.projectedSalaryLpa).toBeCloseTo(13.31, 2);
		expect(result.totalGainLpa).toBeCloseTo(3.31, 2);
		expect(result.points.map((point) => point.nominalSalaryLpa)).toEqual([
			10, 11, 12.1, 13.31,
		]);
	});

	it("calculates an inflation-adjusted simple projection", () => {
		const result = calculateSimpleProjection({
			currentSalaryLpa: 10,
			yearlyIncrementPct: 10,
			projectionYears: 3,
			inflationAdjusted: true,
			inflationRatePct: 10,
			baseYear: 2026,
		});

		expect(result.projectedRealSalaryLpa).not.toBeNull();
		expect(result.projectedRealSalaryLpa).toBeCloseTo(10, 2);
		expect(result.realGainLpa).toBeCloseTo(0, 2);
	});

	it("computes historical annualized growth for sequential years", () => {
		const intervals = buildHistoricalIntervals([
			{ year: 2022, salaryLpa: 10 },
			{ year: 2023, salaryLpa: 12 },
			{ year: 2024, salaryLpa: 18 },
		]);

		expect(intervals).toHaveLength(2);
		expect(intervals[0].annualizedGrowthPct).toBe(20);
		expect(intervals[1].annualizedGrowthPct).toBe(50);
	});

	it("computes annualized growth across non-sequential years", () => {
		const intervals = buildHistoricalIntervals([
			{ year: 2022, salaryLpa: 10 },
			{ year: 2024, salaryLpa: 14.4 },
		]);

		expect(intervals).toHaveLength(1);
		expect(intervals[0].annualizedGrowthPct).toBeCloseTo(20, 2);
	});

	it("projects advanced salary growth with same-company raises only", () => {
		const result = calculateAdvancedProjection({
			history: [{ year: 2024, salaryLpa: 10 }],
			annualIncrementPct: 10,
			switchEveryYears: 15,
			switchHikePct: 30,
			projectionYears: 3,
			inflationAdjusted: false,
			inflationRatePct: 6,
			overrides: [],
		});

		expect(result.validationErrors).toEqual([]);
		expect(result.points.at(-1)?.nominalSalaryLpa).toBeCloseTo(13.31, 2);
		expect(
			result.points.slice(1).every((point) => point.eventType === "increment"),
		).toBe(true);
	});

	it("applies switch cadence without stacking the annual increment in the switch year", () => {
		const result = calculateAdvancedProjection({
			history: [{ year: 2024, salaryLpa: 10 }],
			annualIncrementPct: 10,
			switchEveryYears: 2,
			switchHikePct: 50,
			projectionYears: 4,
			inflationAdjusted: false,
			inflationRatePct: 6,
			overrides: [],
		});

		const switchYears = result.points
			.filter((point) => point.eventType === "switch")
			.map((point) => point.year);

		expect(switchYears).toEqual([2026, 2028]);
		expect(result.points.at(-1)?.nominalSalaryLpa).toBeCloseTo(27.22, 2);
	});

	it("gives future overrides precedence and resets the switch cycle from that year", () => {
		const result = calculateAdvancedProjection({
			history: [{ year: 2024, salaryLpa: 10 }],
			annualIncrementPct: 10,
			switchEveryYears: 2,
			switchHikePct: 50,
			projectionYears: 4,
			inflationAdjusted: false,
			inflationRatePct: 6,
			overrides: [{ year: 2026, salaryLpa: 20 }],
		});

		const overrideYear = result.points.find((point) => point.year === 2026);
		const switchYear = result.points.find((point) => point.year === 2028);

		expect(overrideYear?.eventType).toBe("override");
		expect(overrideYear?.nominalSalaryLpa).toBe(20);
		expect(switchYear?.eventType).toBe("switch");
		expect(switchYear?.nominalSalaryLpa).toBe(33);
	});

	it("detects salary milestones on the simple path", () => {
		const result = calculateSimpleProjection({
			currentSalaryLpa: 20,
			yearlyIncrementPct: 30,
			projectionYears: 4,
			inflationAdjusted: false,
			inflationRatePct: 6,
			baseYear: 2026,
		});

		expect(result.firstMilestoneLabel).toBe("25L");
		expect(result.firstMilestoneYear).toBe(2027);
		expect(result.points.some((point) => point.milestoneLabel === "50L")).toBe(
			true,
		);
	});

	it("produces a stay-only comparison alongside the projected path", () => {
		const result = calculateAdvancedProjection({
			history: [{ year: 2024, salaryLpa: 10 }],
			annualIncrementPct: 10,
			switchEveryYears: 2,
			switchHikePct: 50,
			projectionYears: 4,
			inflationAdjusted: false,
			inflationRatePct: 6,
			overrides: [],
		});

		expect(result.points.at(-1)?.staySalaryLpa).toBeCloseTo(14.64, 2);
		expect(result.report?.switchVsStayDeltaLpa).toBeCloseTo(12.58, 2);
	});
});
