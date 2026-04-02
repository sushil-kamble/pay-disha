import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { SCENARIO_LABELS } from "../constants";
import type { ScenarioKey } from "../types";

interface ScenarioTabsProps {
	value: ScenarioKey;
	onValueChange: (value: ScenarioKey) => void;
}

export function ScenarioTabs({ value, onValueChange }: ScenarioTabsProps) {
	return (
		<Tabs
			value={value}
			onValueChange={(next) => onValueChange(next as ScenarioKey)}
		>
			<TabsList className="grid w-full grid-cols-3">
				{(Object.keys(SCENARIO_LABELS) as ScenarioKey[]).map((key) => (
					<TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
						{SCENARIO_LABELS[key]}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
