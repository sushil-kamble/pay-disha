import {
	EDUCATION_CESS_RATE,
	NEW_REGIME_REBATE_MAX,
	NEW_REGIME_REBATE_THRESHOLD,
	NEW_REGIME_SLABS,
	NEW_REGIME_STANDARD_DEDUCTION,
	OLD_REGIME_REBATE_MAX,
	OLD_REGIME_REBATE_THRESHOLD,
	OLD_REGIME_SLABS,
	OLD_REGIME_STANDARD_DEDUCTION,
	PROFESSIONAL_TAX_YEARLY,
	SURCHARGE_RATE_1CR_TO_2CR,
	SURCHARGE_RATE_2CR_TO_5CR,
	SURCHARGE_RATE_50L_TO_1CR,
	SURCHARGE_RATE_ABOVE_5CR_NEW,
	SURCHARGE_RATE_ABOVE_5CR_OLD,
	SURCHARGE_THRESHOLD_1CR,
	SURCHARGE_THRESHOLD_2CR,
	SURCHARGE_THRESHOLD_5CR,
	SURCHARGE_THRESHOLD_50L,
} from "./constants";
import type {
	CalculationResult,
	SlabResult,
	TaxRegime,
	TaxSlab,
} from "./types";

export function formatIndian(num: number): string {
	return Math.round(num).toLocaleString("en-IN");
}

export function formatShort(num: number): string {
	const abs = Math.abs(num);
	const sign = num < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
	if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
	if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
	return `${sign}₹${Math.round(abs)}`;
}

function buildSlabResults(
	slabs: TaxSlab[],
	taxableIncome: number,
): { results: SlabResult[]; baseTax: number } {
	let remaining = taxableIncome;
	let baseTax = 0;
	const results: SlabResult[] = [];

	for (const slab of slabs) {
		if (remaining <= 0) break;
		const slabWidth =
			slab.max === Number.POSITIVE_INFINITY ? remaining : slab.max - slab.min;
		const taxableInSlab = Math.min(remaining, slabWidth);
		const tax = taxableInSlab * slab.rate;
		baseTax += tax;

		const label =
			slab.min === 0
				? `Up to ₹${formatIndian(slab.max)}`
				: slab.max === Number.POSITIVE_INFINITY
					? `Above ₹${formatIndian(slab.min)}`
					: `₹${formatIndian(slab.min + 1)} – ₹${formatIndian(slab.max)}`;

		results.push({ label, rate: slab.rate, taxableAmount: taxableInSlab, tax });
		remaining -= taxableInSlab;
	}

	return { results, baseTax };
}

interface SurchargeContext {
	rate: number;
	threshold: number;
	previousRate: number;
}

function getSurchargeContext(
	taxableIncome: number,
	regime: TaxRegime,
): SurchargeContext | null {
	if (taxableIncome <= SURCHARGE_THRESHOLD_50L) return null;

	if (taxableIncome <= SURCHARGE_THRESHOLD_1CR) {
		return {
			rate: SURCHARGE_RATE_50L_TO_1CR,
			threshold: SURCHARGE_THRESHOLD_50L,
			previousRate: 0,
		};
	}

	if (taxableIncome <= SURCHARGE_THRESHOLD_2CR) {
		return {
			rate: SURCHARGE_RATE_1CR_TO_2CR,
			threshold: SURCHARGE_THRESHOLD_1CR,
			previousRate: SURCHARGE_RATE_50L_TO_1CR,
		};
	}

	if (taxableIncome <= SURCHARGE_THRESHOLD_5CR) {
		return {
			rate: SURCHARGE_RATE_2CR_TO_5CR,
			threshold: SURCHARGE_THRESHOLD_2CR,
			previousRate: SURCHARGE_RATE_1CR_TO_2CR,
		};
	}

	return {
		rate:
			regime === "new"
				? SURCHARGE_RATE_ABOVE_5CR_NEW
				: SURCHARGE_RATE_ABOVE_5CR_OLD,
		threshold: SURCHARGE_THRESHOLD_5CR,
		previousRate: SURCHARGE_RATE_2CR_TO_5CR,
	};
}

