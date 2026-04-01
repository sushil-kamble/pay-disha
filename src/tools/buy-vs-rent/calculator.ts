import {
	BUY_VS_RENT_LIMITS,
	BUY_VS_RENT_SCENARIO_OFFSETS,
	DEFAULT_BUY_VS_RENT_INPUTS,
} from "./constants";
import {
	buildBuyVsRentInsights,
	buildBuyVsRentStory,
	formatCurrency,
} from "./insights";
import type {
	BuyVsRentInputs,
	BuyVsRentPoint,
	BuyVsRentResult,
	BuyVsRentScenarioSummary,
	BuyVsRentSummary,
	BuyVsRentVerdict,
	ScenarioLabel,
} from "./types";

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function toRupeesFromLakhs(value: number) {
	return value * 100000;
}

function monthlyRate(annualRatePct: number) {
	return (1 + annualRatePct / 100) ** (1 / 12) - 1;
}

function formatYearLabel(index: number) {
	return index === 0 ? "Now" : `Year ${index}`;
}

function calculateEmi(
	principal: number,
	annualRatePct: number,
	tenureYears: number,
) {
	if (principal <= 0 || tenureYears <= 0) return 0;

	const rate = annualRatePct / 12 / 100;
	const months = tenureYears * 12;

	if (rate === 0) {
		return principal / months;
	}

	const growth = (1 + rate) ** months;
	return (principal * rate * growth) / (growth - 1);
}

function scaleToRealValue(
	value: number,
	inflationRatePct: number,
	years: number,
) {
	if (years <= 0 || inflationRatePct <= 0) return value;
	return value / (1 + inflationRatePct / 100) ** years;
}

function normaliseInputs(input: Partial<BuyVsRentInputs>): BuyVsRentInputs {
	const merged = { ...DEFAULT_BUY_VS_RENT_INPUTS, ...input };

	return {
		propertyPriceLakhs: clamp(
			merged.propertyPriceLakhs,
			BUY_VS_RENT_LIMITS.minPropertyPriceLakhs,
			BUY_VS_RENT_LIMITS.maxPropertyPriceLakhs,
		),
		monthlyRent: clamp(
			merged.monthlyRent,
			BUY_VS_RENT_LIMITS.minMonthlyRent,
			BUY_VS_RENT_LIMITS.maxMonthlyRent,
		),
		stayYears: Math.round(
			clamp(
				merged.stayYears,
				BUY_VS_RENT_LIMITS.minStayYears,
				BUY_VS_RENT_LIMITS.maxStayYears,
			),
		),
		downPaymentPct: clamp(
			merged.downPaymentPct,
			BUY_VS_RENT_LIMITS.minDownPaymentPct,
			BUY_VS_RENT_LIMITS.maxDownPaymentPct,
		),
		homeLoanRatePct: clamp(
			merged.homeLoanRatePct,
			BUY_VS_RENT_LIMITS.minInterestPct,
			BUY_VS_RENT_LIMITS.maxInterestPct,
		),
		loanTenureYears: Math.round(
			clamp(
				merged.loanTenureYears,
				BUY_VS_RENT_LIMITS.minLoanTenureYears,
				BUY_VS_RENT_LIMITS.maxLoanTenureYears,
			),
		),
		propertyAppreciationPct: clamp(
			merged.propertyAppreciationPct,
			BUY_VS_RENT_LIMITS.minAppreciationPct,
			BUY_VS_RENT_LIMITS.maxAppreciationPct,
		),
		rentIncreasePct: clamp(
			merged.rentIncreasePct,
			BUY_VS_RENT_LIMITS.minRentIncreasePct,
			BUY_VS_RENT_LIMITS.maxRentIncreasePct,
		),
		investmentReturnPct: clamp(
			merged.investmentReturnPct,
			BUY_VS_RENT_LIMITS.minInvestmentReturnPct,
			BUY_VS_RENT_LIMITS.maxInvestmentReturnPct,
		),
		inflationRatePct: clamp(
			merged.inflationRatePct,
			BUY_VS_RENT_LIMITS.minInflationRatePct,
			BUY_VS_RENT_LIMITS.maxInflationRatePct,
		),
		annualMaintenancePct: clamp(
			merged.annualMaintenancePct,
			BUY_VS_RENT_LIMITS.minAnnualMaintenancePct,
			BUY_VS_RENT_LIMITS.maxAnnualMaintenancePct,
		),
		annualOwnerFixedCosts: clamp(
			merged.annualOwnerFixedCosts,
			BUY_VS_RENT_LIMITS.minAnnualOwnerFixedCosts,
			BUY_VS_RENT_LIMITS.maxAnnualOwnerFixedCosts,
		),
		purchaseCostPct: clamp(
			merged.purchaseCostPct,
			BUY_VS_RENT_LIMITS.minPurchaseCostPct,
			BUY_VS_RENT_LIMITS.maxPurchaseCostPct,
		),
		saleCostPct: clamp(
			merged.saleCostPct,
			BUY_VS_RENT_LIMITS.minSaleCostPct,
			BUY_VS_RENT_LIMITS.maxSaleCostPct,
		),
		rentDepositMonths: clamp(
			merged.rentDepositMonths,
			BUY_VS_RENT_LIMITS.minDepositMonths,
			BUY_VS_RENT_LIMITS.maxDepositMonths,
		),
		rentBrokerageMonths: clamp(
			merged.rentBrokerageMonths,
			BUY_VS_RENT_LIMITS.minBrokerageMonths,
			BUY_VS_RENT_LIMITS.maxBrokerageMonths,
		),
		annualBuyTaxBenefit: clamp(
			merged.annualBuyTaxBenefit,
			BUY_VS_RENT_LIMITS.minAnnualTaxBenefit,
			BUY_VS_RENT_LIMITS.maxAnnualTaxBenefit,
		),
		annualRentTaxBenefit: clamp(
			merged.annualRentTaxBenefit,
			BUY_VS_RENT_LIMITS.minAnnualTaxBenefit,
			BUY_VS_RENT_LIMITS.maxAnnualTaxBenefit,
		),
		monthlyTakeHomePay:
			merged.monthlyTakeHomePay === null ||
			merged.monthlyTakeHomePay === undefined
				? null
				: clamp(
						merged.monthlyTakeHomePay,
						BUY_VS_RENT_LIMITS.minMonthlyTakeHomePay,
						BUY_VS_RENT_LIMITS.maxMonthlyTakeHomePay,
					),
		startYear: merged.startYear,
	};
}

