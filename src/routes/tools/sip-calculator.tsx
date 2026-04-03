import { createFileRoute } from "@tanstack/react-router";

import { SipCalculatorPage } from "#/tools/sip-calculator/page";

export const Route = createFileRoute("/tools/sip-calculator")({
	component: SipCalculatorPage,
});
