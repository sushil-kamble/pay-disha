import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { formatCompactCurrency } from "../format";
import type { ComparisonResult } from "../types";

interface ComparisonChartProps {
	result: ComparisonResult;
}

const COLOR_TOKENS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function ComparisonChart({ result }: ComparisonChartProps) {
	const chartConfig = result.offers.reduce<ChartConfig>((acc, item, index) => {
		acc[item.offer.id] = {
			label: item.offer.label,
			color: COLOR_TOKENS[index % COLOR_TOKENS.length] ?? "var(--chart-1)",
		};
		return acc;
	}, {});
	const minChartWidth = Math.max(620, result.offers.length * 110);

	return (
		<div className="rounded-xl border border-border bg-card p-3">
			<p className="mb-2 text-sm font-semibold text-foreground">
				3-year realized value projection
			</p>
			<div className="overflow-x-auto pb-1">
				<div style={{ minWidth: `${minChartWidth}px` }}>
					<ChartContainer config={chartConfig} className="h-66 w-full">
						<BarChart data={result.chartRows} margin={{ left: 8, right: 8 }}>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="year" tickLine={false} axisLine={false} />
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(value: number) => formatCompactCurrency(value)}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										formatter={(value, name) => [
											formatCompactCurrency(Number(value)),
											String(name),
										]}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent />} />
							{result.offers.map((item) => (
								<Bar
									key={item.offer.id}
									dataKey={item.offer.id}
									fill={`var(--color-${item.offer.id})`}
									radius={4}
								/>
							))}
						</BarChart>
					</ChartContainer>
				</div>
			</div>
		</div>
	);
}
