import { CheckCircle2, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { formatCompactCurrency } from "../format";
import type { ComparisonResult } from "../types";

interface VerdictHeaderProps {
	result: ComparisonResult;
}

function findOfferName(result: ComparisonResult, offerId: string) {
	return (
		result.offers.find((offer) => offer.offer.id === offerId)?.offer.label ??
		"-"
	);
}

export function VerdictHeader({ result }: VerdictHeaderProps) {
	const cashNow = result.winners.bestCashNow;
	const longTerm = result.winners.bestLongTerm;
	const risk = result.winners.bestRiskAdjusted;
	const overall = result.winners.bestOverall;

	return (
		<div className="rounded-2xl border border-border bg-card p-4">
			<p className="text-xs font-semibold uppercase tracking-wide text-primary">
				Decision snapshot
			</p>
			<h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
				{findOfferName(result, risk.offerId)} is strongest on risk-adjusted
				value.
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				Cash winner and long-term winner may differ. Use this view to avoid
				over-indexing on headline CTC.
			</p>

			<div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-xl border border-border/70 bg-background p-3">
					<p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
						Best cash now
					</p>
					<p className="mt-1 text-sm font-semibold text-foreground">
						{findOfferName(result, cashNow.offerId)}
					</p>
					<p className="text-xs text-muted-foreground">
						{formatCompactCurrency(cashNow.value)}/mo
					</p>
				</div>

				<div className="rounded-xl border border-border/70 bg-background p-3">
					<p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						<TrendingUp className="h-3.5 w-3.5 text-primary" />
						Best 36 months
					</p>
					<p className="mt-1 text-sm font-semibold text-foreground">
						{findOfferName(result, longTerm.offerId)}
					</p>
					<p className="text-xs text-muted-foreground">
						{formatCompactCurrency(longTerm.value)} total
					</p>
				</div>

				<div className="rounded-xl border border-border/70 bg-background p-3">
					<p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						<ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
						Best risk-adjusted
					</p>
					<p className="mt-1 text-sm font-semibold text-foreground">
						{findOfferName(result, risk.offerId)}
					</p>
					<p className="text-xs text-muted-foreground">
						{formatCompactCurrency(risk.value)} weighted
					</p>
				</div>

				<div className="rounded-xl border border-border/70 bg-background p-3">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						Overall fit
					</p>
					{overall ? (
						<>
							<p className="mt-1 text-sm font-semibold text-foreground">
								{findOfferName(result, overall.offerId)}
							</p>
							<Badge variant="outline" className="mt-1 text-[10px]">
								Fit enabled
							</Badge>
						</>
					) : (
						<p className="mt-1 text-xs text-muted-foreground">
							Enable fit inputs to combine money with qualitative preferences.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