function getVerdict({
	financialGap,
	propertyPrice,
	monthlyRent,
}: {
	financialGap: number;
	propertyPrice: number;
	monthlyRent: number;
}): BuyVsRentVerdict {
	const closeCallBand = Math.max(propertyPrice * 0.03, monthlyRent * 12);
	if (Math.abs(financialGap) <= closeCallBand) return "close-call" as const;
	return financialGap > 0 ? ("buy" as const) : ("rent" as const);
}

function getConfidence(
	verdict: BuyVsRentVerdict,
	scenarios: BuyVsRentScenarioSummary[],
) {
	const matches = scenarios.filter(
		(scenario) => scenario.verdict === verdict,
	).length;
	if (verdict !== "close-call" && matches === scenarios.length)
		return "high" as const;
	if (matches >= 2) return "medium" as const;
	return "low" as const;
}

function buildReasons({
	verdict,
	upfrontGap,
	firstYearBuyMonthlyOutgo,
	firstYearRentMonthlyOutgo,
	breakEvenYear,
	stayYears,
	finalHomeEquity,
	finalRentCorpus,
	totalBuyTaxBenefit,
	totalRentTaxBenefit,
}: {
	verdict: BuyVsRentVerdict;
	upfrontGap: number;
	firstYearBuyMonthlyOutgo: number;
	firstYearRentMonthlyOutgo: number;
	breakEvenYear: number | null;
	stayYears: number;
	finalHomeEquity: number;
	finalRentCorpus: number;
	totalBuyTaxBenefit: number;
	totalRentTaxBenefit: number;
}) {
	const reasons: string[] = [];

	if (upfrontGap > 0) {
		reasons.push(
			`Buying needs ${formatCurrency(upfrontGap)} more cash up front.`,
		);
	}

	if (firstYearBuyMonthlyOutgo > firstYearRentMonthlyOutgo) {
		reasons.push(
			`Year-one housing outgo is ${formatCurrency(firstYearBuyMonthlyOutgo - firstYearRentMonthlyOutgo)} a month higher when you buy.`,
		);
	} else if (firstYearRentMonthlyOutgo > firstYearBuyMonthlyOutgo) {
		reasons.push(
			`Year-one housing outgo is ${formatCurrency(firstYearRentMonthlyOutgo - firstYearBuyMonthlyOutgo)} a month higher when you rent.`,
		);
	}

	if (breakEvenYear === null) {
		reasons.push("Buying does not catch up within the selected horizon.");
	} else if (breakEvenYear > stayYears) {
		reasons.push(
			`Buying only starts catching up after roughly year ${breakEvenYear}.`,
		);
	} else {
		reasons.push(`Buying catches up around year ${breakEvenYear}.`);
	}

	if (finalHomeEquity > finalRentCorpus) {
		reasons.push(
			`By the end, home equity reaches ${formatCurrency(finalHomeEquity)} versus ${formatCurrency(finalRentCorpus)} for the renter corpus.`,
		);
	} else {
		reasons.push(
			`By the end, the renter corpus reaches ${formatCurrency(finalRentCorpus)} versus ${formatCurrency(finalHomeEquity)} in saleable home equity.`,
		);
	}

	if (totalBuyTaxBenefit > 0 || totalRentTaxBenefit > 0) {
		reasons.push(
			`Tax benefits add ${formatCurrency(totalBuyTaxBenefit)} on the buy side versus ${formatCurrency(totalRentTaxBenefit)} on the rent side.`,
		);
	}

	if (verdict === "close-call") {
		reasons.push(
			"This is close enough that lifestyle preference can reasonably override the spreadsheet.",
		);
	}

	return reasons.slice(0, 5);
}

