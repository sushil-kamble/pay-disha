import {
	AFFORDABILITY_THRESHOLDS,
	BUY_VS_RENT_LIMITS,
	DEFAULT_ADVANCED_ASSUMPTIONS,
	DEFAULT_QUICK_INPUTS,
	MARKET_DEFAULTS,
	VERDICT_LABELS,
} from "./constants";
import type {
	AdvancedAssumptions,
	AffordabilityBand,
	AnswerChangingLever,
	BuyVsRentInputs,
	BuyVsRentPoint,
	BuyVsRentResult,
	BuyVsRentVerdict,
	DecisionResult,
	MarketType,
	ScenarioConfidence,
	ScenarioResult,
} from "./types";

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function toRupeesFromLakhs(value: number) {
	return value * 100000;
}

function normaliseMarketType(
	value: MarketType | string | undefined,
): MarketType {
	if (value === "metro" || value === "smaller-city") return value;
	return "large-city";
}

function monthlyRate(annualRatePct: number) {
	return (1 + annualRatePct / 100) ** (1 / 12) - 1;
}

function formatYearLabel(index: number) {
	return index === 0 ? "Now" : `Year ${index}`;
}

function formatCurrency(value: number) {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
	if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
	if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
	return `${sign}₹${Math.round(abs)}`;
}