function calculateSurchargeAndRelief(
	taxableIncome: number,
	taxAfterRebate: number,
	slabs: TaxSlab[],
	regime: TaxRegime,
): { surchargeRate: number; surcharge: number; marginalRelief: number } {
	const context = getSurchargeContext(taxableIncome, regime);
	if (!context || taxAfterRebate <= 0) {
		return { surchargeRate: 0, surcharge: 0, marginalRelief: 0 };
	}

	const surchargeBeforeRelief = taxAfterRebate * context.rate;
	const taxWithSurcharge = taxAfterRebate + surchargeBeforeRelief;

	const { baseTax: thresholdBaseTax } = buildSlabResults(
		slabs,
		context.threshold,
	);
	const taxAtThresholdWithSurcharge =
		thresholdBaseTax * (1 + context.previousRate);
	const maxTaxWithSurcharge =
		taxAtThresholdWithSurcharge + (taxableIncome - context.threshold);

	const rawMarginalRelief = Math.max(0, taxWithSurcharge - maxTaxWithSurcharge);
	const marginalRelief = Math.min(rawMarginalRelief, surchargeBeforeRelief);
	const surcharge = Math.max(0, surchargeBeforeRelief - marginalRelief);

	return { surchargeRate: context.rate, surcharge, marginalRelief };
}

export function calculate(
	ctcLakhs: number,
	pfMonthly: number,
	regime: TaxRegime,
	expectedExemptions = 0,
): CalculationResult | null {
	if (!ctcLakhs || ctcLakhs <= 0) return null;

	const grossIncome = ctcLakhs * 100000;
	const pfEmployeeYearly = pfMonthly * 12;
	const pfEmployerYearly = pfMonthly * 12;
	const totalPF = pfEmployeeYearly + pfEmployerYearly;
	const professionalTax = PROFESSIONAL_TAX_YEARLY;

	const standardDeduction =
		regime === "new"
			? NEW_REGIME_STANDARD_DEDUCTION
			: OLD_REGIME_STANDARD_DEDUCTION;
	const professionalTaxDeduction = regime === "old" ? professionalTax : 0;
	const employeePfTaxDeduction =
		regime === "old" ? Math.max(0, pfEmployeeYearly) : 0;
	const taxableIncomeBeforeExemptions = Math.max(
		0,
		grossIncome -
			standardDeduction -
			professionalTaxDeduction -
			employeePfTaxDeduction,
	);
	const exemptionsApplied =
		regime === "old"
			? Math.min(
					taxableIncomeBeforeExemptions,
					Number.isFinite(expectedExemptions) && expectedExemptions > 0
						? expectedExemptions
						: 0,
				)
			: 0;
	const taxableIncome = Math.max(
		0,
		taxableIncomeBeforeExemptions - exemptionsApplied,
	);

	const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
	const { results: slabResults, baseTax } = buildSlabResults(
		slabs,
		taxableIncome,
	);

	const rebateThreshold =
		regime === "new"
			? NEW_REGIME_REBATE_THRESHOLD
			: OLD_REGIME_REBATE_THRESHOLD;
	const rebateMax =
		regime === "new" ? NEW_REGIME_REBATE_MAX : OLD_REGIME_REBATE_MAX;
	const rebateAmount =
		taxableIncome <= rebateThreshold ? Math.min(baseTax, rebateMax) : 0;
	const rebateApplied = rebateAmount > 0;
	const taxAfterRebate = Math.max(0, baseTax - rebateAmount);

	const { surchargeRate, surcharge, marginalRelief } =
		calculateSurchargeAndRelief(taxableIncome, taxAfterRebate, slabs, regime);
	const taxBeforeCess = taxAfterRebate + surcharge;

	const educationCess = taxBeforeCess * EDUCATION_CESS_RATE;
	const totalTax = taxBeforeCess + educationCess + professionalTax;

	const inHandYearly = grossIncome - totalTax - totalPF;
	const inHandMonthly = inHandYearly / 12;

	return {
		grossIncome,
		standardDeduction,
		professionalTaxDeduction,
		employeePfTaxDeduction,
		taxableIncomeBeforeExemptions,
		exemptionsApplied,
		taxableIncome,
		baseTax,
		rebateApplied,
		rebateAmount,
		taxAfterRebate,
		surchargeRate,
		surcharge,
		marginalRelief,
		educationCess,
		professionalTax,
		totalTax,
		taxMonthly: totalTax / 12,
		pfEmployeeYearly,
		pfEmployerYearly,
		totalPF,
		inHandYearly,
		inHandMonthly,
		slabs: slabResults,
	};
}
