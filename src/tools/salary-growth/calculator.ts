import {
	ADVANCED_INPUT_LIMITS,
	SALARY_MILESTONES,
	SIMPLE_INPUT_LIMITS,
	VALIDATION_MESSAGES,
} from "./constants";
import { buildAdvancedReport, buildSimpleInsights } from "./insights";
import type {
	AdvancedProjectionResult,
	AdvancedSalaryGrowthInputs,
	FutureSalaryOverride,
	HistoricalIntervalInsight,
	ProjectionPoint,
	SalaryHistoryEntry,
	SimpleProjectionResult,
	SimpleSalaryGrowthInputs,
} from "./types";

export function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function formatIndian(num: number): string {
	return Math.round(num).toLocaleString("en-IN");
}

export function formatShortCurrency(numRupees: number): string {
	const abs = Math.abs(numRupees);
	const sign = numRupees < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
	if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
	if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
	return `${sign}₹${Math.round(abs)}`;
}

export function lpaToRupees(lpa: number) {
	return lpa * 100000;
}

export function formatLpa(lpa: number) {
	if (lpa >= 100) return `₹${(lpa / 100).toFixed(2)}Cr`;
	return `₹${lpa.toFixed(1)}L`;
}

export function formatLpaChange(lpa: number) {
	const sign = lpa > 0 ? "+" : "";
	return `${sign}${formatLpa(lpa)}`;
}

function round2(value: number) {
	return Number(value.toFixed(2));
}

function applyForwardInflation(
	value: number,
	inflationRatePct: number,
	years: number,
) {
	return value * (1 + inflationRatePct / 100) ** years;
}

function applyDiscountedInflation(
	value: number,
	inflationRatePct: number,
	years: number,
) {
	return value / (1 + inflationRatePct / 100) ** years;
}

function getMilestoneCrossing(previousLpa: number, currentLpa: number) {
	let crossedLabel: string | null = null;

	for (const milestone of SALARY_MILESTONES) {
		if (previousLpa < milestone.valueLpa && currentLpa >= milestone.valueLpa) {
			crossedLabel = milestone.label;
		}
	}

	return crossedLabel;
}

export function calculateSimpleProjection(
	inputs: SimpleSalaryGrowthInputs,
): SimpleProjectionResult {
	const currentSalaryLpa = clamp(
		inputs.currentSalaryLpa,
		SIMPLE_INPUT_LIMITS.minSalaryLpa,
		SIMPLE_INPUT_LIMITS.maxSalaryLpa,
	);
	const yearlyIncrementPct = clamp(
		inputs.yearlyIncrementPct,
		SIMPLE_INPUT_LIMITS.minYearlyIncrementPct,
		SIMPLE_INPUT_LIMITS.maxYearlyIncrementPct,
	);
	const projectionYears = clamp(
		Math.round(inputs.projectionYears),
		SIMPLE_INPUT_LIMITS.minProjectionYears,
		SIMPLE_INPUT_LIMITS.maxProjectionYears,
	);
	const inflationRatePct = clamp(
		inputs.inflationRatePct,
		SIMPLE_INPUT_LIMITS.minInflationRatePct,
		SIMPLE_INPUT_LIMITS.maxInflationRatePct,
	);

	const points: ProjectionPoint[] = [];
	let firstMilestoneLabel: string | null = null;
	let firstMilestoneYear: number | null = null;

	for (let offset = 0; offset <= projectionYears; offset += 1) {
		const year = inputs.baseYear + offset;
		const nominalSalaryLpa = round2(
			currentSalaryLpa * (1 + yearlyIncrementPct / 100) ** offset,
		);
		const realSalaryLpa = inputs.inflationAdjusted
			? round2(
					applyDiscountedInflation(nominalSalaryLpa, inflationRatePct, offset),
				)
			: null;
		const previousSalaryLpa =
			offset === 0
				? currentSalaryLpa
				: round2(
						currentSalaryLpa * (1 + yearlyIncrementPct / 100) ** (offset - 1),
					);
		const milestoneLabel =
			offset === 0
				? getMilestoneCrossing(0, nominalSalaryLpa)
				: getMilestoneCrossing(previousSalaryLpa, nominalSalaryLpa);

		if (!firstMilestoneLabel && milestoneLabel) {
			firstMilestoneLabel = milestoneLabel;
			firstMilestoneYear = year;
		}

		points.push({
			year,
			label: String(year),
			nominalSalaryLpa,
			realSalaryLpa,
			actualSalaryLpa: offset === 0 ? nominalSalaryLpa : null,
			projectedSalaryLpa: nominalSalaryLpa,
			staySalaryLpa: null,
			eventType: offset === 0 ? "history" : "increment",
			growthPct:
				offset === 0 || previousSalaryLpa <= 0
					? null
					: round2(
							((nominalSalaryLpa - previousSalaryLpa) / previousSalaryLpa) *
								100,
						),
			annualizedGrowthPct: null,
			milestoneLabel,
		});
	}

	const projectedSalaryLpa =
		points.at(-1)?.nominalSalaryLpa ?? currentSalaryLpa;
	const projectedRealSalaryLpa = points.at(-1)?.realSalaryLpa ?? null;
	const totalGainLpa = round2(projectedSalaryLpa - currentSalaryLpa);
	const realGainLpa =
		projectedRealSalaryLpa === null
			? null
			: round2(projectedRealSalaryLpa - currentSalaryLpa);

	return {
		inputs: {
			...inputs,
			currentSalaryLpa,
			yearlyIncrementPct,
			projectionYears,
			inflationRatePct,
		},
		points,
		projectedSalaryLpa,
		projectedRealSalaryLpa,
		totalGainLpa,
		realGainLpa,
		firstMilestoneLabel,
		firstMilestoneYear,
		insights: buildSimpleInsights({
			currentSalaryLpa,
			projectedSalaryLpa,
			projectedRealSalaryLpa,
			totalGainLpa,
			realGainLpa,
			firstMilestoneLabel,
			firstMilestoneYear,
			baseYear: inputs.baseYear,
			inflationAdjusted: inputs.inflationAdjusted,
		}),
	};
}

