import { describe, expect, it } from "vitest";

import {
	applyEmployerPreset,
	createDefaultBaselineOffer,
	createDefaultOffers,
} from "./presets";
import { createTestOffer } from "./test-helpers";

describe("job offer comparator presets", () => {
	it("starts all default benefits disabled for new offers", () => {
		const offers = createDefaultOffers();

		for (const offer of offers) {
			expect(
				Object.values(offer.benefits).every((benefit) => !benefit.enabled),
			).toBe(true);
		}
	});

	it("resets baseline-only one-time and risk fields to zero", () => {
		const baseline = createDefaultBaselineOffer();

		expect(baseline.joiningBonus).toBe(0);
		expect(baseline.retentionBonus).toBe(0);
		expect(baseline.relocationSupportOneTime).toBe(0);
		expect(baseline.noticeBuyoutRisk).toBe(0);
		expect(baseline.clawbackRisk).toBe(0);
	});

	it("defaults monthly expenses to zero", () => {
		const offers = createDefaultOffers();
		for (const offer of offers) {
			expect(offer.expensesMonthly).toBe(0);
		}

		const baseline = createDefaultBaselineOffer();
		expect(baseline.expensesMonthly).toBe(0);
	});

	it("applies employer archetype fields without disturbing unrelated offer data", () => {
		const base = createTestOffer({
			companyName: "Acme Corp",
			fixedAnnualCash: 2200000,
			benefits: {
				healthSelf: { enabled: true, monthlyValue: 1500 },
			},
		});

		const preset = applyEmployerPreset(base, "startup");

		expect(preset.employerType).toBe("startup");
		expect(preset.expectedBonusPayoutPct).toBe(75);
		expect(preset.expectedAnnualIncrementPct).toBe(18);
		expect(preset.expectedPromotionMonths).toBe(20);
		expect(preset.promotionUpliftPct).toBe(18);
		expect(preset.equityCliffMonths).toBe(12);
		expect(preset.companyName).toBe("Acme Corp");
		expect(preset.fixedAnnualCash).toBe(2200000);
		expect(preset.benefits.healthSelf).toEqual({
			enabled: true,
			monthlyValue: 1500,
		});
	});
});
