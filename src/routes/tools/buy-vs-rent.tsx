import { createFileRoute } from "@tanstack/react-router";

import { BuyVsRentPage } from "#/tools/buy-vs-rent/page";

export const Route = createFileRoute("/tools/buy-vs-rent")({
	component: BuyVsRentPage,
});
