import { formatCurrency } from "./calculator";
import { SIP_GOAL_PRESETS } from "./constants";
import type { SipInsight, SipResult } from "./types";

function formatYears(value: number | null) {
	if (value === null) return "Not visible";
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)} years`;
}

function formatPercent(value: number) {
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatYearsOfFreedom(months: number) {
	if (months >= 12) {
		const years = months / 12;
		return `${years.toFixed(years >= 10 || years % 1 === 0 ? 0 : 1)} years`;
	}

	return `${Math.round(months)} months`;
}

function buildTrackDescription(result: SipResult) {
	if (result.isOnTrack) {
		return `At your current pace, you can reach this goal by ${result.goalCalendarYear} and still keep a ${formatCurrency(Math.abs(result.targetGap))} buffer.`;
	}

	if (result.extraYearsNeeded !== null) {
		return `At the current pace, this goal slips by ${formatYears(result.extraYearsNeeded)}. That is the timeline the lever cards are trying to pull back.`;
	}

	return "At the current pace, this goal is not visible inside the modeled horizon. You need a bigger monthly SIP, annual step-up, more time, or a starting corpus boost.";
}

export function buildSipInsights(result: SipResult): SipInsight[] {
	const { inputs } = result;
	const goalPreset = SIP_GOAL_PRESETS[inputs.goalPreset];
	const insights: SipInsight[] = [
		{
			id: "future-cost-shock",
			title: "Future cost shock",
			value: formatCurrency(result.goalAmountAtTarget),
			description: `${goalPreset.label} grows from ${formatCurrency(inputs.targetAmountToday)} today to ${formatCurrency(result.goalAmountAtTarget)} by ${result.goalCalendarYear}.`,
			tone:
				result.goalAmountAtTarget > inputs.targetAmountToday
					? "surprise"
					: "neutral",
		},
		{
			id: "track-status",
			title: result.isOnTrack ? "On track" : "Target-year gap",
			value: result.isOnTrack
				? formatCurrency(result.projectedCorpusAtTarget)
				: formatCurrency(Math.abs(result.targetGap)),
			description: buildTrackDescription(result),
			tone: result.isOnTrack ? "positive" : "caution",
		},
	];

	if (result.requiredMonthlySip !== null) {
		insights.push({
			id: "required-sip",
			title: "Required SIP today",
			value: `${formatCurrency(result.requiredMonthlySip)}/mo`,
			description:
				result.requiredMonthlySip <= inputs.monthlySip
					? `You already clear the required SIP for this goal. Your current ${formatCurrency(inputs.monthlySip)}/mo pace is enough.`
					: `To hit the goal by ${result.goalCalendarYear}, you need about ${formatCurrency(result.requiredMonthlySip)}/mo from today instead of ${formatCurrency(inputs.monthlySip)}/mo.`,
			tone:
				result.requiredMonthlySip <= inputs.monthlySip ? "positive" : "caution",
		});
	}

	if (result.requiredAnnualStepUpPct !== null && inputs.monthlySip > 0) {
		insights.push({
			id: "required-step-up",
			title: "Required annual step-up",
			value: formatPercent(result.requiredAnnualStepUpPct),
			description:
				result.requiredAnnualStepUpPct <= inputs.annualStepUpPct
					? `Your current ${formatPercent(inputs.annualStepUpPct)} step-up already clears the required pace.`
					: `Keeping the same starting SIP, you would need about ${formatPercent(result.requiredAnnualStepUpPct)} annual step-up to still reach the goal on time.`,
			tone:
				result.requiredAnnualStepUpPct <= inputs.annualStepUpPct
					? "positive"
					: "neutral",
		});
	}

	const harshestDelay =
		result.delayCosts.find((delay) => delay.delayYears === 1) ??
		result.delayCosts[0];

	if (harshestDelay) {
		insights.push({
			id: "delay-cost",
			title: "Cost of delay",
			value:
				harshestDelay.additionalMonthlySip !== null
					? `${formatCurrency(harshestDelay.additionalMonthlySip)}/mo more`
					: "Delay hurts",
			description:
				harshestDelay.requiredMonthlySip !== null
					? `If you wait ${harshestDelay.delayYears} year${harshestDelay.delayYears === 1 ? "" : "s"}, the required SIP rises to ${formatCurrency(harshestDelay.requiredMonthlySip)}/mo to keep the same finish line.`
					: `If you wait ${harshestDelay.delayYears} year${harshestDelay.delayYears === 1 ? "" : "s"}, the goal becomes difficult to recover inside the original horizon.`,
			tone: "surprise",
		});
	}

	insights.push({
		id: "real-value",
		title: "Real value in today's money",
		value: formatCurrency(result.realCorpusAtTarget),
		description: `Your target-year corpus of ${formatCurrency(result.projectedCorpusAtTarget)} feels like ${formatCurrency(result.realCorpusAtTarget)} after discounting for ${formatPercent(inputs.realValueInflationPct)} inflation.`,
		tone:
			result.realCorpusAtTarget >= inputs.targetAmountToday
				? "positive"
				: "neutral",
	});

	if (result.compoundingCrossoverYear !== null) {
		insights.push({
			id: "compounding-crossover",
			title: "When compounding takes over",
			value: String(result.compoundingCrossoverCalendarYear),
			description: `Around ${result.compoundingCrossoverCalendarYear}, your gains become larger than the money you personally put in. After that, time starts doing more work than you do.`,
			tone: "positive",
		});
	}

	insights.push({
		id: "growth-split",
		title: "Contribution vs growth",
		value: `${Math.round(result.contributionSharePct)}% / ${Math.round(result.growthSharePct)}%`,
		description: `By ${result.goalCalendarYear}, roughly ${formatCurrency(result.contributionsAtTarget)} comes from your own money and ${formatCurrency(result.gainsAtTarget)} comes from market growth.`,
		tone: result.growthSharePct >= 40 ? "positive" : "neutral",
	});

	if (inputs.startingCorpus > 0) {
		insights.push({
			id: "starting-corpus",
			title: "Starting corpus head start",
			value: formatCurrency(result.startingCorpusFutureValue),
			description: `${formatCurrency(inputs.startingCorpus)} already invested today can become ${formatCurrency(result.startingCorpusFutureValue)} by ${result.goalCalendarYear}. That is ${Math.round(result.startingCorpusSharePct)}% of your projected corpus.`,
			tone: "positive",
		});
	}

	if (inputs.monthlyExpenses && inputs.monthlyExpenses > 0) {
		const monthsOfFreedom =
			result.projectedCorpusAtTarget / Math.max(inputs.monthlyExpenses, 1);
		insights.push({
			id: "freedom-translation",
			title: "Lifestyle freedom translation",
			value: formatYearsOfFreedom(monthsOfFreedom),
			description: `If you build this corpus, it represents about ${formatYearsOfFreedom(monthsOfFreedom)} of your current ${formatCurrency(inputs.monthlyExpenses)}/mo lifestyle.`,
			tone: "surprise",
		});
	}

	return insights;
}
