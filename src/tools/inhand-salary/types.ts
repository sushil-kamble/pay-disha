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
	taxableIncome: number;
	baseTax: number;
	rebateApplied: boolean;
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
	regime: TaxRegime;
}
