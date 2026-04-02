import { createFileRoute } from "@tanstack/react-router";

import { FirePage } from "#/tools/fire/page";

export const Route = createFileRoute("/tools/fire")({
	component: FirePage,
});
