import { SALARY_MILESTONES } from "./constants";
import type {
	HistoricalIntervalInsight,
	ProjectionPoint,
	SalaryGrowthReport,
	SalaryHistoryEntry,
	SalaryInsight,
} from "./types";

function formatLpa(lpa: number) {
	if (lpa >= 100) return `₹${(lpa / 100).toFixed(2)}Cr`;
	return `₹${lpa.toFixed(1)}L`;
}

function formatLpaChange(lpa: number) {
	const sign = lpa > 0 ? "+" : "";
	return `${sign}${formatLpa(lpa)}`;
}

export function buildSimpleInsights({
	currentSalaryLpa,
	projectedSalaryLpa,
	projectedRealSalaryLpa,
	totalGainLpa,
	realGainLpa,
	firstMilestoneLabel,
	firstMilestoneYear,
	baseYear,
	inflationAdjusted,
}: {
	currentSalaryLpa: number;
	projectedSalaryLpa: number;
	projectedRealSalaryLpa: number | null;
	totalGainLpa: number;
	realGainLpa: number | null;
	firstMilestoneLabel: string | null;
	firstMilestoneYear: number | null;
	baseYear: number;
	inflationAdjusted: boolean;
}): SalaryInsight[] {
	const insights: SalaryInsight[] = [
		{
			title: "Total gain",
			value: formatLpaChange(totalGainLpa),
			description: `Your salary moves from ${formatLpa(currentSalaryLpa)} to ${formatLpa(projectedSalaryLpa)} across the selected horizon.`,
			tone: "positive",
		},
	];

	if (firstMilestoneLabel && firstMilestoneYear) {
		insights.push({
			title: "Next milestone",
			value: `${firstMilestoneLabel} by ${firstMilestoneYear}`,
			description: `At this increment rate, you are projected to cross ${firstMilestoneLabel} in about ${firstMilestoneYear - baseYear} year(s).`,
			tone: "neutral",
		});
	}

	if (
		inflationAdjusted &&
		projectedRealSalaryLpa !== null &&
		realGainLpa !== null
	) {
		insights.push({
			title: "Real purchasing power",
			value: formatLpaChange(realGainLpa),
			description:
				realGainLpa >= 0
					? `After inflation, your projected salary still lands near ${formatLpa(projectedRealSalaryLpa)} in today's money.`
					: `Inflation eats into this path, leaving you with roughly ${formatLpa(projectedRealSalaryLpa)} in today's money.`,
			tone: realGainLpa >= 0 ? "positive" : "caution",
		});
	}

	return insights;
}

function findBestInterval(intervals: HistoricalIntervalInsight[]) {
	return intervals.reduce<HistoricalIntervalInsight | null>(
		(best, interval) => {
			if (!best || interval.annualizedGrowthPct > best.annualizedGrowthPct) {
				return interval;
			}
			return best;
		},
		null,
	);
}

function findWeakestInterval(intervals: HistoricalIntervalInsight[]) {
	return intervals.reduce<HistoricalIntervalInsight | null>(
		(weakest, interval) => {
			if (
				!weakest ||
				interval.annualizedGrowthPct < weakest.annualizedGrowthPct
			) {
				return interval;
			}
			return weakest;
		},
		null,
	);
}

function findNextMilestone(points: ProjectionPoint[], latestSalaryLpa: number) {
	const upcomingMilestone = SALARY_MILESTONES.find(
		(milestone) => milestone.valueLpa > latestSalaryLpa,
	);

	if (!upcomingMilestone) {
		return { year: null, label: null };
	}

	const hitPoint = points.find(
		(point) =>
			point.year > points[0].year &&
			point.nominalSalaryLpa >= upcomingMilestone.valueLpa,
	);

	return {
		year: hitPoint?.year ?? null,
		label: upcomingMilestone.label,
	};
}

