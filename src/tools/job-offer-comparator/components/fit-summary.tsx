import { Sparkles } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import type { OfferComputed } from "../types";

interface FitSummaryProps {
	offers: OfferComputed[];
	includeFit: boolean;
}

export function FitSummary({ offers, includeFit }: FitSummaryProps) {
	if (!includeFit) {
		return (
			<div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
				Enable qualitative fit to compare role excitement, growth confidence,
				and culture/work-life preferences alongside finance.
			</div>
		);
	}

	const byBlended = [...offers].sort((a, b) => b.blendedScore - a.blendedScore);

	return (
		<div className="space-y-3 rounded-xl border border-border bg-card p-3">
			<div className="flex items-center gap-2">
				<Sparkles className="h-4 w-4 text-primary" />
				<p className="text-sm font-semibold text-foreground">
					Fit + finance blended view
				</p>
			</div>

			<div className="overflow-x-auto pb-1">
				<div className="flex min-w-max gap-2 pr-1">
					{byBlended.map((offer, index) => (
						<div
							key={offer.offer.id}
							className="w-64 shrink-0 rounded-lg border border-border/70 bg-background px-3 py-2"
						>
							<div className="mb-1 flex items-center justify-between">
								<p className="text-sm font-semibold text-foreground">
									{offer.offer.label}
								</p>
								{index === 0 ? (
									<Badge variant="secondary" className="text-[10px]">
										Top blended
									</Badge>
								) : null}
							</div>
							<div className="space-y-1 text-xs text-muted-foreground">
								<p>
									Finance score:{" "}
									<span className="font-semibold text-foreground">
										{offer.financeScore.toFixed(1)}
									</span>
								</p>
								<p>
									Fit score:{" "}
									<span className="font-semibold text-foreground">
										{offer.fitScore.toFixed(1)}
									</span>
								</p>
								<p>
									Blended score:{" "}
									<span className="font-semibold text-foreground">
										{offer.blendedScore.toFixed(1)}
									</span>
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
