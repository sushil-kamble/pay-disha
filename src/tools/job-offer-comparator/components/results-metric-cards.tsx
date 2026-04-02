import { ArrowDown, ArrowUp, Wallet } from "lucide-react";

import { formatCompactCurrency, formatIndianCurrency } from "../format";
import type { OfferComputed } from "../types";

interface ResultsMetricCardsProps {
	offers: OfferComputed[];
}

export function ResultsMetricCards({ offers }: ResultsMetricCardsProps) {
	const sorted = [...offers].sort(
		(a, b) => b.riskAdjustedValue - a.riskAdjustedValue,
	);

	return (
		<div className="overflow-x-auto pb-1">
			<div className="flex min-w-max gap-3 pr-1">
				{sorted.map((item, index) => (
					<div
						key={item.offer.id}
						className="w-72 shrink-0 rounded-xl border border-border bg-card p-3.5"
					>
						<div className="mb-2 flex items-center justify-between gap-2">
							<p className="text-sm font-semibold text-foreground">
								{item.offer.label}
							</p>
							{index === 0 ? (
								<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
									Top risk-adjusted
								</span>
							) : null}
						</div>

						<div className="space-y-1.5 text-xs text-muted-foreground">
							<div className="flex items-center justify-between gap-2">
								<span className="inline-flex items-center gap-1">
									<Wallet className="h-3.5 w-3.5" />
									Monthly in-hand
								</span>
								<span className="font-semibold text-foreground">
									{formatCompactCurrency(item.monthlyTakeHome)}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2">
								<span>Year-1 realized value</span>
								<span className="font-semibold text-foreground">
									{formatCompactCurrency(item.firstYearRealizedValue)}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2">
								<span>36-month value</span>
								<span className="font-semibold text-foreground">
									{formatCompactCurrency(item.value36Months)}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2">
								<span className="inline-flex items-center gap-1">
									<ArrowDown className="h-3.5 w-3.5 text-amber-500" />
									Downside (12m)
								</span>
								<span className="font-semibold text-foreground">
									{formatCompactCurrency(item.downside12Months)}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2">
								<span className="inline-flex items-center gap-1">
									<ArrowUp className="h-3.5 w-3.5 text-sky-500" />
									Upside (36m)
								</span>
								<span className="font-semibold text-foreground">
									{formatCompactCurrency(item.upside36Months)}
								</span>
							</div>

							<div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/25 px-2 py-1.5">
								<span>Risk-adjusted score</span>
								<span className="font-semibold text-foreground">
									{item.riskAdjustedValue > 0
										? formatIndianCurrency(item.riskAdjustedValue)
										: "₹0"}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
