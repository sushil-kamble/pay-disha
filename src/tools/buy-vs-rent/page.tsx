import { useEffect, useMemo, useState } from "react";

import { ToolPageShell } from "#/components/common";
import { Badge } from "#/components/ui/badge";
import { calculateBuyVsRent } from "#/tools/buy-vs-rent/calculator";
import {
	ConfigPanel,
	ConfigPanelLoadingFallback,
} from "#/tools/buy-vs-rent/components/config-panel";
import {
	ResultsColumn,
	ResultsColumnLoadingFallback,
} from "#/tools/buy-vs-rent/components/results-column";
import {
	DEFAULT_ADVANCED_ASSUMPTIONS,
	DEFAULT_QUICK_INPUTS,
	MARKET_DEFAULTS,
} from "#/tools/buy-vs-rent/constants";
import {
	type BuyVsRentDraft,
	type BuyVsRentDraftFieldKey,
	createDraft,
	loadStoredState,
	parseNumber,
	saveStoredState,
} from "#/tools/buy-vs-rent/page-state";
import type { MarketType } from "#/tools/buy-vs-rent/types";

function getMarketDefaultsForDraft(
	marketType: MarketType,
	draft: BuyVsRentDraft,
) {
	const marketDefaults = MARKET_DEFAULTS[marketType];
	const propertyPrice =
		parseNumber(
			draft.propertyPriceLakhs,
			DEFAULT_QUICK_INPUTS.propertyPriceLakhs,
		) * 100000;
	const monthlyRent = parseNumber(
		draft.monthlyRent,
		DEFAULT_QUICK_INPUTS.monthlyRent,
	);

	return {
		extraBuyingCostPct: String(marketDefaults.extraBuyingCostPct),
		monthlyOwnerCost: String(
			Math.round(
				(propertyPrice * (marketDefaults.ownerCostAnnualPct / 100)) / 12,
			),
		),
		rentSetupCost: String(
			Math.round(monthlyRent * marketDefaults.rentSetupMonths),
		),
		rentIncreasePct: String(marketDefaults.rentIncreasePct),
		propertyAppreciationPct: String(marketDefaults.propertyAppreciationPct),
	};
}

export function BuyVsRentPage() {
	const [draft, setDraft] = useState<BuyVsRentDraft>(() => createDraft());
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [customGrowthOpen, setCustomGrowthOpen] = useState(false);
	const [storageReady, setStorageReady] = useState(false);
	const [loadedFromStorage, setLoadedFromStorage] = useState(false);

	useEffect(() => {
		const stored = loadStoredState();
		if (stored) {
			setDraft(stored.draft);
			setAdvancedOpen(stored.advancedOpen);
			setDetailsOpen(stored.detailsOpen);
			setCustomGrowthOpen(stored.customGrowthOpen);
			setLoadedFromStorage(true);
		}

		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredState({
			draft,
			advancedOpen,
			detailsOpen,
			customGrowthOpen,
		});
	}, [advancedOpen, customGrowthOpen, detailsOpen, draft, storageReady]);

	const setField = (key: BuyVsRentDraftFieldKey, value: string) => {
		setDraft((current) => ({
			...current,
			[key]: value,
		}));
	};

	const result = useMemo(
		() =>
			calculateBuyVsRent({
				propertyPriceLakhs: parseNumber(
					draft.propertyPriceLakhs,
					DEFAULT_QUICK_INPUTS.propertyPriceLakhs,
				),
				monthlyRent: parseNumber(
					draft.monthlyRent,
					DEFAULT_QUICK_INPUTS.monthlyRent,
				),
				stayYears: parseNumber(draft.stayYears, DEFAULT_QUICK_INPUTS.stayYears),
				monthlyTakeHome: parseNumber(
					draft.monthlyTakeHome,
					DEFAULT_QUICK_INPUTS.monthlyTakeHome,
				),
				availableCashLakhs: parseNumber(
					draft.availableCashLakhs,
					DEFAULT_QUICK_INPUTS.availableCashLakhs,
				),
				marketType: draft.marketType,
				loanRatePct: parseNumber(
					draft.loanRatePct,
					DEFAULT_ADVANCED_ASSUMPTIONS.loanRatePct,
				),
				loanTenureYears: parseNumber(
					draft.loanTenureYears,
					DEFAULT_ADVANCED_ASSUMPTIONS.loanTenureYears,
				),
				extraBuyingCostPct: parseNumber(
					draft.extraBuyingCostPct,
					DEFAULT_ADVANCED_ASSUMPTIONS.extraBuyingCostPct,
				),
				monthlyOwnerCost: parseNumber(
					draft.monthlyOwnerCost,
					DEFAULT_ADVANCED_ASSUMPTIONS.monthlyOwnerCost,
				),
				rentSetupCost: parseNumber(
					draft.rentSetupCost,
					DEFAULT_ADVANCED_ASSUMPTIONS.rentSetupCost,
				),
				rentIncreasePct: parseNumber(
					draft.rentIncreasePct,
					DEFAULT_ADVANCED_ASSUMPTIONS.rentIncreasePct,
				),
				propertyAppreciationPct: parseNumber(
					draft.propertyAppreciationPct,
					DEFAULT_ADVANCED_ASSUMPTIONS.propertyAppreciationPct,
				),
				investmentReturnPct: parseNumber(
					draft.investmentReturnPct,
					DEFAULT_ADVANCED_ASSUMPTIONS.investmentReturnPct,
				),
			}),
		[draft],
	);

	const propertyPriceRupees = result.inputs.propertyPriceLakhs * 100000;
	const availableCashRupees = result.inputs.availableCashLakhs * 100000;
	const estimatedExtraBuyingCosts =
		propertyPriceRupees * (result.inputs.extraBuyingCostPct / 100);

	function resetDefaults() {
		setDraft(createDraft());
		setAdvancedOpen(false);
		setDetailsOpen(false);
		setCustomGrowthOpen(false);
		setLoadedFromStorage(false);
	}

	function setMarketType(value: MarketType) {
		setDraft((current) => ({
			...current,
			marketType: value,
			...getMarketDefaultsForDraft(value, current),
		}));
	}

	return (
		<ToolPageShell
			title="Buy vs Rent"
			description="A simple decision tool for salaried India: compare one real home against renting a similar place, with strong defaults and no tax-form gymnastics."
			tag={
				<Badge
					variant="secondary"
					className="rounded-full px-3 py-1 text-xs font-semibold"
				>
					Private browser-only estimate
				</Badge>
			}
			className="rise-in mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
		>
			<div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-8">
				<div className="min-w-0 self-start">
					{!storageReady ? (
						<ConfigPanelLoadingFallback />
					) : (
						<ConfigPanel
							draft={draft}
							advancedOpen={advancedOpen}
							setAdvancedOpen={setAdvancedOpen}
							customGrowthOpen={customGrowthOpen}
							setCustomGrowthOpen={setCustomGrowthOpen}
							loadedFromStorage={loadedFromStorage}
							propertyPriceRupees={propertyPriceRupees}
							availableCashRupees={availableCashRupees}
							estimatedExtraBuyingCosts={estimatedExtraBuyingCosts}
							onFieldChange={setField}
							onMarketTypeChange={setMarketType}
							onReset={resetDefaults}
						/>
					)}
				</div>

				{!storageReady ? (
					<ResultsColumnLoadingFallback />
				) : (
					<ResultsColumn
						result={result}
						detailsOpen={detailsOpen}
						setDetailsOpen={setDetailsOpen}
					/>
				)}
			</div>
		</ToolPageShell>
	);
}
