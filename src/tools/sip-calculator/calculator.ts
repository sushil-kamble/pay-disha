import {
	getSipDefaults,
	SIP_DELAY_YEARS,
	SIP_MILESTONES,
	SIP_SCENARIO_BANDS,
} from "./constants";
import { buildSipInsights } from "./insights";
import type {
	SipDelayCost,
	SipInputs,
	SipLeverImpact,
	SipLeverScenario,
	SipMilestoneHit,
	SipProjectionPoint,
	SipResult,
	SipScenarioBand,
} from "./types";

const MAX_SOLVER_YEARS = 60;

type SimulationSummary = {
	corpus: number;
	investedAmount: number;
	gains: number;
	realCorpus: number;
	goalAmount: number;
	gap: number;
	currentSip: number;
};

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function formatCurrency(value: number): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}\u20B9${(abs / 10000000).toFixed(2)} Cr`;
	if (abs >= 100000) return `${sign}\u20B9${(abs / 100000).toFixed(1)} L`;
	if (abs >= 1000) return `${sign}\u20B9${(abs / 1000).toFixed(1)}K`;
	return `${sign}\u20B9${Math.round(abs)}`;
}

export function formatIndian(value: number) {
	return Math.round(value).toLocaleString("en-IN");
}

export function toEffectiveMonthlyRate(annualRatePct: number) {
	return (1 + annualRatePct / 100) ** (1 / 12) - 1;
}

export function inflateAmount(
	amount: number,
	annualRatePct: number,
	years: number,
) {
	return amount * (1 + annualRatePct / 100) ** years;
}

function sanitizeInputs(inputs: SipInputs): SipInputs {
	return {
		...inputs,
		targetAmountToday: Math.max(0, inputs.targetAmountToday),
		yearsToGoal: clamp(Math.round(inputs.yearsToGoal), 1, MAX_SOLVER_YEARS),
		monthlySip: Math.max(0, inputs.monthlySip),
		startingCorpus: Math.max(0, inputs.startingCorpus),
		annualStepUpPct: clamp(inputs.annualStepUpPct, 0, 200),
		expectedReturnPct: clamp(inputs.expectedReturnPct, 0, 40),
		realValueInflationPct: clamp(inputs.realValueInflationPct, 0, 25),
		goalInflationPct: clamp(inputs.goalInflationPct, 0, 25),
		monthlyExpenses:
			inputs.monthlyExpenses !== null && inputs.monthlyExpenses > 0
				? inputs.monthlyExpenses
				: null,
	};
}

function simulatePlan({
	inputs,
	totalMonths,
	monthlySip = inputs.monthlySip,
	startingCorpus = inputs.startingCorpus,
	annualStepUpPct = inputs.annualStepUpPct,
	expectedReturnPct = inputs.expectedReturnPct,
	startDelayMonths = 0,
	collectPoints = false,
}: {
	inputs: SipInputs;
	totalMonths: number;
	monthlySip?: number;
	startingCorpus?: number;
	annualStepUpPct?: number;
	expectedReturnPct?: number;
	startDelayMonths?: number;
	collectPoints?: boolean;
}) {
	const monthlyReturnRate = toEffectiveMonthlyRate(expectedReturnPct);
	const monthlyGoalInflationRate = toEffectiveMonthlyRate(
		inputs.goalInflationPct,
	);
	const monthlyRealInflationRate = toEffectiveMonthlyRate(
		inputs.realValueInflationPct,
	);

	let corpus = startingCorpus;
	let investedAmount = startingCorpus;
	let currentSip = monthlySip;
	const points: SipProjectionPoint[] = [];

	const pushPoint = (month: number) => {
		const yearOffset = Math.round(month / 12);
		const goalAmount =
			inputs.targetAmountToday * (1 + monthlyGoalInflationRate) ** month;
		const realCorpus = corpus / (1 + monthlyRealInflationRate) ** month;
		points.push({
			yearOffset,
			calendarYear: inputs.startYear + yearOffset,
			investedAmount: Math.round(investedAmount),
			corpus: Math.round(corpus),
			gains: Math.round(corpus - investedAmount),
			realCorpus: Math.round(realCorpus),
			goalAmount: Math.round(goalAmount),
			gap: Math.round(corpus - goalAmount),
		});
	};

	if (collectPoints) {
		pushPoint(0);
	}

	for (let month = 1; month <= totalMonths; month++) {
		corpus *= 1 + monthlyReturnRate;

		if (month > startDelayMonths && currentSip > 0) {
			corpus += currentSip;
			investedAmount += currentSip;
		}

		if (collectPoints && month % 12 === 0) {
			pushPoint(month);
		}

		if (
			month > startDelayMonths &&
			annualStepUpPct > 0 &&
			(month - startDelayMonths) % 12 === 0
		) {
			currentSip *= 1 + annualStepUpPct / 100;
		}
	}

	const goalAmount =
		inputs.targetAmountToday *
		(1 + monthlyGoalInflationRate) ** Math.max(totalMonths, 0);
	const realCorpus =
		corpus / (1 + monthlyRealInflationRate) ** Math.max(totalMonths, 0);

	return {
		corpus,
		investedAmount,
		gains: corpus - investedAmount,
		realCorpus,
		goalAmount,
		gap: corpus - goalAmount,
		currentSip,
		points,
	};
}

function solveYearsToTarget(inputs: SipInputs): number | null {
	const monthlyReturnRate = toEffectiveMonthlyRate(inputs.expectedReturnPct);
	const monthlyGoalInflationRate = toEffectiveMonthlyRate(
		inputs.goalInflationPct,
	);
	let corpus = inputs.startingCorpus;
	let currentSip = inputs.monthlySip;
	let investedMonths = 0;

	for (let month = 0; month <= MAX_SOLVER_YEARS * 12; month++) {
		const goalAmount =
			inputs.targetAmountToday * (1 + monthlyGoalInflationRate) ** month;
		if (corpus >= goalAmount) {
			return Math.ceil((month / 12) * 10) / 10;
		}

		corpus *= 1 + monthlyReturnRate;
		if (currentSip > 0) {
			corpus += currentSip;
			investedMonths += 1;
		}
		if (
			inputs.annualStepUpPct > 0 &&
			investedMonths > 0 &&
			month < MAX_SOLVER_YEARS * 12
		) {
			if (investedMonths % 12 === 0) {
				currentSip *= 1 + inputs.annualStepUpPct / 100;
			}
		}
	}

	return null;
}

function solveRequiredMonthlySip(inputs: SipInputs): number | null {
	const months = inputs.yearsToGoal * 12;
	const baseline = simulatePlan({
		inputs,
		totalMonths: months,
		monthlySip: 0,
	});

	if (baseline.corpus >= baseline.goalAmount) return 0;

	let high = Math.max(1000, inputs.monthlySip || 1000);
	for (let step = 0; step < 25; step++) {
		const trial = simulatePlan({
			inputs,
			totalMonths: months,
			monthlySip: high,
		});
		if (trial.corpus >= trial.goalAmount) break;
		high *= 2;
		if (high > 100000000) {
			return null;
		}
	}

	let low = 0;
	for (let index = 0; index < 60; index++) {
		const mid = (low + high) / 2;
		const trial = simulatePlan({
			inputs,
			totalMonths: months,
			monthlySip: mid,
		});
		if (trial.corpus >= trial.goalAmount) {
			high = mid;
		} else {
			low = mid;
		}
	}

	return Math.ceil(high);
}

function solveRequiredAnnualStepUp(inputs: SipInputs): number | null {
	if (inputs.monthlySip <= 0) {
		const baseline = simulatePlan({
			inputs,
			totalMonths: inputs.yearsToGoal * 12,
			monthlySip: 0,
		});
		return baseline.corpus >= baseline.goalAmount ? 0 : null;
	}

	const noStepUp = simulatePlan({
		inputs,
		totalMonths: inputs.yearsToGoal * 12,
		annualStepUpPct: 0,
	});
	if (noStepUp.corpus >= noStepUp.goalAmount) return 0;

	let high = Math.max(5, inputs.annualStepUpPct || 5);
	for (let step = 0; step < 20; step++) {
		const trial = simulatePlan({
			inputs,
			totalMonths: inputs.yearsToGoal * 12,
			annualStepUpPct: high,
		});
		if (trial.corpus >= trial.goalAmount) break;
		high *= 2;
		if (high > 200) return null;
	}

	let low = 0;
	for (let index = 0; index < 60; index++) {
		const mid = (low + high) / 2;
		const trial = simulatePlan({
			inputs,
			totalMonths: inputs.yearsToGoal * 12,
			annualStepUpPct: mid,
		});
		if (trial.corpus >= trial.goalAmount) {
			high = mid;
		} else {
			low = mid;
		}
	}

	return Math.round(high * 10) / 10;
}

function buildDelayCosts(inputs: SipInputs): SipDelayCost[] {
	const totalMonths = inputs.yearsToGoal * 12;
	return SIP_DELAY_YEARS.map((delayYears) => {
		const delayMonths = delayYears * 12;
		const delayedProjection = simulatePlan({
			inputs,
			totalMonths,
			startDelayMonths: delayMonths,
		});

		if (delayMonths >= totalMonths) {
			return {
				delayYears,
				requiredMonthlySip: null,
				additionalMonthlySip: null,
				projectedCorpus: Math.round(delayedProjection.corpus),
				gap: Math.round(delayedProjection.gap),
			};
		}

		const requiredMonthlySip = solveRequiredMonthlySip({
			...inputs,
			yearsToGoal: inputs.yearsToGoal,
		});

		let adjustedRequiredSip: number | null = null;
		if (requiredMonthlySip !== null) {
			const remainingInputs = {
				...inputs,
				yearsToGoal: inputs.yearsToGoal,
			};
			let high = Math.max(requiredMonthlySip, inputs.monthlySip || 1000);
			for (let step = 0; step < 25; step++) {
				const trial = simulatePlan({
					inputs: remainingInputs,
					totalMonths,
					startDelayMonths: delayMonths,
					monthlySip: high,
				});
				if (trial.corpus >= trial.goalAmount) break;
				high *= 2;
				if (high > 100000000) {
					high = Number.POSITIVE_INFINITY;
					break;
				}
			}

			if (Number.isFinite(high)) {
				let low = 0;
				for (let index = 0; index < 60; index++) {
					const mid = (low + high) / 2;
					const trial = simulatePlan({
						inputs: remainingInputs,
						totalMonths,
						startDelayMonths: delayMonths,
						monthlySip: mid,
					});
					if (trial.corpus >= trial.goalAmount) {
						high = mid;
					} else {
						low = mid;
					}
				}
				adjustedRequiredSip = Math.ceil(high);
			}
		}

		return {
			delayYears,
			requiredMonthlySip: adjustedRequiredSip,
			additionalMonthlySip:
				adjustedRequiredSip !== null
					? Math.max(0, adjustedRequiredSip - inputs.monthlySip)
					: null,
			projectedCorpus: Math.round(delayedProjection.corpus),
			gap: Math.round(delayedProjection.gap),
		};
	});
}

function buildMilestoneHits(inputs: SipInputs): SipMilestoneHit[] {
	const monthlyReturnRate = toEffectiveMonthlyRate(inputs.expectedReturnPct);
	const corpus = inputs.startingCorpus;
	const currentSip = inputs.monthlySip;

	return SIP_MILESTONES.map((milestone) => {
		let localCorpus = corpus;
		let localSip = currentSip;
		let hitMonth: number | null = localCorpus >= milestone.value ? 0 : null;

		for (
			let month = 1;
			hitMonth === null && month <= MAX_SOLVER_YEARS * 12;
			month++
		) {
			localCorpus = localCorpus * (1 + monthlyReturnRate) + localSip;
			if (localCorpus >= milestone.value) {
				hitMonth = month;
				break;
			}
			if (inputs.annualStepUpPct > 0 && month % 12 === 0) {
				localSip *= 1 + inputs.annualStepUpPct / 100;
			}
		}

		return {
			label: milestone.label,
			value: milestone.value,
			yearOffset:
				hitMonth !== null ? Math.ceil((hitMonth / 12) * 10) / 10 : null,
			calendarYear:
				hitMonth !== null
					? inputs.startYear + Math.ceil((hitMonth / 12) * 10) / 10
					: null,
		};
	});
}

function buildScenarioBands(inputs: SipInputs): SipScenarioBand[] {
	const months = inputs.yearsToGoal * 12;
	return SIP_SCENARIO_BANDS.map((band) => {
		const projection = simulatePlan({
			inputs,
			totalMonths: months,
			expectedReturnPct: band.annualReturnPct,
		});
		return {
			label: band.label,
			annualReturnPct: band.annualReturnPct,
			projectedCorpus: Math.round(projection.corpus),
			gap: Math.round(projection.gap),
			isOnTrack: projection.gap >= 0,
		};
	});
}

function getLeverImpact(baseGap: number, scenarioGap: number): SipLeverImpact {
	if (baseGap <= 0) {
		if (scenarioGap >= baseGap + Math.abs(baseGap) * 0.15) return "high";
		if (scenarioGap >= baseGap + Math.abs(baseGap) * 0.05) return "medium";
		return "low";
	}

	if (scenarioGap >= 0) return "high";
	const reduction = Math.max(0, baseGap - Math.max(scenarioGap, 0));
	const ratio = reduction / baseGap;

	if (ratio >= 0.5) return "high";
	if (ratio >= 0.2) return "medium";
	return "low";
}

function buildLeverScenarios(inputs: SipInputs, baseResult: SimulationSummary) {
	const leverVariants: Array<{
		id: string;
		label: string;
		description: string;
		nextInputs: SipInputs;
	}> = [
		{
			id: "increase-sip",
			label: "Increase SIP by \u20B95,000/mo",
			description:
				"Raise the monthly contribution without changing the goal date.",
			nextInputs: {
				...inputs,
				monthlySip: inputs.monthlySip + 5000,
			},
		},
		{
			id: "step-up",
			label: "Add a 5% annual step-up",
			description: "Let salary growth do part of the heavy lifting each year.",
			nextInputs: {
				...inputs,
				annualStepUpPct: inputs.annualStepUpPct + 5,
			},
		},
		{
			id: "starting-corpus",
			label: "Add a \u20B91L head start",
			description: "A one-time boost compounds for the full journey.",
			nextInputs: {
				...inputs,
				startingCorpus: inputs.startingCorpus + 100000,
			},
		},
		{
			id: "extend-goal",
			label: "Extend the goal by 2 years",
			description:
				"More time increases compounding, even after the goal itself inflates further.",
			nextInputs: {
				...inputs,
				yearsToGoal: Math.min(inputs.yearsToGoal + 2, MAX_SOLVER_YEARS),
			},
		},
	];

	return leverVariants.map<SipLeverScenario>((scenario) => {
		const months = scenario.nextInputs.yearsToGoal * 12;
		const projection = simulatePlan({
			inputs: scenario.nextInputs,
			totalMonths: months,
		});
		return {
			id: scenario.id,
			label: scenario.label,
			description: scenario.description,
			projectedCorpus: Math.round(projection.corpus),
			gap: Math.round(projection.gap),
			isOnTrack: projection.gap >= 0,
			yearsToTarget: solveYearsToTarget(scenario.nextInputs),
			impact: getLeverImpact(baseResult.gap, projection.gap),
		};
	});
}

export function calculateSipPlan(
	inputs: SipInputs = getSipDefaults(),
): SipResult {
	const safeInputs = sanitizeInputs(inputs);
	const totalMonths = safeInputs.yearsToGoal * 12;
	const targetProjection = simulatePlan({
		inputs: safeInputs,
		totalMonths,
	});

	const yearsToTarget = solveYearsToTarget(safeInputs);
	const projectionYears = Math.min(
		MAX_SOLVER_YEARS,
		Math.max(
			safeInputs.yearsToGoal,
			yearsToTarget !== null
				? Math.ceil(yearsToTarget) + 2
				: safeInputs.yearsToGoal,
		),
	);
	const extendedProjection = simulatePlan({
		inputs: safeInputs,
		totalMonths: projectionYears * 12,
		collectPoints: true,
	});
	const extraYearsNeeded =
		yearsToTarget === null
			? null
			: Math.max(
					0,
					Math.round((yearsToTarget - safeInputs.yearsToGoal) * 10) / 10,
				);
	const requiredMonthlySip = solveRequiredMonthlySip(safeInputs);
	const requiredAnnualStepUpPct = solveRequiredAnnualStepUp(safeInputs);
	const delayCosts = buildDelayCosts(safeInputs);
	const milestoneHits = buildMilestoneHits(safeInputs);
	const scenarioBands = buildScenarioBands(safeInputs);

	const compoundingCrossoverPoint = extendedProjection.points.find(
		(point) => point.gains >= point.investedAmount,
	);
	const contributionsAtTarget = Math.round(targetProjection.investedAmount);
	const gainsAtTarget = Math.round(targetProjection.gains);
	const totalAtTarget = Math.max(1, targetProjection.corpus);
	const startingCorpusFutureValue = Math.round(
		safeInputs.startingCorpus *
			(1 + toEffectiveMonthlyRate(safeInputs.expectedReturnPct)) ** totalMonths,
	);
	const result: SipResult = {
		inputs: safeInputs,
		goalCalendarYear: safeInputs.startYear + safeInputs.yearsToGoal,
		goalAmountAtTarget: Math.round(targetProjection.goalAmount),
		projectedCorpusAtTarget: Math.round(targetProjection.corpus),
		realCorpusAtTarget: Math.round(targetProjection.realCorpus),
		targetGap: Math.round(targetProjection.gap),
		isOnTrack: targetProjection.gap >= 0,
		requiredMonthlySip,
		requiredAnnualStepUpPct,
		yearsToTarget,
		extraYearsNeeded,
		delayCosts,
		projectionPoints: extendedProjection.points,
		milestoneHits,
		scenarioBands,
		compoundingCrossoverYear: compoundingCrossoverPoint?.yearOffset ?? null,
		compoundingCrossoverCalendarYear:
			compoundingCrossoverPoint?.calendarYear ?? null,
		contributionsAtTarget,
		gainsAtTarget,
		contributionSharePct: (contributionsAtTarget / totalAtTarget) * 100,
		growthSharePct: (gainsAtTarget / totalAtTarget) * 100,
		startingCorpusFutureValue,
		startingCorpusSharePct:
			targetProjection.corpus <= 0
				? 0
				: (startingCorpusFutureValue / targetProjection.corpus) * 100,
		insights: [],
		leverScenarios: [],
	};

	result.leverScenarios = buildLeverScenarios(safeInputs, targetProjection);
	result.insights = buildSipInsights(result);

	return result;
}
