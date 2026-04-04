import { describe, expect, it } from "vitest";

import { calculate } from "#/tools/inhand-salary/calculator";

describe("in-hand salary calculator", () => {
	it("applies professional tax and employee PF as tax deductions in old regime", () => {
		const result = calculate(12, 1800, "old", 100000);

		expect(result).not.toBeNull();
		expect(result?.professionalTaxDeduction).toBe(2400);
		expect(result?.employeePfTaxDeduction).toBe(21600);
		expect(result?.taxableIncomeBeforeExemptions).toBe(1126000);
		expect(result?.exemptionsApplied).toBe(100000);
		expect(result?.taxableIncome).toBe(1026000);
	});

	it("does not apply professional tax or employee PF as tax deductions in new regime", () => {
		const result = calculate(12, 1800, "new", 100000);

		expect(result).not.toBeNull();
		expect(result?.professionalTaxDeduction).toBe(0);
		expect(result?.employeePfTaxDeduction).toBe(0);
		expect(result?.taxableIncomeBeforeExemptions).toBe(1125000);
		expect(result?.exemptionsApplied).toBe(0);
		expect(result?.taxableIncome).toBe(1125000);
	});

	it("reduces old-regime base tax when employee PF contribution exists", () => {
		const withoutPf = calculate(20, 0, "old", 0);
		const withPf = calculate(20, 1800, "old", 0);

		expect(withoutPf).not.toBeNull();
		expect(withPf).not.toBeNull();
		expect(withPf?.taxableIncome).toBeLessThan(withoutPf?.taxableIncome ?? 0);
		expect(withPf?.baseTax).toBeLessThan(withoutPf?.baseTax ?? 0);
	});
});
