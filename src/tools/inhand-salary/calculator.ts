import {
	EDUCATION_CESS_RATE,
	NEW_REGIME_REBATE_THRESHOLD,
	NEW_REGIME_SLABS,
	NEW_REGIME_STANDARD_DEDUCTION,
	OLD_REGIME_SLABS,
	OLD_REGIME_STANDARD_DEDUCTION,
	PROFESSIONAL_TAX_YEARLY,
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

export function calculate(
	ctcLakhs: number,
	pfMonthly: number,
	regime: TaxRegime,
): CalculationResult | null {
	if (!ctcLakhs || ctcLakhs <= 0) return null;

	const grossIncome = ctcLakhs * 100000;
	const standardDeduction =
		regime === "new"
			? NEW_REGIME_STANDARD_DEDUCTION
			: OLD_REGIME_STANDARD_DEDUCTION;
	const taxableIncome = Math.max(0, grossIncome - standardDeduction);

	const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
	const { results: slabResults, baseTax } = buildSlabResults(
		slabs,
		taxableIncome,
	);

	// Section 87A rebate (new regime only)
	const rebateApplied =
		regime === "new" && taxableIncome <= NEW_REGIME_REBATE_THRESHOLD;
	const effectiveTax = rebateApplied ? 0 : baseTax;

	const educationCess = effectiveTax * EDUCATION_CESS_RATE;
	const professionalTax = PROFESSIONAL_TAX_YEARLY;
	const totalTax = effectiveTax + educationCess + professionalTax;

	const pfEmployeeYearly = pfMonthly * 12;
	const pfEmployerYearly = pfMonthly * 12;
	const totalPF = pfEmployeeYearly + pfEmployerYearly;

	const inHandYearly = grossIncome - totalTax - totalPF;
	const inHandMonthly = inHandYearly / 12;

	return {
		grossIncome,
		standardDeduction,
		taxableIncome,
		baseTax: effectiveTax,
		rebateApplied,
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
