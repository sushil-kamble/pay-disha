import { calculate as calculateInHand } from "#/tools/inhand-salary/calculator";
import { DEFAULT_PF_MONTHLY } from "#/tools/inhand-salary/constants";
import type { TaxRegime } from "#/tools/inhand-salary/types";
import {
	BUY_VS_RENT_BENCHMARKS,
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
	AffordabilityBenchmark,
	BenchmarkBand,
	BuyVsRentInputs,
	BuyVsRentPoint,
	BuyVsRentResult,
	BuyVsRentScenarioSummary,
	BuyVsRentSummary,
	BuyVsRentVerdict,
	RecommendedTaxRegime,
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

interface TakeHomeByRegime {
	oldRegime: number | null;
	newRegime: number | null;
}

function classifyBand(
	value: number,
	thresholds: { goodMax: number; watchMax: number },
): BenchmarkBand {
	if (value <= thresholds.goodMax) return "good";
	if (value <= thresholds.watchMax) return "watch";
	return "risky";
}

function estimatedMonthlyTakeHome(
	annualCtcLakhs: number,
	regime: TaxRegime,
): number | null {
	if (annualCtcLakhs <= 0) return null;
	const result = calculateInHand(annualCtcLakhs, DEFAULT_PF_MONTHLY, regime, 0);
	if (result) return result.inHandMonthly;
	return (annualCtcLakhs * 100000 * 0.72) / 12;
}

function calculateTakeHomeByRegime(annualCtcLakhs: number): TakeHomeByRegime {
	return {
		oldRegime: estimatedMonthlyTakeHome(annualCtcLakhs, "old"),
		newRegime: estimatedMonthlyTakeHome(annualCtcLakhs, "new"),
	};
}

function getRecommendedTaxRegime(
	takeHomeByRegime: TakeHomeByRegime,
): RecommendedTaxRegime | null {
	if (
		takeHomeByRegime.oldRegime === null &&
		takeHomeByRegime.newRegime === null
	) {
		return null;
	}

	if (takeHomeByRegime.oldRegime === null) return "new";
	if (takeHomeByRegime.newRegime === null) return "old";

	// Use the lower estimate so affordability checks stay conservative.
	return takeHomeByRegime.oldRegime <= takeHomeByRegime.newRegime
		? "old"
		: "new";
}

function getRecommendedTakeHome(
	takeHomeByRegime: TakeHomeByRegime,
	recommendedTaxRegime: RecommendedTaxRegime | null,
) {
	if (recommendedTaxRegime === "old") return takeHomeByRegime.oldRegime;
	if (recommendedTaxRegime === "new") return takeHomeByRegime.newRegime;
	return null;
}

function getTaxRegimeRecommendationNote({
	recommendedTaxRegime,
	oldRegimeMonthlyTakeHome,
	newRegimeMonthlyTakeHome,
}: {
	recommendedTaxRegime: RecommendedTaxRegime | null;
	oldRegimeMonthlyTakeHome: number | null;
	newRegimeMonthlyTakeHome: number | null;
}) {
	if (!recommendedTaxRegime) {
		return "We could not estimate take-home accurately from the provided inputs.";
	}

	if (oldRegimeMonthlyTakeHome === null || newRegimeMonthlyTakeHome === null) {
		return `Using ${recommendedTaxRegime} regime estimate for affordability because only one regime estimate was available.`;
	}

	const betterRegime =
		oldRegimeMonthlyTakeHome > newRegimeMonthlyTakeHome ? "old" : "new";

	return `Estimated take-home is ${formatCurrency(newRegimeMonthlyTakeHome)} (new) vs ${formatCurrency(oldRegimeMonthlyTakeHome)} (old). We use ${recommendedTaxRegime} for affordability to stay conservative; ${betterRegime} may still be better in your real tax filing.`;
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
		annualCtcLakhs: clamp(
			merged.annualCtcLakhs,
			BUY_VS_RENT_LIMITS.minAnnualCtcLakhs,
			BUY_VS_RENT_LIMITS.maxAnnualCtcLakhs,
		),
		ageYears: Math.round(
			clamp(
				merged.ageYears,
				BUY_VS_RENT_LIMITS.minAgeYears,
				BUY_VS_RENT_LIMITS.maxAgeYears,
			),
		),
		salaryGrowthPct: clamp(
			merged.salaryGrowthPct,
			BUY_VS_RENT_LIMITS.minSalaryGrowthPct,
			BUY_VS_RENT_LIMITS.maxSalaryGrowthPct,
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

function buildAffordabilityBenchmarks({
	priceToIncomeRatio,
	priceToIncomeBand,
	emiToIncomeRatio,
	emiToIncomeBand,
	loanEndAge,
	ageTenureBand,
}: {
	priceToIncomeRatio: number;
	priceToIncomeBand: BenchmarkBand;
	emiToIncomeRatio: number | null;
	emiToIncomeBand: BenchmarkBand | null;
	loanEndAge: number;
	ageTenureBand: BenchmarkBand;
}): AffordabilityBenchmark[] {
	const benchmarks: AffordabilityBenchmark[] = [
		{
			label: "Home price to annual income",
			value: `${priceToIncomeRatio.toFixed(1)}x`,
			band: priceToIncomeBand,
			description:
				"Lower multiples are usually easier to carry without sacrificing long-term savings.",
		},
		{
			label: "Age and loan-tenure fit",
			value: `Loan ends around age ${loanEndAge}`,
			band: ageTenureBand,
			description:
				"A shorter tenure relative to working years reduces repayment pressure later in life.",
		},
	];

	if (emiToIncomeRatio !== null && emiToIncomeBand !== null) {
		benchmarks.splice(1, 0, {
			label: "EMI to monthly take-home",
			value: `${(emiToIncomeRatio * 100).toFixed(0)}%`,
			band: emiToIncomeBand,
			description:
				"This uses your estimated monthly take-home and is a practical affordability stress check.",
		});
	}

	return benchmarks;
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
	priceToIncomeBand,
	emiToIncomeBand,
	ageTenureBand,
}: {
	verdict: BuyVsRentVerdict;
	upfrontGap: number;
	firstYearBuyMonthlyOutgo: number;
	firstYearRentMonthlyOutgo: number;
	breakEvenYear: number | null;
	stayYears: number;
	finalHomeEquity: number;
	finalRentCorpus: number;
	priceToIncomeBand: BenchmarkBand;
	emiToIncomeBand: BenchmarkBand | null;
	ageTenureBand: BenchmarkBand;
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

	if (
		priceToIncomeBand === "risky" ||
		emiToIncomeBand === "risky" ||
		ageTenureBand === "risky"
	) {
		reasons.push(
			"Affordability benchmarks flag this setup as stretched, so cash-flow resilience matters more than optimistic assumptions.",
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

	const firstYearTakeHomeByRegime = calculateTakeHomeByRegime(
		inputs.annualCtcLakhs,
	);
	const recommendedTaxRegime = getRecommendedTaxRegime(
		firstYearTakeHomeByRegime,
	);

	let outstandingLoan = loanPrincipal;
	let propertyValue = propertyPrice;
	let currentMonthlyRent = inputs.monthlyRent;
	let buyCorpus = Math.max(0, upfrontRentCash - upfrontBuyCash);
	let rentCorpus = Math.max(0, upfrontBuyCash - upfrontRentCash);

	const points: BuyVsRentPoint[] = [];

	function createPoint({
		yearOffset,
		buyAnnualOutgo,
		rentAnnualOutgo,
		annualPrincipalPaid,
		annualInterestPaid,
		annualMaintenancePaid,
		annualRentPaid,
		monthlyTakeHomeOldRegime,
		monthlyTakeHomeNewRegime,
		monthlyTakeHomeRecommended,
	}: {
		yearOffset: number;
		buyAnnualOutgo: number;
		rentAnnualOutgo: number;
		annualPrincipalPaid: number;
		annualInterestPaid: number;
		annualMaintenancePaid: number;
		annualRentPaid: number;
		monthlyTakeHomeOldRegime: number | null;
		monthlyTakeHomeNewRegime: number | null;
		monthlyTakeHomeRecommended: number | null;
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
			monthlyTakeHomeOldRegime,
			monthlyTakeHomeNewRegime,
			monthlyTakeHomeRecommended,
			buyStressRatio:
				monthlyTakeHomeRecommended && monthlyTakeHomeRecommended > 0
					? buyAnnualOutgo / 12 / monthlyTakeHomeRecommended
					: null,
			rentStressRatio:
				monthlyTakeHomeRecommended && monthlyTakeHomeRecommended > 0
					? rentAnnualOutgo / 12 / monthlyTakeHomeRecommended
					: null,
		});
	}

	const yearZeroTakeHomeByRegime = calculateTakeHomeByRegime(
		inputs.annualCtcLakhs,
	);
	createPoint({
		yearOffset: 0,
		buyAnnualOutgo: 0,
		rentAnnualOutgo: 0,
		annualPrincipalPaid: 0,
		annualInterestPaid: 0,
		annualMaintenancePaid: 0,
		annualRentPaid: 0,
		monthlyTakeHomeOldRegime: yearZeroTakeHomeByRegime.oldRegime,
		monthlyTakeHomeNewRegime: yearZeroTakeHomeByRegime.newRegime,
		monthlyTakeHomeRecommended: getRecommendedTakeHome(
			yearZeroTakeHomeByRegime,
			recommendedTaxRegime,
		),
	});

	for (let yearIndex = 1; yearIndex <= inputs.stayYears; yearIndex += 1) {
		let buyAnnualOutgo = 0;
		let rentAnnualOutgo = 0;
		let annualPrincipalPaid = 0;
		let annualInterestPaid = 0;
		let annualMaintenancePaid = 0;
		let annualRentPaid = 0;

		const annualCtcForYear =
			inputs.annualCtcLakhs *
			(1 + inputs.salaryGrowthPct / 100) ** (yearIndex - 1);
		const takeHomeByRegime = calculateTakeHomeByRegime(annualCtcForYear);
		const monthlyTakeHomeRecommended = getRecommendedTakeHome(
			takeHomeByRegime,
			recommendedTaxRegime,
		);

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

			const monthlyBuyOutgo = Math.max(0, monthlyEmi + monthlyMaintenance);
			const monthlyRentOutgo = Math.max(0, currentMonthlyRent);

			buyAnnualOutgo += monthlyBuyOutgo;
			rentAnnualOutgo += monthlyRentOutgo;
			annualPrincipalPaid += monthlyPrincipalPaid;
			annualInterestPaid += monthlyInterestPaid;
			annualMaintenancePaid += monthlyMaintenance;
			annualRentPaid += currentMonthlyRent;

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
			monthlyTakeHomeOldRegime: takeHomeByRegime.oldRegime,
			monthlyTakeHomeNewRegime: takeHomeByRegime.newRegime,
			monthlyTakeHomeRecommended,
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

	const annualIncomeRupees = toRupeesFromLakhs(inputs.annualCtcLakhs);
	const priceToIncomeRatio =
		annualIncomeRupees > 0 ? propertyPrice / annualIncomeRupees : 0;
	const priceToIncomeBand = classifyBand(
		priceToIncomeRatio,
		BUY_VS_RENT_BENCHMARKS.priceToIncome,
	);
	const firstYearMonthlyEmi =
		(firstYearPoint.annualPrincipalPaid + firstYearPoint.annualInterestPaid) /
		12;
	const emiToIncomeRatio =
		firstYearPoint.monthlyTakeHomeRecommended &&
		firstYearPoint.monthlyTakeHomeRecommended > 0
			? firstYearMonthlyEmi / firstYearPoint.monthlyTakeHomeRecommended
			: null;
	const emiToIncomeBand =
		emiToIncomeRatio === null
			? null
			: classifyBand(emiToIncomeRatio, BUY_VS_RENT_BENCHMARKS.emiToIncome);
	const loanEndAge = inputs.ageYears + inputs.loanTenureYears;
	const ageTenureBand =
		loanEndAge <= BUY_VS_RENT_BENCHMARKS.ageTenure.goodMaxLoanEndAge
			? ("good" as const)
			: loanEndAge <= BUY_VS_RENT_BENCHMARKS.ageTenure.watchMaxLoanEndAge
				? ("watch" as const)
				: ("risky" as const);
	const affordabilityBenchmarks = buildAffordabilityBenchmarks({
		priceToIncomeRatio,
		priceToIncomeBand,
		emiToIncomeRatio,
		emiToIncomeBand,
		loanEndAge,
		ageTenureBand,
	});

	const baseSummary: Omit<
		BuyVsRentSummary,
		"insights" | "story" | "decisionNote"
	> = {
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
		monthlyTakeHomeOldRegime: firstYearPoint.monthlyTakeHomeOldRegime,
		monthlyTakeHomeNewRegime: firstYearPoint.monthlyTakeHomeNewRegime,
		monthlyTakeHomeRecommended: firstYearPoint.monthlyTakeHomeRecommended,
		recommendedTaxRegime,
		recommendedTaxRegimeNote: getTaxRegimeRecommendationNote({
			recommendedTaxRegime,
			oldRegimeMonthlyTakeHome: firstYearPoint.monthlyTakeHomeOldRegime,
			newRegimeMonthlyTakeHome: firstYearPoint.monthlyTakeHomeNewRegime,
		}),
		buyStressRatio: firstYearPoint.buyStressRatio,
		rentStressRatio: firstYearPoint.rentStressRatio,
		priceToIncomeRatio,
		priceToIncomeBand,
		emiToIncomeRatio,
		emiToIncomeBand,
		ageTenureBand,
		affordabilityBenchmarks,
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
			priceToIncomeBand,
			emiToIncomeBand,
			ageTenureBand,
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
