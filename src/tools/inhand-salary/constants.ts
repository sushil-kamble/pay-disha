import type { TaxSlab } from "./types";

// ── Financial Year ────────────────────────────────────────────────
export const FINANCIAL_YEAR = "FY 2025-26";

// ── New Regime (Budget 2025) ──────────────────────────────────────
export const NEW_REGIME_SLABS: TaxSlab[] = [
	{ min: 0, max: 400000, rate: 0 },
	{ min: 400000, max: 800000, rate: 0.05 },
	{ min: 800000, max: 1200000, rate: 0.1 },
	{ min: 1200000, max: 1600000, rate: 0.15 },
	{ min: 1600000, max: 2000000, rate: 0.2 },
	{ min: 2000000, max: 2400000, rate: 0.25 },
	{ min: 2400000, max: Number.POSITIVE_INFINITY, rate: 0.3 },
];

export const NEW_REGIME_STANDARD_DEDUCTION = 75000;
// Section 87A (new regime)
export const NEW_REGIME_REBATE_THRESHOLD = 1200000;
export const NEW_REGIME_REBATE_MAX = 60000;

// ── Old Regime ────────────────────────────────────────────────────
export const OLD_REGIME_SLABS: TaxSlab[] = [
	{ min: 0, max: 250000, rate: 0 },
	{ min: 250000, max: 500000, rate: 0.05 },
	{ min: 500000, max: 1000000, rate: 0.2 },
	{ min: 1000000, max: Number.POSITIVE_INFINITY, rate: 0.3 },
];

export const OLD_REGIME_STANDARD_DEDUCTION = 50000;
// Section 87A (old regime)
export const OLD_REGIME_REBATE_THRESHOLD = 500000;
export const OLD_REGIME_REBATE_MAX = 12500;

// ── Common Rates ──────────────────────────────────────────────────
// Education & Health Cess on income tax
export const EDUCATION_CESS_RATE = 0.04;

// Professional Tax: ₹200/month in most states — adjust per state
export const PROFESSIONAL_TAX_YEARLY = 2400;

// ── Surcharge (on income tax) ───────────────────────────────────
export const SURCHARGE_THRESHOLD_50L = 5000000;
export const SURCHARGE_THRESHOLD_1CR = 10000000;
export const SURCHARGE_THRESHOLD_2CR = 20000000;
export const SURCHARGE_THRESHOLD_5CR = 50000000;

export const SURCHARGE_RATE_50L_TO_1CR = 0.1;
export const SURCHARGE_RATE_1CR_TO_2CR = 0.15;
export const SURCHARGE_RATE_2CR_TO_5CR = 0.25;
export const SURCHARGE_RATE_ABOVE_5CR_NEW = 0.25;
export const SURCHARGE_RATE_ABOVE_5CR_OLD = 0.37;

// ── PF Defaults ───────────────────────────────────────────────────
// Minimum statutory PF: 12% of ₹15,000 basic = ₹1,800/month
export const DEFAULT_PF_MONTHLY = 1800;

// ── Input Limits ──────────────────────────────────────────────────
export const CTC_WARNING_THRESHOLD_LAKHS = 1000; // > ₹10 Cr — likely a typo
