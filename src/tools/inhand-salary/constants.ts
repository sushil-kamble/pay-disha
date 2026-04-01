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
// Section 87A: full tax rebate if taxable income ≤ this threshold
export const NEW_REGIME_REBATE_THRESHOLD = 1200000;

// ── Old Regime ────────────────────────────────────────────────────
export const OLD_REGIME_SLABS: TaxSlab[] = [
	{ min: 0, max: 250000, rate: 0 },
	{ min: 250000, max: 500000, rate: 0.05 },
	{ min: 500000, max: 1000000, rate: 0.2 },
	{ min: 1000000, max: Number.POSITIVE_INFINITY, rate: 0.3 },
];

export const OLD_REGIME_STANDARD_DEDUCTION = 50000;

// ── Common Rates ──────────────────────────────────────────────────
// Education & Health Cess on income tax
export const EDUCATION_CESS_RATE = 0.04;

// Professional Tax: ₹200/month in most states — adjust per state
export const PROFESSIONAL_TAX_YEARLY = 2400;

// ── PF Defaults ───────────────────────────────────────────────────
// Minimum statutory PF: 12% of ₹15,000 basic = ₹1,800/month
export const DEFAULT_PF_MONTHLY = 1800;

// ── Input Limits ──────────────────────────────────────────────────
export const CTC_WARNING_THRESHOLD_LAKHS = 1000; // > ₹10 Cr — likely a typo
