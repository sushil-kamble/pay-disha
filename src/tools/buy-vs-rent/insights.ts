import {
	BUY_VS_RENT_BENCHMARKS,
	BUY_VS_RENT_VERDICT_LABELS,
} from "./constants";
import type {
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
	const upfrontDifference =
		upfrontGap >= 0
			? `The upfront hit is heavier by ${formatCurrency(upfrontGap)}`
			: `Renting needs ${formatCurrency(Math.abs(upfrontGap))} more day-one cash`;

	if (verdict === "buy") {
		return `Buying ends ahead by ${formatCurrency(financialGap)} over ${horizonYears} years. ${upfrontDifference}, but the total wealth path catches up${breakEvenYear ? ` around year ${breakEvenYear}` : " within the modeled window"}.`;
	}

	if (verdict === "rent") {
		return `Renting ends ahead by ${formatCurrency(Math.abs(financialGap))} over ${horizonYears} years. The main drag on buying is the higher carrying cost plus slower payback${breakEvenYear ? ` until roughly year ${breakEvenYear}` : " across the modeled window"}.`;
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

	if (summary.verdict === "rent" && summary.buyCatchUpYear) {
		return `Renting looks cleaner right now, but buying only catches up financially if you can stay for about ${summary.buyCatchUpYear} years or more.`;
	}

	if (summary.verdict === "rent") {
		return "Renting wins on the numbers here. Buying may still be emotionally right for your family, but the tool is saying the premium for ownership is still too high.";
	}

	return "This is a genuine judgement call. If family roots and housing certainty matter more, buying is defensible; if flexibility matters more, renting stays cleaner.";
}

export function buildBuyVsRentInsights({
	verdict,
	financialGap,
	horizonYears,
	breakEvenYear,
	upfrontGap,
	upfrontBuyCash,
	upfrontRentCash,
	firstYearBuyMonthlyOutgo,
	firstYearRentMonthlyOutgo,
	buyNetWorth,
	rentNetWorth,
	monthlyTakeHomeOldRegime,
	monthlyTakeHomeNewRegime,
	recommendedTaxRegime,
	recommendedTaxRegimeNote,
	buyStressRatio,
	rentStressRatio,
	finalYearMonthlyTakeHomeRecommended,
	finalYearBuyStressRatio,
	finalYearRentStressRatio,
}: Omit<
	BuyVsRentSummary,
	"insights" | "story" | "decisionNote"
>): BuyVsRentInsight[] {
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
			value: formatCurrency(Math.abs(upfrontGap)),
			description:
				upfrontGap >= 0
					? `Buying needs ${formatCurrency(upfrontGap)} more cash on day one than renting in this setup. Total day-one cash is ${formatCurrency(upfrontBuyCash)} to buy versus ${formatCurrency(upfrontRentCash)} to rent.`
					: `Renting needs ${formatCurrency(Math.abs(upfrontGap))} more cash on day one than buying in this setup. Total day-one cash is ${formatCurrency(upfrontRentCash)} to rent versus ${formatCurrency(upfrontBuyCash)} to buy.`,
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
			value: `${formatCurrency(buyNetWorth)} vs ${formatCurrency(rentNetWorth)}`,
			description: `By year ${horizonYears}, this compares total buyer net worth against the renter's investment corpus plus refundable deposit.`,
			tone: buyNetWorth >= rentNetWorth ? "positive" : "neutral",
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
			description: `${recommendedTaxRegimeNote} Regime used: ${regimeLabel}.`,
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
			tone:
				buyTone === "caution"
					? "caution"
					: buyTone === "neutral"
						? "neutral"
						: buyStressRatio <= rentStressRatio
							? "positive"
							: "neutral",
		});
	}

	if (
		finalYearMonthlyTakeHomeRecommended !== null &&
		finalYearBuyStressRatio !== null &&
		finalYearRentStressRatio !== null &&
		horizonYears > 1
	) {
		insights.push({
			title: "Finish-line affordability",
			value: `${(finalYearBuyStressRatio * 100).toFixed(0)}% vs ${(finalYearRentStressRatio * 100).toFixed(0)}%`,
			description: `By year ${horizonYears}, estimated take-home reaches ${formatCurrency(finalYearMonthlyTakeHomeRecommended)} a month. This is where salary growth starts showing up in the analysis.`,
			tone:
				finalYearBuyStressRatio > BUY_VS_RENT_BENCHMARKS.emiToIncome.watchMax
					? "caution"
					: finalYearBuyStressRatio >
							BUY_VS_RENT_BENCHMARKS.emiToIncome.softWarning
						? "neutral"
						: "positive",
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
