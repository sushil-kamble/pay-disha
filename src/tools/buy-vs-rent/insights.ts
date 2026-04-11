import {
	BUY_VS_RENT_BENCHMARKS,
	BUY_VS_RENT_VERDICT_LABELS,
} from "./constants";
import type {
	BenchmarkBand,
	BuyVsRentInsight,
	BuyVsRentSummary,
	BuyVsRentVerdict,
} from "./types";

function formatIndian(value: number) {
	return Math.round(value).toLocaleString("en-IN");
}

function formatCurrency(value: number) {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
	if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
	if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
	return `${sign}₹${Math.round(abs)}`;
}

function buildStory({
	verdict,
	financialGap,
	horizonYears,
	breakEvenYear,
	upfrontGap,
}: {
	verdict: BuyVsRentVerdict;
	financialGap: number;
	horizonYears: number;
	breakEvenYear: number | null;
	upfrontGap: number;
}) {
	if (verdict === "buy") {
		return `Buying ends ahead by ${formatCurrency(financialGap)} over ${horizonYears} years. The upfront hit is heavier by ${formatCurrency(upfrontGap)}, but the equity build-up catches up${breakEvenYear ? ` around year ${breakEvenYear}` : " within the selected horizon"}.`;
	}

	if (verdict === "rent") {
		return `Renting ends ahead by ${formatCurrency(Math.abs(financialGap))} over ${horizonYears} years. The main drag on buying is the heavier upfront cash plus slower payback${breakEvenYear ? ` until roughly year ${breakEvenYear}` : " across the full horizon"}.`;
	}

	return `The numbers are too close to call over ${horizonYears} years. The financial gap stays within ${formatCurrency(Math.abs(financialGap))}, so family stability vs flexibility should decide the tie.`;
}

function buildDecisionNote(
	summary: Omit<BuyVsRentSummary, "insights" | "story" | "decisionNote">,
) {
	if (
		summary.emiToIncomeBand === "risky" ||
		summary.ageTenureBand === "risky" ||
		summary.priceToIncomeBand === "risky"
	) {
		return "The wealth outcome may look acceptable, but affordability signals are stretched. De-risk your plan before committing.";
	}

	if (summary.verdict === "buy") {
		return "This is one of the clearer cases where buying can make sense: the stay length is long enough for equity to outrun rent savings.";
	}

	if (summary.verdict === "rent" && summary.buyBecomesReasonableAfterYear) {
		return `Renting looks cleaner right now, but buying starts becoming financially respectable only if you can stay for about ${summary.buyBecomesReasonableAfterYear} years or more.`;
	}

	if (summary.verdict === "rent") {
		return "Renting wins on the numbers here. Buying may still be emotionally right for your family, but the tool is saying the premium for ownership is still too high.";
	}

	return "This is a genuine judgement call. If family roots and housing certainty matter more, buying is defensible; if flexibility matters more, renting stays cleaner.";
}

function getBandTone(band: BenchmarkBand) {
	if (band === "good") return "positive" as const;
	if (band === "watch") return "neutral" as const;
	return "caution" as const;
}

function getBandLabel(band: BenchmarkBand) {
	if (band === "good") return "Good";
	if (band === "watch") return "Watch";
	return "Risky";
}

