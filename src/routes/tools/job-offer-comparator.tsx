import { createFileRoute } from "@tanstack/react-router";

import { JobOfferComparatorPage } from "#/tools/job-offer-comparator/page";

export const Route = createFileRoute("/tools/job-offer-comparator")({
	component: JobOfferComparatorPage,
});
