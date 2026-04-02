import { JOB_OFFER_COMPARATOR_STORAGE_KEY } from "./constants";
import type {
	CompareConfig,
	OfferInput,
	PersistedJobOfferComparatorState,
} from "./types";

function parseStoredJson(rawValue: string | null) {
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isOfferArray(value: unknown): value is OfferInput[] {
	if (!Array.isArray(value)) return false;

	return value.every(
		(entry) => isRecord(entry) && typeof entry.id === "string",
	);
}

function isCompareConfig(value: unknown): value is CompareConfig {
	if (!isRecord(value)) return false;

	return (
		(value.scenario === "conservative" ||
			value.scenario === "expected" ||
			value.scenario === "upside") &&
		typeof value.includeQualitativeFit === "boolean" &&
		typeof value.financeWeightPct === "number" &&
		typeof value.fitWeightPct === "number" &&
		typeof value.showCurrentBaseline === "boolean"
	);
}

export function loadStoredJobOfferComparatorState(): PersistedJobOfferComparatorState | null {
	const parsed = parseStoredJson(
		window.localStorage.getItem(JOB_OFFER_COMPARATOR_STORAGE_KEY),
	);

	if (!isRecord(parsed)) return null;
	if (!isOfferArray(parsed.offers)) return null;
	if (!isCompareConfig(parsed.config)) return null;

	const baseline = parsed.baselineOffer;
	if (baseline !== null && !isRecord(baseline)) return null;

	const advancedOpenByOfferId = isRecord(parsed.advancedOpenByOfferId)
		? (parsed.advancedOpenByOfferId as Record<string, boolean>)
		: {};

	return {
		offers: parsed.offers,
		config: parsed.config,
		baselineOffer: baseline as OfferInput | null,
		advancedOpenByOfferId,
	};
}

export function saveStoredJobOfferComparatorState(
	value: PersistedJobOfferComparatorState,
) {
	try {
		window.localStorage.setItem(
			JOB_OFFER_COMPARATOR_STORAGE_KEY,
			JSON.stringify(value),
		);
	} catch {
		// Ignore local storage write failures.
	}
}
