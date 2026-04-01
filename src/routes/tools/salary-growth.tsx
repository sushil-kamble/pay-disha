import { createFileRoute } from "@tanstack/react-router";

import { SalaryGrowthPage } from "#/tools/salary-growth/page";

export const Route = createFileRoute("/tools/salary-growth")({
	component: SalaryGrowthPage,
});