export function buildBuyVsRentInsights({
	verdict,
	financialGap,
	horizonYears,
	breakEvenYear,
	upfrontGap,
	upfrontBuyCash,
	firstYearBuyMonthlyOutgo,
	firstYearRentMonthlyOutgo,
	finalHomeEquity,
	finalRentCorpus,
	monthlyTakeHomeOldRegime,
	monthlyTakeHomeNewRegime,
	recommendedTaxRegime,
	recommendedTaxRegimeNote,
	buyStressRatio,
	rentStressRatio,
	priceToIncomeRatio,
	priceToIncomeBand,
	emiToIncomeRatio,
	emiToIncomeBand,
	affordabilityBenchmarks,
}: {
	verdict: BuyVsRentVerdict;
	financialGap: number;
	horizonYears: number;
	breakEvenYear: number | null;
	upfrontGap: number;
	upfrontBuyCash: number;
	firstYearBuyMonthlyOutgo: number;
	firstYearRentMonthlyOutgo: number;
	finalHomeEquity: number;
	finalRentCorpus: number;
	monthlyTakeHomeOldRegime: number | null;
	monthlyTakeHomeNewRegime: number | null;
	recommendedTaxRegime: "new" | "old" | null;
	recommendedTaxRegimeNote: string;
	buyStressRatio: number | null;
	rentStressRatio: number | null;
	priceToIncomeRatio: number;
	priceToIncomeBand: BenchmarkBand;
	emiToIncomeRatio: number | null;
	emiToIncomeBand: BenchmarkBand | null;
	affordabilityBenchmarks: BuyVsRentSummary["affordabilityBenchmarks"];
}): BuyVsRentInsight[] {
	const insights: BuyVsRentInsight[] = [
		{
			title: "Verdict",
			value: BUY_VS_RENT_VERDICT_LABELS[verdict],
			description: buildStory({
				verdict,
				financialGap,
				horizonYears,
				breakEvenYear,
				upfrontGap,
			}),
			tone:
				verdict === "buy"
					? "positive"
					: verdict === "rent"
						? "caution"
						: "neutral",
		},
		{
			title: "Upfront ask",
			value: formatCurrency(upfrontBuyCash),
			description: `Buying needs ${formatCurrency(upfrontGap)} more cash on day one than renting in this setup. That is the first hurdle the house must earn back.`,
			tone: upfrontGap > 0 ? "caution" : "neutral",
		},
		{
			title: "Year 1 cash flow",
			value: `${formatCurrency(firstYearBuyMonthlyOutgo)} vs ${formatCurrency(firstYearRentMonthlyOutgo)}`,
			description: `That is the typical monthly outgo in the first year for buy vs rent before future rent hikes or equity accumulation change the picture.`,
			tone:
				firstYearBuyMonthlyOutgo <= firstYearRentMonthlyOutgo
					? "positive"
					: "neutral",
		},
		{
			title: "Ending position",
			value: `${formatCurrency(finalHomeEquity)} vs ${formatCurrency(finalRentCorpus)}`,
			description: `By year ${horizonYears}, the buyer ends with home equity and the renter ends with an investment corpus plus refundable deposit.`,
			tone: finalHomeEquity >= finalRentCorpus ? "positive" : "neutral",
		},
		{
			title: "Income benchmark",
			value: `${priceToIncomeRatio.toFixed(1)}x`,
			description: `Home price is ${priceToIncomeRatio.toFixed(1)} times annual income. Band: ${getBandLabel(priceToIncomeBand)}.`,
			tone: getBandTone(priceToIncomeBand),
		},
	];

	if (breakEvenYear) {
		insights.push({
			title: "Break-even year",
			value: `Year ${breakEvenYear}`,
			description: `This is the first year where selling the house, clearing the loan, and counting investment side-cash overtakes the rent-and-invest path.`,
			tone: breakEvenYear <= horizonYears ? "positive" : "neutral",
		});
	}

	if (monthlyTakeHomeOldRegime !== null || monthlyTakeHomeNewRegime !== null) {
		const regimeLabel = recommendedTaxRegime
			? recommendedTaxRegime.toUpperCase()
			: "N/A";
		insights.push({
			title: "Estimated take-home",
			value: `${formatCurrency(monthlyTakeHomeNewRegime ?? 0)} (new) vs ${formatCurrency(monthlyTakeHomeOldRegime ?? 0)} (old)`,
			description: `${recommendedTaxRegimeNote} Recommended affordability regime: ${regimeLabel}.`,
			tone: "neutral",
		});
	}

	if (buyStressRatio !== null && rentStressRatio !== null) {
		const buyTone =
			buyStressRatio > BUY_VS_RENT_BENCHMARKS.emiToIncome.watchMax
				? "caution"
				: buyStressRatio > BUY_VS_RENT_BENCHMARKS.emiToIncome.softWarning
					? "neutral"
					: "positive";

		insights.push({
			title: "Stress test",
			value: `${(buyStressRatio * 100).toFixed(0)}% vs ${(rentStressRatio * 100).toFixed(0)}%`,
			description: `This compares first-year housing outgo against estimated monthly take-home. Lower is safer for real life, not just spreadsheets.`,
			tone: buyStressRatio <= rentStressRatio ? ("positive" as const) : buyTone,
		});
	}

	if (emiToIncomeRatio !== null && emiToIncomeBand !== null) {
		insights.push({
			title: "EMI affordability band",
			value: `${(emiToIncomeRatio * 100).toFixed(0)}% (${getBandLabel(emiToIncomeBand)})`,
			description:
				"This uses EMI divided by estimated monthly take-home to highlight affordability pressure.",
			tone: getBandTone(emiToIncomeBand),
		});
	}

	if (affordabilityBenchmarks.length > 0) {
		const riskyCount = affordabilityBenchmarks.filter(
			(benchmark) => benchmark.band === "risky",
		).length;
		const watchCount = affordabilityBenchmarks.filter(
			(benchmark) => benchmark.band === "watch",
		).length;
		insights.push({
			title: "Benchmark summary",
			value: `${riskyCount} risky · ${watchCount} watch`,
			description:
				"Use benchmark flags as guardrails; they complement the net-worth verdict, not replace it.",
			tone:
				riskyCount > 0 ? "caution" : watchCount > 0 ? "neutral" : "positive",
		});
	}

	return insights;
}

export function buildBuyVsRentStory(
	summary: Omit<BuyVsRentSummary, "insights" | "story" | "decisionNote">,
) {
	return {
		story: buildStory(summary),
		decisionNote: buildDecisionNote(summary),
	};
}

export { formatCurrency, formatIndian };
