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
			<div className="rounded-2xl border border-border bg-card p-4">
				<div className="mb-3 flex items-center gap-2">
					<Sparkles className="h-4 w-4 text-primary" />
					<p className="text-sm font-semibold text-foreground">
						Fit + finance blended view
					</p>
				</div>
				<p className="text-sm text-muted-foreground">
					Enable qualitative fit to compare role excitement, growth confidence,
					and culture/work-life preferences alongside finance.
				</p>
			</div>
		);
	}

	const byBlended = [...offers].sort((a, b) => b.blendedScore - a.blendedScore);

	return (
		<div className="rounded-2xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center gap-2">
				<Sparkles className="h-4 w-4 text-primary" />
				<p className="text-sm font-semibold text-foreground">
					Fit + finance blended view
				</p>
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{byBlended.map((offer, index) => (
					<div
						key={offer.offer.id}
						className={`rounded-xl border px-3 py-2.5 ${
							index === 0
								? "border-primary/40 bg-primary/5"
								: "border-border/70 bg-background"
						}`}
					>
						<div className="mb-1.5 flex items-center justify-between">
							<p className="text-sm font-semibold text-foreground">
								{offer.offer.companyName || "Unnamed offer"}
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
	);
}
