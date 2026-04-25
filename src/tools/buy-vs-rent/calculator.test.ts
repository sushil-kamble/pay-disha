import { describe, expect, it } from "vitest";

import {
	calculateBuyVsRent,
	calculateEmi,
	normaliseInputs,
} from "#/tools/buy-vs-rent/calculator";
import { BUY_VS_RENT_LIMITS } from "#/tools/buy-vs-rent/constants";

describe("buy vs rent calculator", () => {
	it("calculates a standard EMI", () => {
		const emi = calculateEmi(5000000, 8.5, 20);

		expect(emi).toBeCloseTo(43391, 0);
	});

	it("keeps quick inputs within limits", () => {
		const inputs = normaliseInputs({
			propertyPriceLakhs: 1,
			monthlyRent: 500,
			stayYears: 50,
			monthlyTakeHome: 100,
			availableCashLakhs: 9000,
			loanRatePct: 80,
			loanTenureYears: 80,
		});

		expect(inputs.propertyPriceLakhs).toBe(
			BUY_VS_RENT_LIMITS.minPropertyPriceLakhs,
		);
		expect(inputs.monthlyRent).toBe(BUY_VS_RENT_LIMITS.minMonthlyRent);
		expect(inputs.stayYears).toBe(BUY_VS_RENT_LIMITS.maxStayYears);
		expect(inputs.monthlyTakeHome).toBe(BUY_VS_RENT_LIMITS.minMonthlyTakeHome);
		expect(inputs.availableCashLakhs).toBe(inputs.propertyPriceLakhs);
		expect(inputs.loanRatePct).toBe(BUY_VS_RENT_LIMITS.maxLoanRatePct);
		expect(inputs.loanTenureYears).toBe(BUY_VS_RENT_LIMITS.maxLoanTenureYears);
	});

	it("favours renting when the stay is short and buying friction dominates", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 120,
			monthlyRent: 30000,
			stayYears: 4,
			monthlyTakeHome: 180000,
			availableCashLakhs: 30,
			extraBuyingCostPct: 9,
			monthlyOwnerCost: 10000,
		});

		expect(result.decision.verdict).toBe("rent");
		expect(result.decision.wealthGap).toBeLessThan(0);
		expect(
			result.decision.breakEvenYear === null ||
				result.decision.breakEvenYear > result.inputs.stayYears,
		).toBe(true);
	});

	it("favours buying when the stay is long enough and rent is meaningful", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 70,
			monthlyRent: 42000,
			stayYears: 15,
			monthlyTakeHome: 180000,
			availableCashLakhs: 25,
			loanRatePct: 7.5,
			propertyAppreciationPct: 5.5,
			investmentReturnPct: 8,
			rentIncreasePct: 7,
		});

		expect(result.decision.verdict).toBe("buy");
		expect(result.decision.wealthGap).toBeGreaterThan(0);
		expect(result.decision.breakEvenYear).not.toBeNull();
	});

	it("higher extra buying costs push the result toward renting", () => {
		const sharedInputs = {
			propertyPriceLakhs: 90,
			monthlyRent: 36000,
			stayYears: 10,
			monthlyTakeHome: 170000,
			availableCashLakhs: 28,
		};
		const lowCost = calculateBuyVsRent({
			...sharedInputs,
			extraBuyingCostPct: 4,
		});
		const highCost = calculateBuyVsRent({
			...sharedInputs,
			extraBuyingCostPct: 12,
		});

		expect(highCost.decision.wealthGap).toBeLessThan(
			lowCost.decision.wealthGap,
		);
	});

	it("higher monthly owner costs push the result toward renting", () => {
		const sharedInputs = {
			propertyPriceLakhs: 90,
			monthlyRent: 36000,
			stayYears: 10,
			monthlyTakeHome: 170000,
			availableCashLakhs: 28,
		};
		const lowMaintenance = calculateBuyVsRent({
			...sharedInputs,
			monthlyOwnerCost: 3000,
		});
		const highMaintenance = calculateBuyVsRent({
			...sharedInputs,
			monthlyOwnerCost: 18000,
		});

		expect(highMaintenance.decision.wealthGap).toBeLessThan(
			lowMaintenance.decision.wealthGap,
		);
	});

	it("higher rent growth pushes the result toward buying", () => {
		const sharedInputs = {
			propertyPriceLakhs: 90,
			monthlyRent: 36000,
			stayYears: 12,
			monthlyTakeHome: 170000,
			availableCashLakhs: 28,
		};
		const slowRent = calculateBuyVsRent({
			...sharedInputs,
			rentIncreasePct: 3,
		});
		const fastRent = calculateBuyVsRent({
			...sharedInputs,
			rentIncreasePct: 9,
		});

		expect(fastRent.decision.wealthGap).toBeGreaterThan(
			slowRent.decision.wealthGap,
		);
	});

	it("higher investment return pushes the result toward renting", () => {
		const sharedInputs = {
			propertyPriceLakhs: 90,
			monthlyRent: 36000,
			stayYears: 12,
			monthlyTakeHome: 170000,
			availableCashLakhs: 28,
		};
		const lowerReturn = calculateBuyVsRent({
			...sharedInputs,
			investmentReturnPct: 6,
		});
		const higherReturn = calculateBuyVsRent({
			...sharedInputs,
			investmentReturnPct: 12,
		});

		expect(higherReturn.decision.wealthGap).toBeLessThan(
			lowerReturn.decision.wealthGap,
		);
	});

	it("returns no break-even year when buying never catches up", () => {
		const result = calculateBuyVsRent({
			propertyPriceLakhs: 250,
			monthlyRent: 35000,
			stayYears: 8,
			monthlyTakeHome: 250000,
			availableCashLakhs: 40,
			extraBuyingCostPct: 10,
			monthlyOwnerCost: 25000,
			propertyAppreciationPct: 2,
			investmentReturnPct: 10,
			rentIncreasePct: 3,
		});

		expect(result.decision.verdict).toBe("rent");
		expect(result.decision.breakEvenYear).toBeNull();
	});

	it("changes scenario confidence when scenarios disagree", () => {
		const strong = calculateBuyVsRent({
			propertyPriceLakhs: 65,
			monthlyRent: 45000,
			stayYears: 18,
			monthlyTakeHome: 180000,
			availableCashLakhs: 25,
			propertyAppreciationPct: 6,
			investmentReturnPct: 7,
			rentIncreasePct: 8,
		});
		const sensitive = calculateBuyVsRent({
			propertyPriceLakhs: 90,
			monthlyRent: 42000,
			stayYears: 10,
			monthlyTakeHome: 180000,
			availableCashLakhs: 26,
			propertyAppreciationPct: 5,
			investmentReturnPct: 8.5,
			rentIncreasePct: 6,
		});

		expect(strong.decision.confidence).toBe("strong-signal");
		expect(sensitive.decision.scenarios.length).toBe(3);
		expect(["sensitive", "close-call"]).toContain(
			sensitive.decision.confidence,
		);
	});

	it("builds the simplified decision result expected by the product", () => {
		const result = calculateBuyVsRent();

		expect(result.decision.headline).toBeTruthy();
		expect(result.decision.explanation).toContain("over");
		expect(result.decision.answerChangingLevers.length).toBeLessThanOrEqual(3);
		expect(result.decision.keyDrivers.length).toBeLessThanOrEqual(4);
		expect(result.points[0]?.label).toBe("Now");
		expect(result.points).toHaveLength(result.inputs.stayYears + 1);
	});
});
