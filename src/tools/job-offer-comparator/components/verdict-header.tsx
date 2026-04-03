import {
	Camera,
	CheckCircle2,
	ShieldCheck,
	Sparkles,
	Star,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { formatCompactCurrency } from "../format";
import type { ComparisonResult } from "../types";

interface VerdictHeaderProps {
	result: ComparisonResult;
}

function findOfferName(result: ComparisonResult, offerId: string) {
	return (
		result.offers.find((offer) => offer.offer.id === offerId)?.offer
			.companyName || "-"
	);
}

export function VerdictHeader({ result }: VerdictHeaderProps) {
	const cashNow = result.winners.bestCashNow;
	const longTerm = result.winners.bestLongTerm;
	const risk = result.winners.bestRiskAdjusted;
	const overall = result.winners.bestOverall;

	const recommendedId = overall?.offerId ?? risk.offerId;
	const recommendedName = findOfferName(result, recommendedId);
	const isBlended = !!overall;

	return (
		<div className="rounded-2xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center gap-2">
				<Camera className="h-4 w-4 text-primary" />
				<p className="text-sm font-semibold text-foreground">
					Decision snapshot
				</p>
			</div>

			{/* Prominent recommendation card */}
			<div className="mt-3 overflow-hidden rounded-xl bg-primary">
				<div className="flex items-start gap-3.5 px-4 py-3.5">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
						<Trophy className="h-5 w-5 text-white" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-[11px] font-semibold text-white">
							{isBlended
								? "Top pick — fit + finance"
								: "Top pick — risk-adjusted"}
						</p>
						<p className="mt-0.5 truncate text-xl font-bold text-white">
							{recommendedName}
						</p>
						<p className="mt-0.5 text-xs font-medium text-white/90">
							{isBlended
								? "Best blend of financial value and qualitative fit"
								: "Strongest risk-adjusted value — best default choice"}
						</p>
					</div>
					<div className="shrink-0">
						<span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold text-white">
							<Star className="h-3 w-3 fill-current" />
							Recommended
						</span>
					</div>
				</div>
				<div className="border-t border-white/15 bg-white/10 px-4 py-2">
					<p className="text-[11px] font-medium text-white/90">
						Cash winner and long-term winner may differ — avoid over-indexing on
						headline CTC.
					</p>
				</div>
			</div>

			{/* 2×2 grid of metric cards */}
			<div className="mt-4 grid grid-cols-2 gap-2.5">
				<div className="rounded-xl border border-border/70 bg-background p-3">
					<p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
					<p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
					<p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
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
					<p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
						<Sparkles className="h-3.5 w-3.5 text-amber-500" />
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
