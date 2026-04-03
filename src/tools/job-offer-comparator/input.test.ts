import { describe, expect, it } from "vitest";

import { parseIntegerInput, parseNumberInput } from "./input";

describe("job offer comparator input parsing", () => {
	it("parses valid numbers and falls back to zero for invalid values", () => {
		expect(parseNumberInput("12.5")).toBe(12.5);
		expect(parseNumberInput("")).toBe(0);
		expect(parseNumberInput("abc")).toBe(0);
	});

	it("parses integers and falls back to zero for invalid values", () => {
		expect(parseIntegerInput("18")).toBe(18);
		expect(parseIntegerInput("18.9")).toBe(18);
		expect(parseIntegerInput("bad")).toBe(0);
	});
});
