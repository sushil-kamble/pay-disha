import { describe, expect, it } from "vitest";

import { buildComparedOffers } from "./page";
import { createTestOffer } from "./test-helpers";

describe("job offer comparator page helpers", () => {
	it("includes the baseline offer only when the toggle is enabled", () => {
		const offers = [
			createTestOffer({ id: "offer-a" }),
			createTestOffer({ id: "offer-b" }),
		];
		const baseline = createTestOffer({ id: "baseline-current" });

		expect(buildComparedOffers(offers, false, baseline)).toHaveLength(2);
		expect(buildComparedOffers(offers, true, null)).toHaveLength(2);

		const compared = buildComparedOffers(offers, true, baseline);

		expect(compared).toHaveLength(3);
		expect(compared[0]?.id).toBe("baseline-current");
	});
});