export function buildAdvancedReport({
	history,
	points,
	historicalIntervals,
	inflationAdjusted,
}: {
	history: SalaryHistoryEntry[];
	points: ProjectionPoint[];
	historicalIntervals: HistoricalIntervalInsight[];
	inflationAdjusted: boolean;
}): SalaryGrowthReport {
	const startEntry = history[0];
	const latestEntry = history.at(-1) ?? startEntry;
	const projectedEnd = points.at(-1) ?? points[0];
	const yearsSpan = Math.max(0, latestEntry.year - startEntry.year);
	const cagrPct =
		yearsSpan <= 0
			? null
			: ((latestEntry.salaryLpa / startEntry.salaryLpa) ** (1 / yearsSpan) -
					1) *
				100;
	const absoluteGrowthLpa = latestEntry.salaryLpa - startEntry.salaryLpa;
	const bestInterval = findBestInterval(historicalIntervals);
	const weakestInterval = findWeakestInterval(historicalIntervals);
	const nextMilestone = findNextMilestone(points, latestEntry.salaryLpa);
	const projectedEndRealSalaryLpa = projectedEnd.realSalaryLpa;
	const switchVsStayDeltaLpa =
		projectedEnd.staySalaryLpa === null
			? null
			: projectedEnd.nominalSalaryLpa - projectedEnd.staySalaryLpa;

	const insights: SalaryInsight[] = [
		{
			title: "Historical growth",
			value: `${latestEntry.year - startEntry.year} years`,
			description: `You moved from ${formatLpa(startEntry.salaryLpa)} to ${formatLpa(latestEntry.salaryLpa)}, a ${formatLpaChange(absoluteGrowthLpa)} increase.`,
			tone: "positive",
		},
	];

	if (cagrPct !== null) {
		insights.push({
			title: "CAGR",
			value: `${cagrPct.toFixed(1)}%`,
			description:
				"This smooths out uneven jumps and shows your annualized salary growth across the full timeline.",
			tone: cagrPct >= 10 ? "positive" : "neutral",
		});
	}

	if (bestInterval) {
		insights.push({
			title: "Best jump",
			value: `${bestInterval.fromYear} → ${bestInterval.toYear}`,
			description: `${formatLpa(bestInterval.startSalaryLpa)} to ${formatLpa(bestInterval.endSalaryLpa)} at an annualized ${bestInterval.annualizedGrowthPct.toFixed(1)}%.`,
			tone: "positive",
		});
	}

	if (switchVsStayDeltaLpa !== null) {
		insights.push({
			title: "Switch vs stay",
			value: formatLpaChange(switchVsStayDeltaLpa),
			description:
				switchVsStayDeltaLpa >= 0
					? "The current switch cadence beats a stay-only path by the end of the forecast."
					: "The stay-only path ends stronger than your current switch assumptions.",
			tone: switchVsStayDeltaLpa >= 0 ? "positive" : "caution",
		});
	}

	if (inflationAdjusted && projectedEndRealSalaryLpa !== null) {
		insights.push({
			title: "Inflation-adjusted outlook",
			value: formatLpa(projectedEndRealSalaryLpa),
			description:
				"This is your projected end salary expressed in latest-year purchasing power.",
			tone:
				projectedEndRealSalaryLpa >= latestEntry.salaryLpa
					? "positive"
					: "caution",
		});
	}

	const narrativeParts = [
		`From ${latestEntry.year - startEntry.year > 0 ? startEntry.year : latestEntry.year} to ${latestEntry.year}, your salary grew from ${formatLpa(startEntry.salaryLpa)} to ${formatLpa(latestEntry.salaryLpa)}.`,
		cagrPct !== null
			? `That works out to roughly ${cagrPct.toFixed(1)}% CAGR across the full timeline.`
			: "You only have one historical point, so CAGR is not meaningful yet.",
		bestInterval
			? `Your strongest jump was ${bestInterval.fromYear} to ${bestInterval.toYear}.`
			: "Add more history to surface your strongest salary jump.",
		nextMilestone.year && nextMilestone.label
			? `On the current forecast, you next cross ${nextMilestone.label} in ${nextMilestone.year}.`
			: "The current forecast does not cross the next milestone inside the selected horizon.",
		switchVsStayDeltaLpa !== null
			? `Compared with staying put, this path ends ${switchVsStayDeltaLpa >= 0 ? "higher" : "lower"} by ${formatLpa(Math.abs(switchVsStayDeltaLpa))}.`
			: "Switch-vs-stay comparison becomes available once forecasting begins.",
	];

	return {
		narrative: narrativeParts.join(" "),
		insights,
		startSalaryLpa: startEntry.salaryLpa,
		latestSalaryLpa: latestEntry.salaryLpa,
		absoluteGrowthLpa,
		totalMultiple: latestEntry.salaryLpa / startEntry.salaryLpa,
		cagrPct,
		bestInterval,
		weakestInterval,
		nextMilestoneYear: nextMilestone.year,
		nextMilestoneLabel: nextMilestone.label,
		projectedEndSalaryLpa: projectedEnd.nominalSalaryLpa,
		projectedEndRealSalaryLpa,
		switchVsStayDeltaLpa,
	};
}