function uniqueNumericEntries<T extends { year: number; salaryLpa: number }>(
	entries: T[],
) {
	return entries.map((entry) => ({
		year: Number.isFinite(entry.year) ? Math.round(entry.year) : Number.NaN,
		salaryLpa: Number.isFinite(entry.salaryLpa)
			? round2(entry.salaryLpa)
			: Number.NaN,
	}));
}

export function calculateAnnualizedGrowth(
	startSalaryLpa: number,
	endSalaryLpa: number,
	years: number,
) {
	if (years <= 0 || startSalaryLpa <= 0 || endSalaryLpa <= 0) return null;
	return ((endSalaryLpa / startSalaryLpa) ** (1 / years) - 1) * 100;
}

export function buildHistoricalIntervals(history: SalaryHistoryEntry[]) {
	const intervals: HistoricalIntervalInsight[] = [];

	for (let index = 1; index < history.length; index += 1) {
		const previous = history[index - 1];
		const current = history[index];
		const yearGap = current.year - previous.year;
		const annualizedGrowthPct = calculateAnnualizedGrowth(
			previous.salaryLpa,
			current.salaryLpa,
			yearGap,
		);

		if (yearGap <= 0 || annualizedGrowthPct === null) continue;

		intervals.push({
			fromYear: previous.year,
			toYear: current.year,
			startSalaryLpa: previous.salaryLpa,
			endSalaryLpa: current.salaryLpa,
			absoluteGrowthLpa: round2(current.salaryLpa - previous.salaryLpa),
			growthPct: round2(
				((current.salaryLpa - previous.salaryLpa) / previous.salaryLpa) * 100,
			),
			annualizedGrowthPct: round2(annualizedGrowthPct),
		});
	}

	return intervals;
}

function getRealLpaRelativeToBaseYear(
	nominalLpa: number,
	year: number,
	baseYear: number,
	inflationRatePct: number,
) {
	if (year === baseYear) return nominalLpa;
	if (year < baseYear) {
		return applyForwardInflation(nominalLpa, inflationRatePct, baseYear - year);
	}
	return applyDiscountedInflation(
		nominalLpa,
		inflationRatePct,
		year - baseYear,
	);
}

