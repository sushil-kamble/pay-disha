import { ArrowDown, ArrowUp, LayoutGrid, Wallet } from "lucide-react";

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
		<div className="rounded-2xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center gap-2">
				<LayoutGrid className="h-4 w-4 text-primary" />
				<p className="text-sm font-semibold text-foreground">
					Offer comparison
				</p>
				<span className="text-xs text-muted-foreground">
					— ranked by risk-adjusted value
				</span>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{sorted.map((item, index) => (
					<div
						key={item.offer.id}
						className={`rounded-xl border bg-background p-3.5 ${
							index === 0
								? "border-primary/40 ring-1 ring-primary/20"
								: "border-border"
						}`}
					>
						<div className="mb-2 flex items-center justify-between gap-2">
							<p className="text-sm font-semibold text-foreground">
								{item.offer.companyName || "Unnamed offer"}
							</p>
							{index === 0 ? (
								<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
									Top risk-adjusted
								</span>
							) : (
								<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
									#{index + 1}
								</span>
							)}
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
