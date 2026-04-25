import { formatCurrency } from "./calculator";
import {
	BUY_VS_RENT_STORAGE_KEY,
	DEFAULT_ADVANCED_ASSUMPTIONS,
	DEFAULT_QUICK_INPUTS,
} from "./constants";
import type { MarketType } from "./types";

export type BuyVsRentDraft = {
	propertyPriceLakhs: string;
	monthlyRent: string;
	stayYears: string;
	monthlyTakeHome: string;
	availableCashLakhs: string;
	marketType: MarketType;
	loanRatePct: string;
	loanTenureYears: string;
	extraBuyingCostPct: string;
	monthlyOwnerCost: string;
	rentSetupCost: string;
	rentIncreasePct: string;
	propertyAppreciationPct: string;
	investmentReturnPct: string;
};

export type BuyVsRentDraftFieldKey = keyof Omit<BuyVsRentDraft, "marketType">;

type PersistedBuyVsRentState = {
	draft: BuyVsRentDraft;
	advancedOpen: boolean;
	detailsOpen: boolean;
	customGrowthOpen: boolean;
};

export function createDraft(): BuyVsRentDraft {
	return {
		propertyPriceLakhs: String(DEFAULT_QUICK_INPUTS.propertyPriceLakhs),
		monthlyRent: String(DEFAULT_QUICK_INPUTS.monthlyRent),
		stayYears: String(DEFAULT_QUICK_INPUTS.stayYears),
		monthlyTakeHome: String(DEFAULT_QUICK_INPUTS.monthlyTakeHome),
		availableCashLakhs: String(DEFAULT_QUICK_INPUTS.availableCashLakhs),
		marketType: DEFAULT_ADVANCED_ASSUMPTIONS.marketType,
		loanRatePct: String(DEFAULT_ADVANCED_ASSUMPTIONS.loanRatePct),
		loanTenureYears: String(DEFAULT_ADVANCED_ASSUMPTIONS.loanTenureYears),
		extraBuyingCostPct: String(DEFAULT_ADVANCED_ASSUMPTIONS.extraBuyingCostPct),
		monthlyOwnerCost: String(DEFAULT_ADVANCED_ASSUMPTIONS.monthlyOwnerCost),
		rentSetupCost: String(DEFAULT_ADVANCED_ASSUMPTIONS.rentSetupCost),
		rentIncreasePct: String(DEFAULT_ADVANCED_ASSUMPTIONS.rentIncreasePct),
		propertyAppreciationPct: String(
			DEFAULT_ADVANCED_ASSUMPTIONS.propertyAppreciationPct,
		),
		investmentReturnPct: String(
			DEFAULT_ADVANCED_ASSUMPTIONS.investmentReturnPct,
		),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isMarketType(value: unknown): value is MarketType {
	return (
		value === "metro" || value === "large-city" || value === "smaller-city"
	);
}

function isBuyVsRentDraft(value: unknown): value is BuyVsRentDraft {
	if (!isRecord(value)) return false;

	return (
		typeof value.propertyPriceLakhs === "string" &&
		typeof value.monthlyRent === "string" &&
		typeof value.stayYears === "string" &&
		typeof value.monthlyTakeHome === "string" &&
		typeof value.availableCashLakhs === "string" &&
		isMarketType(value.marketType) &&
		typeof value.loanRatePct === "string" &&
		typeof value.loanTenureYears === "string" &&
		typeof value.extraBuyingCostPct === "string" &&
		typeof value.monthlyOwnerCost === "string" &&
		typeof value.rentSetupCost === "string" &&
		typeof value.rentIncreasePct === "string" &&
		typeof value.propertyAppreciationPct === "string" &&
		typeof value.investmentReturnPct === "string"
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
			typeof parsed.advancedOpen !== "boolean" ||
			typeof parsed.detailsOpen !== "boolean"
		) {
			return null;
		}

		return {
			draft: parsed.draft,
			advancedOpen: parsed.advancedOpen,
			detailsOpen: parsed.detailsOpen,
			customGrowthOpen:
				typeof parsed.customGrowthOpen === "boolean"
					? parsed.customGrowthOpen
					: typeof parsed.customReturnOpen === "boolean"
						? parsed.customReturnOpen
						: false,
		} satisfies PersistedBuyVsRentState;
	} catch {
		return null;
	}
}

export function saveStoredState(value: PersistedBuyVsRentState) {
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