function validateInputs(
	history: SalaryHistoryEntry[],
	overrides: FutureSalaryOverride[],
) {
	const errors: string[] = [];

	if (history.length === 0) {
		errors.push(VALIDATION_MESSAGES.needAtLeastOneHistoryRow);
		return errors;
	}

	const historyYears = new Set<number>();
	for (const entry of history) {
		if (
			entry.year < ADVANCED_INPUT_LIMITS.minYear ||
			entry.year > ADVANCED_INPUT_LIMITS.maxYear
		) {
			errors.push(VALIDATION_MESSAGES.historyYearRequired);
			break;
		}
		if (entry.salaryLpa <= 0) {
			errors.push(VALIDATION_MESSAGES.historySalaryRequired);
			break;
		}
		if (historyYears.has(entry.year)) {
			errors.push(VALIDATION_MESSAGES.historyYearDuplicate);
			break;
		}
		historyYears.add(entry.year);
	}

	const latestHistoryYear = Math.max(
		...history
			.filter((entry) => Number.isFinite(entry.year))
			.map((entry) => entry.year),
		Number.NEGATIVE_INFINITY,
	);
	const overrideYears = new Set<number>();

	for (const entry of overrides) {
		if (
			entry.year < ADVANCED_INPUT_LIMITS.minYear ||
			entry.year > ADVANCED_INPUT_LIMITS.maxYear
		) {
			errors.push(VALIDATION_MESSAGES.overrideYearRequired);
			break;
		}
		if (entry.salaryLpa <= 0) {
			errors.push(VALIDATION_MESSAGES.overrideSalaryRequired);
			break;
		}
		if (overrideYears.has(entry.year)) {
			errors.push(VALIDATION_MESSAGES.overrideYearDuplicate);
			break;
		}
		if (entry.year <= latestHistoryYear) {
			errors.push(VALIDATION_MESSAGES.overrideYearMustBeFuture);
			break;
		}
		overrideYears.add(entry.year);
	}

	return errors;
}

