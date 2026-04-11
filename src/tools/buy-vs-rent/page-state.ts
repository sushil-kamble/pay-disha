import {
	BUY_VS_RENT_STORAGE_KEY,
	DEFAULT_BUY_VS_RENT_INPUTS,
} from "./constants";
import { formatCurrency } from "./insights";
import type { BuyVsRentCityTier } from "./types";

export type BuyVsRentDraft = {
	propertyPriceLakhs: string;
	monthlyRent: string;
	homeLoanRatePct: string;
	stayYears: string;
	downPaymentLakhs: string;
	loanTenureYears: string;
	annualCtcLakhs: string;
	cityTier: BuyVsRentCityTier;
	ageYears: string;
	salaryGrowthPct: string;
};

export type BuyVsRentDraftFieldKey = keyof Omit<BuyVsRentDraft, "cityTier">;

type PersistedBuyVsRentState = {
	draft: BuyVsRentDraft;
	taxOpen: boolean;
	showRealView: boolean;
};

export function createDraft(): BuyVsRentDraft {
	return {
		propertyPriceLakhs: String(DEFAULT_BUY_VS_RENT_INPUTS.propertyPriceLakhs),
		monthlyRent: String(DEFAULT_BUY_VS_RENT_INPUTS.monthlyRent),
		homeLoanRatePct: String(DEFAULT_BUY_VS_RENT_INPUTS.homeLoanRatePct),
		stayYears: String(DEFAULT_BUY_VS_RENT_INPUTS.stayYears),
		downPaymentLakhs: String(DEFAULT_BUY_VS_RENT_INPUTS.downPaymentLakhs),
		loanTenureYears: String(DEFAULT_BUY_VS_RENT_INPUTS.loanTenureYears),
		annualCtcLakhs: String(DEFAULT_BUY_VS_RENT_INPUTS.annualCtcLakhs),
		cityTier: DEFAULT_BUY_VS_RENT_INPUTS.cityTier,
		ageYears: String(DEFAULT_BUY_VS_RENT_INPUTS.ageYears),
		salaryGrowthPct: String(DEFAULT_BUY_VS_RENT_INPUTS.salaryGrowthPct),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isBuyVsRentCityTier(value: unknown): value is BuyVsRentCityTier {
	return value === "tier-1" || value === "tier-2" || value === "tier-3";
}

function isBuyVsRentDraft(value: unknown): value is BuyVsRentDraft {
	if (!isRecord(value)) return false;

	return (
		typeof value.propertyPriceLakhs === "string" &&
		typeof value.monthlyRent === "string" &&
		typeof value.homeLoanRatePct === "string" &&
		typeof value.stayYears === "string" &&
		typeof value.downPaymentLakhs === "string" &&
		typeof value.loanTenureYears === "string" &&
		typeof value.annualCtcLakhs === "string" &&
		isBuyVsRentCityTier(value.cityTier) &&
		typeof value.ageYears === "string" &&
		typeof value.salaryGrowthPct === "string"
	);
}

function parseStoredJson(rawValue: string | null) {
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
}

export function loadStoredState() {
	try {
		const parsed = parseStoredJson(
			window.localStorage.getItem(BUY_VS_RENT_STORAGE_KEY),
		);
		if (!isRecord(parsed)) return null;
		if (
			!isBuyVsRentDraft(parsed.draft) ||
			typeof parsed.taxOpen !== "boolean" ||
			typeof parsed.showRealView !== "boolean"
		) {
			return null;
		}

		return parsed as PersistedBuyVsRentState;
	} catch {
		return null;
	}
}

export function saveStoredState(value: {
	draft: BuyVsRentDraft;
	taxOpen: boolean;
	showRealView: boolean;
}) {
	try {
		window.localStorage.setItem(BUY_VS_RENT_STORAGE_KEY, JSON.stringify(value));
	} catch {
		// Ignore storage write failures such as private browsing quotas.
	}
}

export function parseNumber(value: string, fallback: number) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatMonthly(value: number) {
	return `${formatCurrency(value)}/mo`;
}

export function formatPercent(value: number) {
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