function formatIndian(value: number) {
	return Math.round(value).toLocaleString("en-IN");
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

function normaliseInputs(
	input: Partial<BuyVsRentInputs> = {},
): BuyVsRentInputs {
	const quick = { ...DEFAULT_QUICK_INPUTS, ...input };
	const propertyPriceLakhs = clamp(
		quick.propertyPriceLakhs,
		BUY_VS_RENT_LIMITS.minPropertyPriceLakhs,
		BUY_VS_RENT_LIMITS.maxPropertyPriceLakhs,
	);
	const monthlyRent = clamp(
		quick.monthlyRent,
		BUY_VS_RENT_LIMITS.minMonthlyRent,
		BUY_VS_RENT_LIMITS.maxMonthlyRent,
	);
	const marketType = normaliseMarketType(input.marketType);
	const marketDefaults = MARKET_DEFAULTS[marketType];
	const propertyPrice = toRupeesFromLakhs(propertyPriceLakhs);

	const assumptions: AdvancedAssumptions = {
		...DEFAULT_ADVANCED_ASSUMPTIONS,
		marketType,
		extraBuyingCostPct:
			input.extraBuyingCostPct ?? marketDefaults.extraBuyingCostPct,
		monthlyOwnerCost:
			input.monthlyOwnerCost ??
			(propertyPrice * (marketDefaults.ownerCostAnnualPct / 100)) / 12,
		rentSetupCost:
			input.rentSetupCost ?? monthlyRent * marketDefaults.rentSetupMonths,
		rentIncreasePct: input.rentIncreasePct ?? marketDefaults.rentIncreasePct,
		propertyAppreciationPct:
			input.propertyAppreciationPct ?? marketDefaults.propertyAppreciationPct,
		investmentReturnPct:
			input.investmentReturnPct ??
			DEFAULT_ADVANCED_ASSUMPTIONS.investmentReturnPct,
		loanRatePct: input.loanRatePct ?? DEFAULT_ADVANCED_ASSUMPTIONS.loanRatePct,
		loanTenureYears:
			input.loanTenureYears ?? DEFAULT_ADVANCED_ASSUMPTIONS.loanTenureYears,
		saleCostPct: input.saleCostPct ?? DEFAULT_ADVANCED_ASSUMPTIONS.saleCostPct,
	};

	return {
		propertyPriceLakhs,
		monthlyRent,
		stayYears: Math.round(
			clamp(
				quick.stayYears,
				BUY_VS_RENT_LIMITS.minStayYears,
				BUY_VS_RENT_LIMITS.maxStayYears,
			),
		),
		monthlyTakeHome: clamp(
			quick.monthlyTakeHome,
			BUY_VS_RENT_LIMITS.minMonthlyTakeHome,
			BUY_VS_RENT_LIMITS.maxMonthlyTakeHome,
		),
		availableCashLakhs: clamp(
			quick.availableCashLakhs,
			BUY_VS_RENT_LIMITS.minAvailableCashLakhs,
			Math.min(propertyPriceLakhs, BUY_VS_RENT_LIMITS.maxAvailableCashLakhs),
		),
		marketType,
		loanRatePct: clamp(
			assumptions.loanRatePct,
			BUY_VS_RENT_LIMITS.minLoanRatePct,
			BUY_VS_RENT_LIMITS.maxLoanRatePct,
		),
		loanTenureYears: Math.round(
			clamp(
				assumptions.loanTenureYears,
				BUY_VS_RENT_LIMITS.minLoanTenureYears,
				BUY_VS_RENT_LIMITS.maxLoanTenureYears,
			),
		),
		extraBuyingCostPct: clamp(
			assumptions.extraBuyingCostPct,
			BUY_VS_RENT_LIMITS.minExtraBuyingCostPct,
			BUY_VS_RENT_LIMITS.maxExtraBuyingCostPct,
		),
		monthlyOwnerCost: clamp(
			assumptions.monthlyOwnerCost,
			BUY_VS_RENT_LIMITS.minMonthlyOwnerCost,
			BUY_VS_RENT_LIMITS.maxMonthlyOwnerCost,
		),
		rentSetupCost: clamp(
			assumptions.rentSetupCost,
			BUY_VS_RENT_LIMITS.minRentSetupCost,
			BUY_VS_RENT_LIMITS.maxRentSetupCost,
		),
		rentIncreasePct: clamp(
			assumptions.rentIncreasePct,
			BUY_VS_RENT_LIMITS.minRentIncreasePct,
			BUY_VS_RENT_LIMITS.maxRentIncreasePct,
		),
		propertyAppreciationPct: clamp(
			assumptions.propertyAppreciationPct,
			BUY_VS_RENT_LIMITS.minPropertyAppreciationPct,
			BUY_VS_RENT_LIMITS.maxPropertyAppreciationPct,
		),
		investmentReturnPct: clamp(
			assumptions.investmentReturnPct,
			BUY_VS_RENT_LIMITS.minInvestmentReturnPct,
			BUY_VS_RENT_LIMITS.maxInvestmentReturnPct,
		),
		saleCostPct: clamp(
			assumptions.saleCostPct,
			BUY_VS_RENT_LIMITS.minSaleCostPct,
			BUY_VS_RENT_LIMITS.maxSaleCostPct,
		),
	};
}

function getVerdict({
	gap,
	propertyPrice,
	monthlyRent,
}: {
	gap: number;
	propertyPrice: number;
	monthlyRent: number;
}): BuyVsRentVerdict {
	const closeBand = Math.max(propertyPrice * 0.03, monthlyRent * 12);
	if (Math.abs(gap) <= closeBand) return "close-call";
	return gap > 0 ? "buy" : "rent";
}

function getAffordabilityBand(pressure: number | null): AffordabilityBand {
	if (pressure === null) return "watch";
	if (pressure <= AFFORDABILITY_THRESHOLDS.comfortableMax) return "comfortable";
	if (pressure <= AFFORDABILITY_THRESHOLDS.watchMax) return "watch";
	return "stretched";
}

function calculateCore(inputs: BuyVsRentInputs) {
	const propertyPrice = toRupeesFromLakhs(inputs.propertyPriceLakhs);
	const availableCash = toRupeesFromLakhs(inputs.availableCashLakhs);
	const extraBuyingCosts = propertyPrice * (inputs.extraBuyingCostPct / 100);
	const downPayment = Math.max(0, availableCash - extraBuyingCosts);
	const loanPrincipal = Math.max(propertyPrice - downPayment, 0);
	const upfrontCashNeeded = downPayment + extraBuyingCosts;
	const cashShortfall = Math.max(0, upfrontCashNeeded - availableCash);
	const emi = calculateEmi(
		loanPrincipal,
		inputs.loanRatePct,
		inputs.loanTenureYears,
	);
	const loanMonthlyRate = inputs.loanRatePct / 12 / 100;
	const investmentMonthlyRate = monthlyRate(inputs.investmentReturnPct);
	const loanMonths = inputs.loanTenureYears * 12;

	let outstandingLoan = loanPrincipal;
	let homeValue = propertyPrice;
	let currentRent = inputs.monthlyRent;
	let buyerInvestments = Math.max(0, inputs.rentSetupCost - upfrontCashNeeded);
	let renterInvestments = Math.max(0, upfrontCashNeeded - inputs.rentSetupCost);
	const points: BuyVsRentPoint[] = [];

	function pushPoint(
		yearOffset: number,
		monthlyBuy: number,
		monthlyRent: number,
	) {
		const saleableHomeValue = homeValue * (1 - inputs.saleCostPct / 100);
		const buyNetWorth = saleableHomeValue - outstandingLoan + buyerInvestments;
		const rentNetWorth = renterInvestments + inputs.rentSetupCost;

		points.push({
			year: new Date().getFullYear() + yearOffset,
			label: formatYearLabel(yearOffset),
			homeValue,
			outstandingLoan,
			buyNetWorth,
			rentNetWorth,
			gap: buyNetWorth - rentNetWorth,
			buyMonthlyCost: monthlyBuy,
			rentMonthlyCost: monthlyRent,
			buyerInvestments,
			renterInvestments,
		});
	}

	pushPoint(0, 0, 0);

	for (let yearIndex = 1; yearIndex <= inputs.stayYears; yearIndex += 1) {
		let annualBuyCost = 0;
		let annualRentCost = 0;

		for (let month = 0; month < 12; month += 1) {
			buyerInvestments *= 1 + investmentMonthlyRate;
			renterInvestments *= 1 + investmentMonthlyRate;

			const elapsedMonths = (yearIndex - 1) * 12 + month;
			let monthlyEmi = 0;

			if (outstandingLoan > 0 && elapsedMonths < loanMonths) {
				const interestPaid = outstandingLoan * loanMonthlyRate;
				const principalPaid = Math.min(emi - interestPaid, outstandingLoan);
				monthlyEmi = interestPaid + principalPaid;
				outstandingLoan = Math.max(0, outstandingLoan - principalPaid);
			}

			const monthlyBuy = monthlyEmi + inputs.monthlyOwnerCost;
			const monthlyRent = currentRent;
			annualBuyCost += monthlyBuy;
			annualRentCost += monthlyRent;

			const monthlyGap = monthlyBuy - monthlyRent;
			if (monthlyGap > 0) {
				renterInvestments += monthlyGap;
			} else if (monthlyGap < 0) {
				buyerInvestments += Math.abs(monthlyGap);
			}
		}

		homeValue *= 1 + inputs.propertyAppreciationPct / 100;
		pushPoint(yearIndex, annualBuyCost / 12, annualRentCost / 12);
		currentRent *= 1 + inputs.rentIncreasePct / 100;
	}

	const finalPoint = points.at(-1) ?? points[0];
	const firstYearPoint = points[1] ?? finalPoint;
	const verdict = getVerdict({
		gap: finalPoint.gap,
		propertyPrice,
		monthlyRent: inputs.monthlyRent,
	});

	return {
		points,
		verdict,
		wealthGap: finalPoint.gap,
		buyNetWorth: finalPoint.buyNetWorth,
		rentNetWorth: finalPoint.rentNetWorth,
		upfrontCashNeeded,
		cashShortfall,
		monthlyBuyCost: firstYearPoint.buyMonthlyCost,
		monthlyRentCost: firstYearPoint.rentMonthlyCost,
	};
}

function findBreakEvenYear(inputs: BuyVsRentInputs) {
	const maxYears = BUY_VS_RENT_LIMITS.maxStayYears;
	const result = calculateCore({ ...inputs, stayYears: maxYears });
	const breakEvenPoint = result.points.find(
		(point, index) => index > 0 && point.gap >= 0,
	);

	return breakEvenPoint
		? Number.parseInt(breakEvenPoint.label.slice(5), 10)
		: null;
}

function getScenarioInputs(
	inputs: BuyVsRentInputs,
	scenario: "Conservative" | "Balanced" | "Optimistic",
): BuyVsRentInputs {
	if (scenario === "Conservative") {
		return {
			...inputs,
			propertyAppreciationPct: Math.max(
				inputs.propertyAppreciationPct - 1.5,
				0,
			),
			rentIncreasePct: Math.max(inputs.rentIncreasePct - 1, 0),
			investmentReturnPct: inputs.investmentReturnPct + 1,
		};
	}

	if (scenario === "Optimistic") {
		return {
			...inputs,
			propertyAppreciationPct: inputs.propertyAppreciationPct + 1.5,
			rentIncreasePct: inputs.rentIncreasePct + 1,
			investmentReturnPct: Math.max(inputs.investmentReturnPct - 1, 0),
		};
	}

	return inputs;
}

function getScenarioConfidence(
	verdict: BuyVsRentVerdict,
	scenarios: ScenarioResult[],
): ScenarioConfidence {
	if (verdict === "close-call") return "close-call";
	const matchingScenarios = scenarios.filter(
		(scenario) => scenario.verdict === verdict,
	).length;
	return matchingScenarios === scenarios.length ? "strong-signal" : "sensitive";
}

function buildKeyDrivers({
	inputs,
	breakEvenYear,
	core,
	buyPressure,
	rentPressure,
}: {
	inputs: BuyVsRentInputs;
	breakEvenYear: number | null;
	core: ReturnType<typeof calculateCore>;
	buyPressure: number | null;
	rentPressure: number | null;
}) {
	const drivers: string[] = [];
	const upfrontGap = core.upfrontCashNeeded - inputs.rentSetupCost;

	if (upfrontGap > 0) {
		drivers.push(
			`Buying ties up ${formatCurrency(upfrontGap)} more on day one than renting.`,
		);
	}

	if (core.monthlyBuyCost > core.monthlyRentCost) {
		drivers.push(
			`Year-one ownership costs about ${formatCurrency(core.monthlyBuyCost - core.monthlyRentCost)} more per month.`,
		);
	} else {
		drivers.push(
			`Year-one ownership costs about ${formatCurrency(core.monthlyRentCost - core.monthlyBuyCost)} less per month than renting.`,
		);
	}

	if (breakEvenYear === null) {
		drivers.push("Buying does not catch up within a 30-year view.");
	} else if (breakEvenYear > inputs.stayYears) {
		drivers.push(
			`Buying only catches up if you can stay for about ${breakEvenYear} years.`,
		);
	} else {
		drivers.push(`Buying catches up around year ${breakEvenYear}.`);
	}

	if (buyPressure !== null && rentPressure !== null) {
		drivers.push(
			`Monthly pressure is ${(buyPressure * 100).toFixed(0)}% for buying versus ${(rentPressure * 100).toFixed(0)}% for renting.`,
		);
	}

	return drivers.slice(0, 4);
}

function calculateGapFor(
	input: BuyVsRentInputs,
	patch: Partial<BuyVsRentInputs>,
) {
	return calculateCore({ ...input, ...patch }).wealthGap;
}

function findHomePriceSwing(inputs: BuyVsRentInputs) {
	const targetVerdict = inputs.stayYears <= 0 ? "rent" : null;
	const currentGap = calculateCore(inputs).wealthGap;
	const wantsBuy = currentGap < 0;
	const basePrice = inputs.propertyPriceLakhs;
	let low: number = BUY_VS_RENT_LIMITS.minPropertyPriceLakhs;
	let high: number = BUY_VS_RENT_LIMITS.maxPropertyPriceLakhs;

	for (let index = 0; index < 24; index += 1) {
		const mid = (low + high) / 2;
		const gap = calculateGapFor(inputs, { propertyPriceLakhs: mid });

		if (wantsBuy) {
			if (gap >= 0) low = mid;
			else high = mid;
		} else if (gap <= 0) {
			high = mid;
		} else {
			low = mid;
		}
	}

	const threshold = wantsBuy ? high : low;
	const difference = Math.abs(basePrice - threshold);
	if (targetVerdict) return null;
	if (!Number.isFinite(difference) || difference < 0.5) return null;

	return {
		threshold,
		difference,
		wantsBuy,
	};
}

function findRentSwing(inputs: BuyVsRentInputs) {
	const currentGap = calculateCore(inputs).wealthGap;
	const wantsBuy = currentGap < 0;
	let low: number = BUY_VS_RENT_LIMITS.minMonthlyRent;
	let high: number = BUY_VS_RENT_LIMITS.maxMonthlyRent;

	for (let index = 0; index < 24; index += 1) {
		const mid = (low + high) / 2;
		const gap = calculateGapFor(inputs, { monthlyRent: mid });

		if (wantsBuy) {
			if (gap >= 0) high = mid;
			else low = mid;
		} else if (gap <= 0) {
			low = mid;
		} else {
			high = mid;
		}
	}

	const threshold = wantsBuy ? high : low;
	if (!Number.isFinite(threshold)) return null;

	return {
		threshold,
		wantsBuy,
	};
}

function buildAnswerChangingLevers(
	inputs: BuyVsRentInputs,
	core: ReturnType<typeof calculateCore>,
	breakEvenYear: number | null,
): AnswerChangingLever[] {
	const levers: AnswerChangingLever[] = [];
	const currentWinner = core.wealthGap >= 0 ? "buy" : "rent";

	if (breakEvenYear !== null && breakEvenYear > inputs.stayYears) {
		levers.push({
			label: "Stay longer",
			value: `${breakEvenYear - inputs.stayYears} more years`,
			description: `Buying starts to make sense around year ${breakEvenYear}.`,
			tone: "buy",
		});
	}

	const homePriceSwing = findHomePriceSwing(inputs);
	if (homePriceSwing) {
		levers.push({
			label:
				currentWinner === "rent" ? "Lower home price" : "Higher home price",
			value:
				currentWinner === "rent"
					? `${formatCurrency(toRupeesFromLakhs(homePriceSwing.difference))} lower`
					: `${formatCurrency(toRupeesFromLakhs(homePriceSwing.difference))} higher`,
			description:
				currentWinner === "rent"
					? `Buying becomes competitive around ${formatCurrency(toRupeesFromLakhs(homePriceSwing.threshold))}.`
					: `Renting becomes competitive around ${formatCurrency(toRupeesFromLakhs(homePriceSwing.threshold))}.`,
			tone: currentWinner === "rent" ? "buy" : "rent",
		});
	}

	const rentSwing = findRentSwing(inputs);
	if (rentSwing) {
		levers.push({
			label: currentWinner === "rent" ? "Higher rent" : "Lower rent",
			value: `${formatCurrency(rentSwing.threshold)}/mo`,
			description:
				currentWinner === "rent"
					? `Buying improves if similar-home rent crosses this level.`
					: `Renting improves if similar-home rent is closer to this level.`,
			tone: currentWinner === "rent" ? "buy" : "rent",
		});
	}

	if (levers.length === 0) {
		levers.push({
			label: "Assumption signal",
			value: VERDICT_LABELS[core.verdict],
			description:
				"The result is already close, so small changes in price, rent, or stay length can move the answer.",
			tone: "neutral",
		});
	}

	return levers.slice(0, 3);
}

function buildHeadline(verdict: BuyVsRentVerdict) {
	if (verdict === "buy") return "Buying looks stronger";
	if (verdict === "rent") return "Renting looks stronger";
	return "This is a close call";
}

function buildExplanation({
	verdict,
	wealthGap,
	stayYears,
	upfrontCashNeeded,
	breakEvenYear,
}: {
	verdict: BuyVsRentVerdict;
	wealthGap: number;
	stayYears: number;
	upfrontCashNeeded: number;
	breakEvenYear: number | null;
}) {
	const winner = VERDICT_LABELS[verdict];
	if (verdict === "close-call") {
		return `The two paths are within ${formatCurrency(Math.abs(wealthGap))} over ${stayYears} years, so flexibility and family certainty can reasonably decide.`;
	}

	const breakEvenCopy =
		breakEvenYear === null
			? "buying does not catch up within 30 years"
			: `buying breaks even around year ${breakEvenYear}`;

	return `${winner} is ahead by ${formatCurrency(Math.abs(wealthGap))} over ${stayYears} years because buying needs ${formatCurrency(upfrontCashNeeded)} upfront and ${breakEvenCopy}.`;
}

function buildLiquidityNote(cashShortfall: number, availableCash: number) {
	if (cashShortfall > 0) {
		return `You are short by about ${formatCurrency(cashShortfall)} for the estimated buying cash need.`;
	}

	if (availableCash <= 0) {
		return "The buying plan uses all available cash, so keep a separate emergency buffer.";
	}

	return `After estimated buying costs, about ${formatCurrency(availableCash)} remains from the cash you entered.`;
}

function buildDecision(
	inputs: BuyVsRentInputs,
	core: ReturnType<typeof calculateCore>,
	scenarios: ScenarioResult[],
): DecisionResult {
	const breakEvenYear = findBreakEvenYear(inputs);
	const buyPressure =
		inputs.monthlyTakeHome > 0
			? core.monthlyBuyCost / inputs.monthlyTakeHome
			: null;
	const rentPressure =
		inputs.monthlyTakeHome > 0
			? core.monthlyRentCost / inputs.monthlyTakeHome
			: null;
	const availableCashAfterBuying =
		toRupeesFromLakhs(inputs.availableCashLakhs) - core.upfrontCashNeeded;
	const confidence = getScenarioConfidence(core.verdict, scenarios);

	return {
		verdict: core.verdict,
		confidence,
		headline: buildHeadline(core.verdict),
		explanation: buildExplanation({
			verdict: core.verdict,
			wealthGap: core.wealthGap,
			stayYears: inputs.stayYears,
			upfrontCashNeeded: core.upfrontCashNeeded,
			breakEvenYear,
		}),
		wealthGap: core.wealthGap,
		breakEvenYear,
		buyMonthlyPressure: buyPressure,
		rentMonthlyPressure: rentPressure,
		affordabilityBand: getAffordabilityBand(buyPressure),
		upfrontCashNeeded: core.upfrontCashNeeded,
		cashShortfall: core.cashShortfall,
		liquidityNote: buildLiquidityNote(
			core.cashShortfall,
			availableCashAfterBuying,
		),
		monthlyBuyCost: core.monthlyBuyCost,
		monthlyRentCost: core.monthlyRentCost,
		buyNetWorth: core.buyNetWorth,
		rentNetWorth: core.rentNetWorth,
		keyDrivers: buildKeyDrivers({
			inputs,
			breakEvenYear,
			core,
			buyPressure,
			rentPressure,
		}),
		answerChangingLevers: buildAnswerChangingLevers(
			inputs,
			core,
			breakEvenYear,
		),
		scenarios,
	};
}

export function calculateBuyVsRent(
	input: Partial<BuyVsRentInputs> = {},
): BuyVsRentResult {
	const inputs = normaliseInputs(input);
	const core = calculateCore(inputs);
	const scenarios: ScenarioResult[] = (
		["Conservative", "Balanced", "Optimistic"] as const
	).map((name) => {
		const scenarioCore = calculateCore(getScenarioInputs(inputs, name));
		return {
			name,
			verdict: scenarioCore.verdict,
			gap: scenarioCore.wealthGap,
		};
	});

	return {
		inputs,
		points: core.points,
		decision: buildDecision(inputs, core, scenarios),
	};
}

export {
	calculateEmi,
	formatCurrency,
	formatIndian,
	normaliseInputs,
	toRupeesFromLakhs,
};