export function calculateAdvancedProjection(
	inputs: AdvancedSalaryGrowthInputs,
): AdvancedProjectionResult {
	const normalizedHistory = uniqueNumericEntries(inputs.history)
		.map((entry) => ({
			year: clamp(
				entry.year,
				ADVANCED_INPUT_LIMITS.minYear,
				ADVANCED_INPUT_LIMITS.maxYear,
			),
			salaryLpa: clamp(
				entry.salaryLpa,
				ADVANCED_INPUT_LIMITS.minSalaryLpa,
				ADVANCED_INPUT_LIMITS.maxSalaryLpa,
			),
		}))
		.sort((first, second) => first.year - second.year);

	const normalizedOverrides = uniqueNumericEntries(inputs.overrides)
		.map((entry) => ({
			year: clamp(
				entry.year,
				ADVANCED_INPUT_LIMITS.minYear,
				ADVANCED_INPUT_LIMITS.maxYear,
			),
			salaryLpa: clamp(
				entry.salaryLpa,
				ADVANCED_INPUT_LIMITS.minSalaryLpa,
				ADVANCED_INPUT_LIMITS.maxSalaryLpa,
			),
		}))
		.sort((first, second) => first.year - second.year);

	const validationErrors = validateInputs(
		normalizedHistory,
		normalizedOverrides,
	);

	if (validationErrors.length > 0) {
		return {
			inputs,
			validationErrors,
			normalizedHistory,
			normalizedOverrides,
			points: [],
			historicalIntervals: [],
			report: null,
		};
	}

	const annualIncrementPct = clamp(
		inputs.annualIncrementPct,
		ADVANCED_INPUT_LIMITS.minAnnualIncrementPct,
		ADVANCED_INPUT_LIMITS.maxAnnualIncrementPct,
	);
	const switchEveryYears = clamp(
		Math.round(inputs.switchEveryYears),
		ADVANCED_INPUT_LIMITS.minSwitchEveryYears,
		ADVANCED_INPUT_LIMITS.maxSwitchEveryYears,
	);
	const switchHikePct = clamp(
		inputs.switchHikePct,
		ADVANCED_INPUT_LIMITS.minSwitchHikePct,
		ADVANCED_INPUT_LIMITS.maxSwitchHikePct,
	);
	const projectionYears = clamp(
		Math.round(inputs.projectionYears),
		ADVANCED_INPUT_LIMITS.minProjectionYears,
		ADVANCED_INPUT_LIMITS.maxProjectionYears,
	);
	const inflationRatePct = clamp(
		inputs.inflationRatePct,
		ADVANCED_INPUT_LIMITS.minInflationRatePct,
		ADVANCED_INPUT_LIMITS.maxInflationRatePct,
	);

	const historicalIntervals = buildHistoricalIntervals(normalizedHistory);
	const startEntry = normalizedHistory[0];
	const latestEntry = normalizedHistory.at(-1) ?? startEntry;
	const overrideMap = new Map(
		normalizedOverrides.map((entry) => [entry.year, entry]),
	);
	const points: ProjectionPoint[] = [];

	for (let index = 0; index < normalizedHistory.length; index += 1) {
		const current = normalizedHistory[index];
		const previous = normalizedHistory[index - 1];
		const yearsElapsed = previous ? current.year - previous.year : 0;
		const previousNominal = previous?.salaryLpa ?? 0;
		const milestoneLabel = previous
			? getMilestoneCrossing(previousNominal, current.salaryLpa)
			: getMilestoneCrossing(0, current.salaryLpa);

		points.push({
			year: current.year,
			label: String(current.year),
			nominalSalaryLpa: current.salaryLpa,
			realSalaryLpa: inputs.inflationAdjusted
				? round2(
						getRealLpaRelativeToBaseYear(
							current.salaryLpa,
							current.year,
							latestEntry.year,
							inflationRatePct,
						),
					)
				: null,
			actualSalaryLpa: current.salaryLpa,
			projectedSalaryLpa: null,
			staySalaryLpa: null,
			eventType: "history",
			growthPct:
				!previous || previous.salaryLpa <= 0
					? null
					: round2(
							((current.salaryLpa - previous.salaryLpa) / previous.salaryLpa) *
								100,
						),
			annualizedGrowthPct:
				!previous || yearsElapsed <= 0
					? null
					: round2(
							calculateAnnualizedGrowth(
								previous.salaryLpa,
								current.salaryLpa,
								yearsElapsed,
							) ?? 0,
						),
			milestoneLabel,
		});
	}

	let projectedSalaryLpa = latestEntry.salaryLpa;
	let staySalaryLpa = latestEntry.salaryLpa;
	let lastResetYear = latestEntry.year;

	for (let offset = 1; offset <= projectionYears; offset += 1) {
		const year = latestEntry.year + offset;
		const override = overrideMap.get(year);
		let eventType: ProjectionPoint["eventType"] = "increment";

		if (override) {
			projectedSalaryLpa = override.salaryLpa;
			lastResetYear = year;
			eventType = "override";
		} else {
			const shouldSwitch = year - lastResetYear >= switchEveryYears;
			if (shouldSwitch) {
				projectedSalaryLpa = round2(
					projectedSalaryLpa * (1 + switchHikePct / 100),
				);
				lastResetYear = year;
				eventType = "switch";
			} else {
				projectedSalaryLpa = round2(
					projectedSalaryLpa * (1 + annualIncrementPct / 100),
				);
			}
		}

		staySalaryLpa = round2(staySalaryLpa * (1 + annualIncrementPct / 100));

		const previousPoint = points.at(-1);
		const previousNominal =
			previousPoint?.nominalSalaryLpa ?? latestEntry.salaryLpa;
		const milestoneLabel = getMilestoneCrossing(
			previousNominal,
			projectedSalaryLpa,
		);

		points.push({
			year,
			label: String(year),
			nominalSalaryLpa: projectedSalaryLpa,
			realSalaryLpa: inputs.inflationAdjusted
				? round2(
						getRealLpaRelativeToBaseYear(
							projectedSalaryLpa,
							year,
							latestEntry.year,
							inflationRatePct,
						),
					)
				: null,
			actualSalaryLpa: null,
			projectedSalaryLpa,
			staySalaryLpa,
			eventType,
			growthPct:
				previousNominal <= 0
					? null
					: round2(
							((projectedSalaryLpa - previousNominal) / previousNominal) * 100,
						),
			annualizedGrowthPct: null,
			milestoneLabel,
		});
	}

	return {
		inputs: {
			...inputs,
			annualIncrementPct,
			switchEveryYears,
			switchHikePct,
			projectionYears,
			inflationRatePct,
		},
		validationErrors,
		normalizedHistory,
		normalizedOverrides,
		points,
		historicalIntervals,
		report: buildAdvancedReport({
			history: normalizedHistory,
			points,
			historicalIntervals,
			inflationAdjusted: inputs.inflationAdjusted,
		}),
	};
}