function calculateScenarioSummaries(inputs: BuyVsRentInputs) {
	return (Object.keys(BUY_VS_RENT_SCENARIO_OFFSETS) as ScenarioLabel[]).map(
		(label) => {
			const offsets = BUY_VS_RENT_SCENARIO_OFFSETS[label];
			const scenarioInputs = normaliseInputs({
				...inputs,
				propertyAppreciationPct:
					inputs.propertyAppreciationPct + offsets.propertyAppreciationPct,
				investmentReturnPct:
					inputs.investmentReturnPct + offsets.investmentReturnPct,
				rentIncreasePct: inputs.rentIncreasePct + offsets.rentIncreasePct,
			});
			const result = calculateBuyVsRentInternal(scenarioInputs, false);
			return {
				label,
				verdict: result.verdict,
				gap: result.financialGap,
				buyNetWorth: result.buyNetWorth,
				rentNetWorth: result.rentNetWorth,
				propertyAppreciationPct: scenarioInputs.propertyAppreciationPct,
				investmentReturnPct: scenarioInputs.investmentReturnPct,
				rentIncreasePct: scenarioInputs.rentIncreasePct,
			};
		},
	);
}

function calculateBuyVsRentInternal(
	inputs: BuyVsRentInputs,
	withScenarios: boolean,
) {
	const propertyPrice = toRupeesFromLakhs(inputs.propertyPriceLakhs);
	const downPayment = propertyPrice * (inputs.downPaymentPct / 100);
	const loanPrincipal = Math.max(propertyPrice - downPayment, 0);
	const purchaseCosts = propertyPrice * (inputs.purchaseCostPct / 100);
	const rentDeposit = inputs.monthlyRent * inputs.rentDepositMonths;
	const rentBrokerage = inputs.monthlyRent * inputs.rentBrokerageMonths;
	const upfrontBuyCash = downPayment + purchaseCosts;
	const upfrontRentCash = rentDeposit + rentBrokerage;
	const upfrontGap = upfrontBuyCash - upfrontRentCash;
	const investMonthlyRate = monthlyRate(inputs.investmentReturnPct);
	const loanMonthlyRate = inputs.homeLoanRatePct / 12 / 100;
	const stayMonths = inputs.stayYears * 12;
	const loanMonths = inputs.loanTenureYears * 12;
	const emi = calculateEmi(
		loanPrincipal,
		inputs.homeLoanRatePct,
		inputs.loanTenureYears,
	);

	let outstandingLoan = loanPrincipal;
	let propertyValue = propertyPrice;
	let currentMonthlyRent = inputs.monthlyRent;
	let buyCorpus = Math.max(0, upfrontRentCash - upfrontBuyCash);
	let rentCorpus = Math.max(0, upfrontBuyCash - upfrontRentCash);
	let cumulativeBuyTaxBenefit = 0;
	let cumulativeRentTaxBenefit = 0;

	const points: BuyVsRentPoint[] = [];

	function createPoint({
		yearOffset,
		buyAnnualOutgo,
		rentAnnualOutgo,
		annualPrincipalPaid,
		annualInterestPaid,
		annualMaintenancePaid,
		annualRentPaid,
	}: {
		yearOffset: number;
		buyAnnualOutgo: number;
		rentAnnualOutgo: number;
		annualPrincipalPaid: number;
		annualInterestPaid: number;
		annualMaintenancePaid: number;
		annualRentPaid: number;
	}) {
		const saleableHomeValue = propertyValue * (1 - inputs.saleCostPct / 100);
		const buyHomeEquity = Math.max(0, saleableHomeValue - outstandingLoan);
		const rentNetWorth = rentCorpus + rentDeposit;
		const buyNetWorth = buyHomeEquity + buyCorpus;
		const gap = buyNetWorth - rentNetWorth;
		const realBuyNetWorth = scaleToRealValue(
			buyNetWorth,
			inputs.inflationRatePct,
			yearOffset,
		);
		const realRentNetWorth = scaleToRealValue(
			rentNetWorth,
			inputs.inflationRatePct,
			yearOffset,
		);

		points.push({
			year: inputs.startYear + yearOffset,
			label: formatYearLabel(yearOffset),
			propertyValue,
			outstandingLoan,
			buyHomeEquity,
			buyInvestmentCorpus: buyCorpus,
			rentInvestmentCorpus: rentCorpus,
			rentDepositValue: rentDeposit,
			buyNetWorth,
			rentNetWorth,
			gap,
			realBuyNetWorth,
			realRentNetWorth,
			realGap: realBuyNetWorth - realRentNetWorth,
			buyAnnualOutgo,
			rentAnnualOutgo,
			buyMonthlyOutgo: buyAnnualOutgo / 12,
			rentMonthlyOutgo: rentAnnualOutgo / 12,
			annualPrincipalPaid,
			annualInterestPaid,
			annualMaintenancePaid,
			annualRentPaid,
			cumulativeBuyTaxBenefit,
			cumulativeRentTaxBenefit,
			buyStressRatio:
				inputs.monthlyTakeHomePay && inputs.monthlyTakeHomePay > 0
					? buyAnnualOutgo / 12 / inputs.monthlyTakeHomePay
					: null,
			rentStressRatio:
				inputs.monthlyTakeHomePay && inputs.monthlyTakeHomePay > 0
					? rentAnnualOutgo / 12 / inputs.monthlyTakeHomePay
					: null,
		});
	}

	createPoint({
		yearOffset: 0,
		buyAnnualOutgo: 0,
		rentAnnualOutgo: 0,
		annualPrincipalPaid: 0,
		annualInterestPaid: 0,
		annualMaintenancePaid: 0,
		annualRentPaid: 0,
	});

	for (let yearIndex = 1; yearIndex <= inputs.stayYears; yearIndex += 1) {
		let buyAnnualOutgo = 0;
		let rentAnnualOutgo = 0;
		let annualPrincipalPaid = 0;
		let annualInterestPaid = 0;
		let annualMaintenancePaid = 0;
		let annualRentPaid = 0;

		const monthlyMaintenance =
			(propertyValue * (inputs.annualMaintenancePct / 100) +
				inputs.annualOwnerFixedCosts) /
			12;

		for (
			let month = 0;
			month < 12 && (yearIndex - 1) * 12 + month < stayMonths;
			month += 1
		) {
			buyCorpus *= 1 + investMonthlyRate;
			rentCorpus *= 1 + investMonthlyRate;

			let monthlyInterestPaid = 0;
			let monthlyPrincipalPaid = 0;
			let monthlyEmi = 0;

			const elapsedMonths = (yearIndex - 1) * 12 + month;
			if (outstandingLoan > 0 && elapsedMonths < loanMonths) {
				monthlyInterestPaid = outstandingLoan * loanMonthlyRate;
				monthlyPrincipalPaid = Math.min(
					emi - monthlyInterestPaid,
					outstandingLoan,
				);
				monthlyEmi = monthlyInterestPaid + monthlyPrincipalPaid;
				outstandingLoan = Math.max(0, outstandingLoan - monthlyPrincipalPaid);
			}

			const monthlyBuyTaxBenefit = inputs.annualBuyTaxBenefit / 12;
			const monthlyRentTaxBenefit = inputs.annualRentTaxBenefit / 12;
			const monthlyBuyOutgo = Math.max(
				0,
				monthlyEmi + monthlyMaintenance - monthlyBuyTaxBenefit,
			);
			const monthlyRentOutgo = Math.max(
				0,
				currentMonthlyRent - monthlyRentTaxBenefit,
			);

			buyAnnualOutgo += monthlyBuyOutgo;
			rentAnnualOutgo += monthlyRentOutgo;
			annualPrincipalPaid += monthlyPrincipalPaid;
			annualInterestPaid += monthlyInterestPaid;
			annualMaintenancePaid += monthlyMaintenance;
			annualRentPaid += currentMonthlyRent;
			cumulativeBuyTaxBenefit += monthlyBuyTaxBenefit;
			cumulativeRentTaxBenefit += monthlyRentTaxBenefit;

			const monthlyGap = monthlyBuyOutgo - monthlyRentOutgo;
			if (monthlyGap > 0) {
				rentCorpus += monthlyGap;
			} else if (monthlyGap < 0) {
				buyCorpus += Math.abs(monthlyGap);
			}
		}

		propertyValue *= 1 + inputs.propertyAppreciationPct / 100;
		createPoint({
			yearOffset: yearIndex,
			buyAnnualOutgo,
			rentAnnualOutgo,
			annualPrincipalPaid,
			annualInterestPaid,
			annualMaintenancePaid,
			annualRentPaid,
		});
		currentMonthlyRent *= 1 + inputs.rentIncreasePct / 100;
	}

	const finalPoint = points.at(-1) ?? points[0];
	const firstYearPoint = points[1] ?? finalPoint;
	const financialGap = finalPoint.gap;
	const verdict = getVerdict({
		financialGap,
		propertyPrice,
		monthlyRent: inputs.monthlyRent,
	});
	const breakEvenPoint = points.find(
		(point, index) => index > 0 && point.gap >= 0,
	);
	const buyBecomesReasonableAfterYear = breakEvenPoint
		? breakEvenPoint.year - inputs.startYear
		: null;
	const scenarios = withScenarios ? calculateScenarioSummaries(inputs) : [];
	const confidence = getConfidence(
		verdict,
		scenarios.length > 0
			? scenarios
			: [
					{
						label: "base-case",
						verdict,
						gap: financialGap,
						buyNetWorth: finalPoint.buyNetWorth,
						rentNetWorth: finalPoint.rentNetWorth,
						propertyAppreciationPct: inputs.propertyAppreciationPct,
						investmentReturnPct: inputs.investmentReturnPct,
						rentIncreasePct: inputs.rentIncreasePct,
					},
				],
	);

	const baseSummary = {
		verdict,
		confidence,
		horizonYears: inputs.stayYears,
		financialGap,
		buyNetWorth: finalPoint.buyNetWorth,
		rentNetWorth: finalPoint.rentNetWorth,
		breakEvenYear:
			breakEvenPoint === undefined
				? null
				: breakEvenPoint.year - inputs.startYear,
		upfrontBuyCash,
		upfrontRentCash,
		upfrontGap,
		firstYearBuyMonthlyOutgo: firstYearPoint.buyMonthlyOutgo,
		firstYearRentMonthlyOutgo: firstYearPoint.rentMonthlyOutgo,
		finalYearBuyMonthlyOutgo: finalPoint.buyMonthlyOutgo,
		finalYearRentMonthlyOutgo: finalPoint.rentMonthlyOutgo,
		finalHomeEquity: finalPoint.buyHomeEquity,
		finalRentCorpus: finalPoint.rentNetWorth,
		totalBuyTaxBenefit: cumulativeBuyTaxBenefit,
		totalRentTaxBenefit: cumulativeRentTaxBenefit,
		buyStressRatio: finalPoint.buyStressRatio,
		rentStressRatio: finalPoint.rentStressRatio,
		buyBecomesReasonableAfterYear,
		reasons: buildReasons({
			verdict,
			upfrontGap,
			firstYearBuyMonthlyOutgo: firstYearPoint.buyMonthlyOutgo,
			firstYearRentMonthlyOutgo: firstYearPoint.rentMonthlyOutgo,
			breakEvenYear:
				breakEvenPoint === undefined
					? null
					: breakEvenPoint.year - inputs.startYear,
			stayYears: inputs.stayYears,
			finalHomeEquity: finalPoint.buyHomeEquity,
			finalRentCorpus: finalPoint.rentNetWorth,
			totalBuyTaxBenefit: cumulativeBuyTaxBenefit,
			totalRentTaxBenefit: cumulativeRentTaxBenefit,
		}),
		scenarios,
	};
	const { story, decisionNote } = buildBuyVsRentStory(baseSummary);

	const summary: BuyVsRentSummary = {
		...baseSummary,
		story,
		decisionNote,
		insights: buildBuyVsRentInsights(baseSummary),
	};

	return {
		points,
		summary,
		verdict,
		financialGap,
		buyNetWorth: finalPoint.buyNetWorth,
		rentNetWorth: finalPoint.rentNetWorth,
	};
}

export function calculateBuyVsRent(
	input: Partial<BuyVsRentInputs> = {},
): BuyVsRentResult {
	const inputs = normaliseInputs(input);
	const result = calculateBuyVsRentInternal(inputs, true);

	return {
		inputs,
		points: result.points,
		summary: result.summary,
	};
}

export { calculateEmi, formatCurrency, normaliseInputs, toRupeesFromLakhs };
