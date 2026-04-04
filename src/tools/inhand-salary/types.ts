export type TaxRegime = "new" | "old";

export interface TaxSlab {
	min: number;
	max: number;
	rate: number;
}

export interface SlabResult {
	label: string;
	rate: number;
	taxableAmount: number;
	tax: number;
}

export interface CalculationResult {
	grossIncome: number;
	standardDeduction: number;
	professionalTaxDeduction: number;
	employeePfTaxDeduction: number;
	taxableIncomeBeforeExemptions: number;
	exemptionsApplied: number;
	taxableIncome: number;
	baseTax: number;
	rebateApplied: boolean;
	rebateAmount: number;
	taxAfterRebate: number;
	surchargeRate: number;
	surcharge: number;
	marginalRelief: number;
	educationCess: number;
	professionalTax: number;
	totalTax: number;
	taxMonthly: number;
	pfEmployeeYearly: number;
	pfEmployerYearly: number;
	totalPF: number;
	inHandYearly: number;
	inHandMonthly: number;
	slabs: SlabResult[];
}

export interface CalculatorInputs {
	ctcLakhs: number;
	pfMonthly: number;
	expectedExemptions: number;
	regime: TaxRegime;
}
