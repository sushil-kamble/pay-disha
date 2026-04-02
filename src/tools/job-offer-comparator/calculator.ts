import { calculate as calculateInHand } from "#/tools/inhand-salary/calculator";
import { SCENARIO_CONFIG } from "./constants";
import {
	applyFitAndBlendedScores,
	buildTopInsights,
	computeFinanceScores,
} from "./scoring";
import type {
	CompareConfig,
	ComparisonResult,
	LensWinner,
	OfferComputed,
	OfferInput,
	ScenarioKey,
	YearValue,
} from "./types";

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

function sumBenefitValue(offer: OfferInput) {
	return Object.values(offer.benefits).reduce((acc, benefit) => {
		if (!benefit.enabled) return acc;
		return acc + Math.max(0, benefit.monthlyValue);
	}, 0);
}

function computeTaxAdjustedYearlyInHand(
	annualCash: number,
	pfMonthly: number,
	taxRegime: OfferInput["taxRegime"],
) {
	if (annualCash <= 0) return 0;
	const ctcLakhs = annualCash / 100000;
	const result = calculateInHand(ctcLakhs, pfMonthly, taxRegime, 0);
	if (!result) return annualCash * 0.72;
	return result.inHandYearly;
}

function computeYearlyProjection(
	offer: OfferInput,
	scenario: ScenarioKey,
): {
	annualGuaranteedCash: number;
	expectedVariableAnnualCash: number;
	annualEmployerRetirement: number;
	annualWorkCost: number;
	annualBenefitValue: number;
	monthlyTakeHome: number;
	firstYearRealizedValue: number;
	steadyStateAnnualValue: number;
	value24Months: number;
	value36Months: number;
	projection: YearValue[];
} {
	const scenarioConfig = SCENARIO_CONFIG[scenario];
	const annualEmployerRetirement = offer.pfMonthly * 12;
	const annualWorkCost =
		(offer.commuteMonthlyCost +
			offer.rentDeltaMonthlyCost +
			offer.remoteSetupMonthlyCost) *
		12;
	const annualBenefitValue = sumBenefitValue(offer) * 12;

	const incrementPct =
		(offer.expectedAnnualIncrementPct * scenarioConfig.incrementMultiplier) /
		100;
	const payoutPct =
		(offer.expectedBonusPayoutPct / 100) * scenarioConfig.bonusMultiplier;

	const promotionMonths =
		offer.expectedPromotionMonths + scenarioConfig.promotionDelayMonths;
	const promotionYear = Math.max(
		1,
		Math.ceil(clamp(promotionMonths, 1, 72) / 12),
	);
	const promotionMultiplier = 1 + offer.promotionUpliftPct / 100;

	const monthsWithIncrement = clamp(13 - offer.nextIncrementMonth, 0, 12);
	const yearOneIncrementFactor = monthsWithIncrement / 12;

	let expectedVariableAnnualCash = 0;
	let annualGuaranteedCash = 0;
	let monthlyTakeHome = 0;
	const projection: YearValue[] = [];

	for (let year = 1; year <= 3; year += 1) {
		const effectiveGrowthYears = Math.max(0, year - 1 + yearOneIncrementFactor);
		let fixedAnnualCash =
			offer.fixedAnnualCash * (1 + incrementPct) ** effectiveGrowthYears;

		if (year >= promotionYear) {
			fixedAnnualCash *= promotionMultiplier;
		}

		const variableAnnualCash =
			offer.variableAnnualTarget *
			(fixedAnnualCash / offer.fixedAnnualCash) *
			payoutPct;

		let equityAnnualValue =
			offer.equityAnnualizedValue * scenarioConfig.equityMultiplier;

		if (offer.equityType === "esop") {
			equityAnnualValue *= 0.7;
		}

		if (offer.equityType === "none") {
			equityAnnualValue = 0;
		}

		if (offer.equityCliffMonths > 0 && year * 12 < offer.equityCliffMonths) {
			equityAnnualValue = 0;
		}

		const annualCashForTax =
			fixedAnnualCash + variableAnnualCash + annualEmployerRetirement;
		const annualInHand = computeTaxAdjustedYearlyInHand(
			annualCashForTax,
			offer.pfMonthly,
			offer.taxRegime,
		);

		let realizedValue =
			annualInHand + annualBenefitValue - annualWorkCost + equityAnnualValue;

		if (year === 1) {
			realizedValue +=
				offer.joiningBonus +
				offer.retentionBonus +
				offer.relocationSupportOneTime;
			realizedValue -= offer.noticeBuyoutRisk + offer.clawbackRisk;
			monthlyTakeHome = annualInHand / 12;
			expectedVariableAnnualCash = variableAnnualCash;
			annualGuaranteedCash = fixedAnnualCash + annualEmployerRetirement;
		}

		projection.push({ year, value: Math.max(0, realizedValue) });
	}

	const firstYearRealizedValue = projection[0]?.value ?? 0;
	const value24Months =
		(projection[0]?.value ?? 0) + (projection[1]?.value ?? 0);
	const value36Months = value24Months + (projection[2]?.value ?? 0);
	const steadyStateAnnualValue = projection[2]?.value ?? firstYearRealizedValue;

	return {
		annualGuaranteedCash,
		expectedVariableAnnualCash,
		annualEmployerRetirement,
		annualWorkCost,
		annualBenefitValue,
		monthlyTakeHome,
		firstYearRealizedValue,
		steadyStateAnnualValue,
		value24Months,
		value36Months,
		projection,
	};
}

