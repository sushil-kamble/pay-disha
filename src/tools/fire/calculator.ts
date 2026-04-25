import {
	FIRE_DEFAULTS,
	FIRE_MARKET_ASSUMPTIONS,
	FIRE_TYPE_CONFIG,
} from "./constants";
import { buildFireInsights, buildLeverScenarios } from "./insights";
import type {
	FireInputs,
	FireProjectionPoint,
	FireResult,
	FireType,
	FireTypeResult,
} from "./types";

const MAX_PROJECTION_YEARS = 50;

export function formatCurrency(value: number): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}\u20B9${(abs / 10000000).toFixed(2)} Cr`;
	if (abs >= 100000) return `${sign}\u20B9${(abs / 100000).toFixed(1)} L`;
	if (abs >= 1000) return `${sign}\u20B9${(abs / 1000).toFixed(1)}K`;
	return `${sign}\u20B9${Math.round(abs)}`;
}

export function formatIndian(num: number): string {
	return Math.round(num).toLocaleString("en-IN");
}

export function calculateAnnualExpensesForYears(
	inputs: Pick<FireInputs, "monthlyExpenses" | "inflationPct">,
	years: number,
): number {
	return inputs.monthlyExpenses * 12 * (1 + inputs.inflationPct / 100) ** years;
}

export function calculateFireTarget(
	inputs: Pick<FireInputs, "monthlyExpenses" | "inflationPct">,
	years: number,
) {
	return (
		calculateAnnualExpensesForYears(inputs, years) *
		FIRE_MARKET_ASSUMPTIONS.corpusMultiple
	);
}

function calculateEffectiveMonthlyReturn(returnPct: number): number {
	return (1 + returnPct / 100) ** (1 / 12) - 1;
}

function calculateCoastFireNumber(
	fireNumber: number,
	returnPct: number,
	years: number,
): number {
	return fireNumber / (1 + returnPct / 100) ** years;
}

function calculateBaristaMonthlyIncome(
	currentAnnualExpenses: number,
	currentPortfolio: number,
): number {
	const portfolioIncome =
		currentPortfolio / FIRE_MARKET_ASSUMPTIONS.corpusMultiple;
	const gap = currentAnnualExpenses - portfolioIncome;
	return Math.max(0, gap / 12);
}

function calculateYearsToTarget(
	inputs: Pick<
		FireInputs,
		| "existingSavings"
		| "monthlySip"
		| "annualSipStepUpPct"
		| "expectedReturnPct"
		| "monthlyExpenses"
		| "inflationPct"
	>,
	targetFactor: number,
	maxYears: number,
): number | null {
	const currentTarget = calculateFireTarget(inputs, 0) * targetFactor;
	if (inputs.existingSavings >= currentTarget) return 0;
	if (inputs.monthlySip <= 0) return null;

	const monthlyRate = calculateEffectiveMonthlyReturn(inputs.expectedReturnPct);
	let corpus = inputs.existingSavings;
	let currentSip = inputs.monthlySip;

	for (let month = 1; month <= maxYears * 12; month++) {
		corpus = corpus * (1 + monthlyRate) + currentSip;
		const years = month / 12;
		const target = calculateFireTarget(inputs, years) * targetFactor;
		if (corpus >= target) {
			return Math.ceil((month / 12) * 10) / 10;
		}
		if (inputs.annualSipStepUpPct > 0 && month % 12 === 0) {
			currentSip *= 1 + inputs.annualSipStepUpPct / 100;
		}
	}
	return null;
}

function buildProjectionPoints(inputs: FireInputs): FireProjectionPoint[] {
	const points: FireProjectionPoint[] = [];
	const monthlyRate = calculateEffectiveMonthlyReturn(inputs.expectedReturnPct);
	const yearsToProject = Math.min(
		inputs.targetRetirementAge - inputs.currentAge + 5,
		MAX_PROJECTION_YEARS,
	);

	let corpus = inputs.existingSavings;
	let currentSip = inputs.monthlySip;
	let totalInvestment = inputs.existingSavings;

	for (let year = 0; year <= yearsToProject; year++) {
		const age = inputs.currentAge + year;
		const futureExpenses = calculateAnnualExpensesForYears(inputs, year);
		const target = calculateFireTarget(inputs, year);

		points.push({
			year,
			age,
			corpus: Math.round(corpus),
			totalInvestment: Math.round(totalInvestment),
			fireTarget: Math.round(target),
			annualExpenses: Math.round(futureExpenses),
		});

		// Compound for next year (month by month)
		for (let m = 0; m < 12; m++) {
			corpus = corpus * (1 + monthlyRate) + currentSip;
			totalInvestment += currentSip;
		}
		if (inputs.annualSipStepUpPct > 0) {
			currentSip *= 1 + inputs.annualSipStepUpPct / 100;
		}
	}

	return points;
}

function buildFireTypes(
	inputs: FireInputs,
	fireNumber: number,
): FireTypeResult[] {
	const types: FireType[] = ["lean", "regular", "comfort", "coast", "barista"];
	const yearsToRetirement = inputs.targetRetirementAge - inputs.currentAge;

	return types.map((type) => {
		const config = FIRE_TYPE_CONFIG[type];

		if (type === "coast") {
			const coastNumber = calculateCoastFireNumber(
				fireNumber,
				inputs.expectedReturnPct,
				yearsToRetirement,
			);
			return {
				type,
				label: config.label,
				number: Math.round(coastNumber),
				description: config.description,
				yearsToReach: null,
				ageAtReach:
					inputs.existingSavings >= coastNumber ? inputs.currentAge : null,
				isAchievable: inputs.existingSavings >= coastNumber,
			};
		}

		if (type === "barista") {
			const currentAnnualExpenses = calculateAnnualExpensesForYears(inputs, 0);
			const baristaIncome = calculateBaristaMonthlyIncome(
				currentAnnualExpenses,
				inputs.existingSavings,
			);
			return {
				type,
				label: config.label,
				number: Math.round(baristaIncome),
				description: config.description,
				yearsToReach: null,
				ageAtReach: null,
				isAchievable: baristaIncome > 0,
			};
		}

		const factor = config.factor ?? 1;
		const targetNumber = Math.round(fireNumber * factor);
		const years = calculateYearsToTarget(inputs, factor, MAX_PROJECTION_YEARS);

		return {
			type,
			label: config.label,
			number: targetNumber,
			description: config.description,
			yearsToReach: years,
			ageAtReach: years !== null ? Math.round(inputs.currentAge + years) : null,
			isAchievable: years !== null && inputs.currentAge + years <= 70,
		};
	});
}

export function calculateFire(inputs: FireInputs = FIRE_DEFAULTS): FireResult {
	const yearsToRetirement = inputs.targetRetirementAge - inputs.currentAge;

	const currentAnnualExpenses = calculateAnnualExpensesForYears(inputs, 0);
	const futureAnnualExpenses = calculateAnnualExpensesForYears(
		inputs,
		yearsToRetirement,
	);

	const fireNumber = calculateFireTarget(inputs, yearsToRetirement);

	const leanFireNumber = Math.round(fireNumber * 0.7);
	const comfortFireNumber = Math.round(fireNumber * 1.4);
	const coastFireNumber = Math.round(
		calculateCoastFireNumber(
			fireNumber,
			inputs.expectedReturnPct,
			yearsToRetirement,
		),
	);
	const baristaFireMonthlyIncome = Math.round(
		calculateBaristaMonthlyIncome(
			currentAnnualExpenses,
			inputs.existingSavings,
		),
	);

	const yearsToFire = calculateYearsToTarget(inputs, 1, MAX_PROJECTION_YEARS);

	const fireAge =
		yearsToFire !== null ? Math.round(inputs.currentAge + yearsToFire) : null;

	// Projected corpus at target retirement age
	const monthlyRate = calculateEffectiveMonthlyReturn(inputs.expectedReturnPct);
	let projectedCorpus = inputs.existingSavings;
	let currentSip = inputs.monthlySip;
	for (let m = 1; m <= yearsToRetirement * 12; m++) {
		projectedCorpus = projectedCorpus * (1 + monthlyRate) + currentSip;
		if (inputs.annualSipStepUpPct > 0 && m % 12 === 0) {
			currentSip *= 1 + inputs.annualSipStepUpPct / 100;
		}
	}
	const shortfall = Math.round(fireNumber) - Math.round(projectedCorpus);

	const fireTypes = buildFireTypes(inputs, fireNumber);
	const projectionPoints = buildProjectionPoints(inputs);

	const insights = buildFireInsights({
		inputs,
		fireNumber,
		futureAnnualExpenses,
		yearsToFire,
		fireAge,
		coastFireNumber,
		projectedCorpus,
		shortfall,
	});

	const leverScenarios = buildLeverScenarios(inputs, yearsToFire);

	return {
		inputs,
		fireNumber: Math.round(fireNumber),
		leanFireNumber,
		comfortFireNumber,
		coastFireNumber,
		baristaFireMonthlyIncome,
		futureAnnualExpenses: Math.round(futureAnnualExpenses),
		futureMonthlyExpenses: Math.round(futureAnnualExpenses / 12),
		yearsToFire,
		fireAge,
		projectedCorpusAtRetirement: Math.round(projectedCorpus),
		shortfall,
		fireTypes,
		projectionPoints,
		insights,
		leverScenarios,
	};
}
