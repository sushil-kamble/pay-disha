// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { JOB_OFFER_COMPARATOR_STORAGE_KEY } from "./constants";
import {
	loadStoredJobOfferComparatorState,
	saveStoredJobOfferComparatorState,
} from "./storage";
import { createTestConfig, createTestOffer } from "./test-helpers";

describe("job offer comparator storage", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.restoreAllMocks();
	});

	it("returns null for malformed JSON or blocked localStorage reads", () => {
		window.localStorage.setItem(JOB_OFFER_COMPARATOR_STORAGE_KEY, "{bad json");
		expect(loadStoredJobOfferComparatorState()).toBeNull();

		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new Error("blocked");
		});

		expect(loadStoredJobOfferComparatorState()).toBeNull();
	});

	it("loads valid state and defaults missing UI-open maps to empty objects", () => {
		window.localStorage.setItem(
			JOB_OFFER_COMPARATOR_STORAGE_KEY,
			JSON.stringify({
				offers: [createTestOffer()],
				config: createTestConfig(),
				baselineOffer: null,
			}),
		);

		const loaded = loadStoredJobOfferComparatorState();

		expect(loaded).toMatchObject({
			offers: [expect.objectContaining({ id: "offer-a" })],
			config: expect.objectContaining({ scenario: "expected" }),
			baselineOffer: null,
			advancedOpenByOfferId: {},
			offerOpenByOfferId: {},
		});
	});

	it("returns null when required sections are missing or invalid", () => {
		window.localStorage.setItem(
			JOB_OFFER_COMPARATOR_STORAGE_KEY,
			JSON.stringify({ config: createTestConfig(), baselineOffer: null }),
		);

		expect(loadStoredJobOfferComparatorState()).toBeNull();

		window.localStorage.setItem(
			JOB_OFFER_COMPARATOR_STORAGE_KEY,
			JSON.stringify({
				offers: [createTestOffer()],
				config: { scenario: "invalid" },
				baselineOffer: null,
			}),
		);

		expect(loadStoredJobOfferComparatorState()).toBeNull();
	});

	it("swallows localStorage write failures", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("quota");
		});

		expect(() =>
			saveStoredJobOfferComparatorState({
				offers: [createTestOffer()],
				config: createTestConfig(),
				baselineOffer: null,
				advancedOpenByOfferId: {},
				offerOpenByOfferId: {},
			}),
		).not.toThrow();
	});
});
