import { FIRE_DEFAULTS, FIRE_TYPE_CONFIG } from "./constants";
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

function getGeneralMonthlyExpenses(
	monthlyExpenses: number,
	monthlyHealthcare: number,
) {
	return Math.max(0, monthlyExpenses - monthlyHealthcare);
}

export function calculateAnnualExpensesForYears(
	inputs: Pick<
		FireInputs,
		| "monthlyExpenses"
		| "monthlyHealthcareBudget"
		| "inflationPct"
		| "healthcareInflationPct"
	>,
	years: number,
): number {
	const generalMonthly = getGeneralMonthlyExpenses(
		inputs.monthlyExpenses,
		inputs.monthlyHealthcareBudget,
	);
	const futureGeneral =
		generalMonthly * 12 * (1 + inputs.inflationPct / 100) ** years;
	const futureHealthcare =
		inputs.monthlyHealthcareBudget *
		12 *
		(1 + inputs.healthcareInflationPct / 100) ** years;
	return futureGeneral + futureHealthcare;
}

export function calculateFireTarget(
	inputs: Pick<
		FireInputs,
		| "monthlyExpenses"
		| "monthlyHealthcareBudget"
		| "inflationPct"
		| "healthcareInflationPct"
		| "swrPct"
	>,
	years: number,
) {
	return calculateAnnualExpensesForYears(inputs, years) / (inputs.swrPct / 100);
}

function calculateFireNumber(
	futureAnnualExpenses: number,
	swrPct: number,
): number {
	return futureAnnualExpenses / (swrPct / 100);
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
	swrPct: number,
): number {
	const withdrawalIncome = currentPortfolio * (swrPct / 100);
	const gap = currentAnnualExpenses - withdrawalIncome;
	return Math.max(0, gap / 12);
}

function calculateYearsToTarget(
	inputs: Pick<
		FireInputs,
		| "existingSavings"
		| "monthlySip"
		| "expectedReturnPct"
		| "monthlyExpenses"
		| "monthlyHealthcareBudget"
		| "inflationPct"
		| "healthcareInflationPct"
		| "swrPct"
	>,
	targetFactor: number,
	maxYears: number,
): number | null {
	const currentTarget = calculateFireTarget(inputs, 0) * targetFactor;
	if (inputs.existingSavings >= currentTarget) return 0;
	if (inputs.monthlySip <= 0) return null;

	const monthlyRate = inputs.expectedReturnPct / 100 / 12;
	let corpus = inputs.existingSavings;

	for (let month = 1; month <= maxYears * 12; month++) {
		corpus = corpus * (1 + monthlyRate) + inputs.monthlySip;
		const target = calculateFireTarget(inputs, month / 12) * targetFactor;
		if (corpus >= target) {
			return Math.ceil((month / 12) * 10) / 10;
		}
	}
	return null;
}

function calculateEpfCorpus(
	monthlyContribution: number,
	annualRatePct: number,
	years: number,
): number {
	if (monthlyContribution <= 0 || years <= 0) return 0;
	const monthlyRate = annualRatePct / 100 / 12;
	let corpus = 0;
	for (let month = 0; month < years * 12; month++) {
		corpus = corpus * (1 + monthlyRate) + monthlyContribution;
	}
	return corpus;
}

function buildProjectionPoints(inputs: FireInputs): FireProjectionPoint[] {
	const points: FireProjectionPoint[] = [];
	const monthlyRate = inputs.expectedReturnPct / 100 / 12;
	const epfMonthlyRate = inputs.epfInterestPct / 100 / 12;
	const yearsToProject = Math.min(
		inputs.targetRetirementAge - inputs.currentAge + 5,
		MAX_PROJECTION_YEARS,
	);

	let corpus = inputs.existingSavings;
	let epfCorpus = 0;

	for (let year = 0; year <= yearsToProject; year++) {
		const age = inputs.currentAge + year;
		const futureExpenses = calculateAnnualExpensesForYears(inputs, year);
		const target = calculateFireTarget(inputs, year);

		points.push({
			year,
			age,
			corpus: Math.round(corpus),
			epfCorpus: Math.round(epfCorpus),
			totalWealth: Math.round(corpus + epfCorpus),
			fireTarget: Math.round(target),
			annualExpenses: Math.round(futureExpenses),
		});

		// Compound for next year (month by month)
		for (let m = 0; m < 12; m++) {
			corpus = corpus * (1 + monthlyRate) + inputs.monthlySip;
			epfCorpus =
				epfCorpus * (1 + epfMonthlyRate) + inputs.epfMonthlyContribution;
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
				inputs.swrPct,
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

	const swrDecimal = inputs.swrPct / 100;
	const fireNumber = calculateFireNumber(futureAnnualExpenses, inputs.swrPct);
	const fireMultiplier = 1 / swrDecimal;

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
			inputs.swrPct,
		),
	);

	const yearsToFire = calculateYearsToTarget(inputs, 1, MAX_PROJECTION_YEARS);

	const fireAge =
		yearsToFire !== null ? Math.round(inputs.currentAge + yearsToFire) : null;

	// Projected corpus at target retirement age
	const monthlyRate = inputs.expectedReturnPct / 100 / 12;
	let projectedCorpus = inputs.existingSavings;
	for (let m = 0; m < yearsToRetirement * 12; m++) {
		projectedCorpus = projectedCorpus * (1 + monthlyRate) + inputs.monthlySip;
	}

	const epfCorpusAtRetirement = calculateEpfCorpus(
		inputs.epfMonthlyContribution,
		inputs.epfInterestPct,
		yearsToRetirement,
	);

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
		epfCorpusAtRetirement,
		shortfall,
	});

	const leverScenarios = buildLeverScenarios(inputs, yearsToFire);

	return {
		inputs,
		fireNumber: Math.round(fireNumber),
		fireMultiplier: Math.round(fireMultiplier * 10) / 10,
		leanFireNumber,
		comfortFireNumber,
		coastFireNumber,
		baristaFireMonthlyIncome,
		futureAnnualExpenses: Math.round(futureAnnualExpenses),
		futureMonthlyExpenses: Math.round(futureAnnualExpenses / 12),
		yearsToFire,
		fireAge,
		projectedCorpusAtRetirement: Math.round(projectedCorpus),
		epfCorpusAtRetirement: Math.round(epfCorpusAtRetirement),
		shortfall,
		fireTypes,
		projectionPoints,
		insights,
		leverScenarios,
	};
}