function lensWinner(
	offers: OfferComputed[],
	selectValue: (offer: OfferComputed) => number,
): LensWinner {
	const top = [...offers].sort((a, b) => selectValue(b) - selectValue(a))[0];
	if (!top) {
		return { offerId: "", label: "", value: 0 };
	}

	return {
		offerId: top.offer.id,
		label: top.offer.label,
		value: selectValue(top),
	};
}

function buildNarrative(offers: OfferComputed[], includeFit: boolean) {
	if (offers.length === 0) return [];

	const byRisk = [...offers].sort(
		(a, b) => b.riskAdjustedValue - a.riskAdjustedValue,
	);
	const winner = byRisk[0];
	const runner = byRisk[1];

	if (!winner) return [];

	const narrative = [
		`${winner.offer.label} is strongest on risk-adjusted value across 36 months.`,
	];

	if (runner) {
		const delta = winner.riskAdjustedValue - runner.riskAdjustedValue;
		narrative.push(
			`The lead over ${runner.offer.label} is approximately ₹${Math.round(delta).toLocaleString("en-IN")} on a risk-adjusted basis.`,
		);
	}

	const highCostOffer = [...offers].sort(
		(a, b) => b.annualWorkCost - a.annualWorkCost,
	)[0];
	if (highCostOffer && highCostOffer.annualWorkCost > 0) {
		narrative.push(
			`${highCostOffer.offer.label} carries the highest work-mode and location burden, so cost discipline matters for this option.`,
		);
	}

	if (includeFit) {
		const fitWinner = [...offers].sort(
			(a, b) => b.blendedScore - a.blendedScore,
		)[0];
		if (fitWinner) {
			narrative.push(
				`${fitWinner.offer.label} leads when your qualitative preferences are included in the decision.`,
			);
		}
	}

	return narrative;
}

export function compareOffers(
	offers: OfferInput[],
	config: CompareConfig,
): ComparisonResult {
	const computed = offers.map((offer) => {
		const expected = computeYearlyProjection(offer, config.scenario);
		const conservative = computeYearlyProjection(offer, "conservative");
		const upside = computeYearlyProjection(offer, "upside");

		const riskAdjustedValue =
			expected.value36Months * 0.6 +
			conservative.value36Months * 0.3 +
			upside.value36Months * 0.1;

		const base: OfferComputed = {
			offer,
			annualGuaranteedCash: expected.annualGuaranteedCash,
			expectedVariableAnnualCash: expected.expectedVariableAnnualCash,
			annualEmployerRetirement: expected.annualEmployerRetirement,
			annualWorkCost: expected.annualWorkCost,
			annualBenefitValue: expected.annualBenefitValue,
			monthlyTakeHome: expected.monthlyTakeHome,
			firstYearRealizedValue: expected.firstYearRealizedValue,
			steadyStateAnnualValue: expected.steadyStateAnnualValue,
			value24Months: expected.value24Months,
			value36Months: expected.value36Months,
			downside12Months: conservative.firstYearRealizedValue,
			upside36Months: upside.value36Months,
			riskAdjustedValue,
			financeScore: 0,
			fitScore: 0,
			blendedScore: 0,
			insights: [],
			projection: expected.projection,
		};

		return {
			...base,
			insights: buildTopInsights(offer, base),
		};
	});

	const withFinanceScores = computeFinanceScores(computed);
	const withBlended = applyFitAndBlendedScores(
		withFinanceScores,
		config.includeQualitativeFit,
		config.financeWeightPct,
		config.fitWeightPct,
	);

	const chartRows = [1, 2, 3].map((year) => {
		const row: { year: string; [key: string]: string | number } = {
			year: `Year ${year}`,
		};
		for (const item of withBlended) {
			row[item.offer.id] =
				item.projection.find((point) => point.year === year)?.value ?? 0;
		}
		return row;
	});

	const winners = {
		bestCashNow: lensWinner(withBlended, (offer) => offer.monthlyTakeHome),
		bestLongTerm: lensWinner(withBlended, (offer) => offer.value36Months),
		bestRiskAdjusted: lensWinner(
			withBlended,
			(offer) => offer.riskAdjustedValue,
		),
		bestOverall: config.includeQualitativeFit
			? lensWinner(withBlended, (offer) => offer.blendedScore)
			: null,
	};

	return {
		offers: withBlended,
		winners,
		chartRows,
		narrative: buildNarrative(withBlended, config.includeQualitativeFit),
	};
}
