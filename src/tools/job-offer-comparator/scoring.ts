import type { OfferComputed, OfferInput, QualitativeInputs } from "./types";

function toNormalizedScore(value: number, min: number, max: number) {
	if (max <= min) return 100;
	return ((value - min) / (max - min)) * 100;
}

export function qualitativeScore(qualitative: QualitativeInputs) {
	const values = Object.values(qualitative);
	const sum = values.reduce((acc, value) => acc + value, 0);
	const average = values.length > 0 ? sum / values.length : 0;
	return Math.max(0, Math.min(100, (average / 5) * 100));
}

export function computeFinanceScores(offers: OfferComputed[]): OfferComputed[] {
	const values = offers.map((offer) => offer.riskAdjustedValue);
	const min = Math.min(...values);
	const max = Math.max(...values);

	return offers.map((offer) => ({
		...offer,
		financeScore: toNormalizedScore(offer.riskAdjustedValue, min, max),
	}));
}

export function applyFitAndBlendedScores(
	offers: OfferComputed[],
	includeFit: boolean,
	financeWeightPct: number,
	fitWeightPct: number,
): OfferComputed[] {
	const totalWeight = Math.max(1, financeWeightPct + fitWeightPct);
	const financeWeight = financeWeightPct / totalWeight;
	const fitWeight = fitWeightPct / totalWeight;

	return offers.map((offer) => {
		const fitScore = qualitativeScore(offer.offer.qualitative);
		const blendedScore = includeFit
			? offer.financeScore * financeWeight + fitScore * fitWeight
			: offer.financeScore;

		return {
			...offer,
			fitScore,
			blendedScore,
		};
	});
}

export function buildTopInsights(offer: OfferInput, computed: OfferComputed) {
	const insights: string[] = [];

	if (offer.variableAnnualTarget > 0 && offer.expectedBonusPayoutPct < 80) {
		insights.push(
			"Variable payout confidence is low, so downside protection matters.",
		);
	}

	if (offer.equityType !== "none" && offer.equityCliffMonths >= 12) {
		insights.push(
			`Equity has a ${offer.equityCliffMonths}-month cliff. Early exits reduce realized upside.`,
		);
	}

	if (computed.annualWorkCost > 120000) {
		insights.push(
			"Location and work-mode costs are materially reducing effective value.",
		);
	}

	if (offer.expectedPromotionMonths <= 24) {
		insights.push(
			"Promotion timeline is relatively near-term and can shift 24-36 month value.",
		);
	}

	if (offer.joiningBonus + offer.relocationSupportOneTime > 0) {
		insights.push(
			"Year-1 value is boosted by one-time payouts, so compare steady-state too.",
		);
	}

	if (insights.length === 0) {
		insights.push(
			"This offer profile is balanced with low assumption sensitivity.",
		);
	}

	return insights;
}
