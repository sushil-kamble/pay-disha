// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestOffer } from "../test-helpers";
import { OfferCard } from "./offer-card";

afterEach(() => {
	cleanup();
});

describe("offer card", () => {
	it("applies employer presets when the employer type changes", () => {
		const onOfferFieldChange = vi.fn();

		render(
			<OfferCard
				offer={createTestOffer()}
				offerOpen
				advancedOpen={false}
				canDelete
				onOfferOpenChange={vi.fn()}
				onAdvancedOpenChange={vi.fn()}
				onDuplicate={vi.fn()}
				onDelete={vi.fn()}
				onOfferFieldChange={onOfferFieldChange}
				onBenefitChange={vi.fn()}
				onQualitativeChange={vi.fn()}
			/>,
		);

		fireEvent.change(screen.getByDisplayValue("MNC"), {
			target: { value: "startup" },
		});

		expect(onOfferFieldChange.mock.calls).toEqual(
			expect.arrayContaining([
				["employerType", "startup"],
				["expectedBonusPayoutPct", 75],
				["expectedAnnualIncrementPct", 18],
				["expectedPromotionMonths", 20],
				["promotionUpliftPct", 18],
				["equityCliffMonths", 12],
			]),
		);
	});

	it("shows company name in the header instead of the internal offer label", () => {
		render(
			<OfferCard
				offer={createTestOffer({
					label: "Internal Label",
					companyName: "Visible Company",
				})}
				offerOpen
				advancedOpen={false}
				canDelete
				onOfferOpenChange={vi.fn()}
				onAdvancedOpenChange={vi.fn()}
				onDuplicate={vi.fn()}
				onDelete={vi.fn()}
				onOfferFieldChange={vi.fn()}
				onBenefitChange={vi.fn()}
				onQualitativeChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Visible Company")).toBeTruthy();
		expect(screen.queryByText("Internal Label")).toBeNull();
	});

	it("updates work mode value when the selector changes", () => {
		const onOfferFieldChange = vi.fn();
		const offer = createTestOffer({ workMode: "hybrid" });
		render(
			<OfferCard
				offer={offer}
				offerOpen
				advancedOpen={false}
				canDelete
				onOfferOpenChange={vi.fn()}
				onAdvancedOpenChange={vi.fn()}
				onDuplicate={vi.fn()}
				onDelete={vi.fn()}
				onOfferFieldChange={onOfferFieldChange}
				onBenefitChange={vi.fn()}
				onQualitativeChange={vi.fn()}
			/>,
		);

		const workModeSelect = document.getElementById(
			`${offer.id}-work-mode`,
		) as HTMLSelectElement | null;
		expect(workModeSelect).toBeTruthy();
		if (!workModeSelect) {
			throw new Error("Work mode select not found");
		}
		fireEvent.change(workModeSelect, {
			target: { value: "remote" },
		});

		expect(onOfferFieldChange).toHaveBeenCalledWith("workMode", "remote");
	});
});
