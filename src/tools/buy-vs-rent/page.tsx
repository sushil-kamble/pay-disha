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
	BUY_VS_RENT_LIMITS,
	DEFAULT_BUY_VS_RENT_INPUTS,
} from "#/tools/buy-vs-rent/constants";
import {
	type BuyVsRentDraft,
	type BuyVsRentDraftFieldKey,
	createDraft,
	loadStoredState,
	parseNumber,
	saveStoredState,
} from "#/tools/buy-vs-rent/page-state";

export function BuyVsRentPage() {
	const [draft, setDraft] = useState<BuyVsRentDraft>(() => createDraft());
	const [taxOpen, setTaxOpen] = useState(false);
	const [showRealView, setShowRealView] = useState(false);
	const [storageReady, setStorageReady] = useState(false);
	const [loadedFromStorage, setLoadedFromStorage] = useState(false);

	useEffect(() => {
		const stored = loadStoredState();
		if (stored) {
			setDraft(stored.draft);
			setTaxOpen(stored.taxOpen);
			setShowRealView(stored.showRealView);
			setLoadedFromStorage(true);
		}

		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredState({
			draft,
			taxOpen,
			showRealView,
		});
	}, [draft, showRealView, storageReady, taxOpen]);

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
					DEFAULT_BUY_VS_RENT_INPUTS.propertyPriceLakhs,
				),
				monthlyRent: parseNumber(
					draft.monthlyRent,
					DEFAULT_BUY_VS_RENT_INPUTS.monthlyRent,
				),
				stayYears: parseNumber(
					draft.stayYears,
					DEFAULT_BUY_VS_RENT_INPUTS.stayYears,
				),
				downPaymentLakhs: parseNumber(
					draft.downPaymentLakhs,
					DEFAULT_BUY_VS_RENT_INPUTS.downPaymentLakhs,
				),
				homeLoanRatePct: parseNumber(
					draft.homeLoanRatePct,
					DEFAULT_BUY_VS_RENT_INPUTS.homeLoanRatePct,
				),
				loanTenureYears: parseNumber(
					draft.loanTenureYears,
					DEFAULT_BUY_VS_RENT_INPUTS.loanTenureYears,
				),
				annualCtcLakhs: parseNumber(
					draft.annualCtcLakhs,
					DEFAULT_BUY_VS_RENT_INPUTS.annualCtcLakhs,
				),
				cityTier: draft.cityTier,
				ageYears: parseNumber(
					draft.ageYears,
					DEFAULT_BUY_VS_RENT_INPUTS.ageYears,
				),
				salaryGrowthPct: parseNumber(
					draft.salaryGrowthPct,
					DEFAULT_BUY_VS_RENT_INPUTS.salaryGrowthPct,
				),
			}),
		[draft],
	);

	const propertyPriceRupees = result.inputs.propertyPriceLakhs * 100000;
	const downPaymentValue = result.inputs.downPaymentLakhs * 100000;
	const maxDownPaymentLakhs = Math.min(
		result.inputs.propertyPriceLakhs,
		BUY_VS_RENT_LIMITS.maxDownPaymentLakhs,
	);
	const downPaymentShare =
		propertyPriceRupees > 0
			? (downPaymentValue / propertyPriceRupees) * 100
			: 0;

	function resetDefaults() {
		setDraft(createDraft());
		setTaxOpen(false);
		setShowRealView(false);
		setLoadedFromStorage(false);
	}

	return (
		<ToolPageShell
			title="Buy vs Rent"
			description="A private decision engine for salaried India: see whether buying or renting leaves you stronger, why the result leans that way, and when the other choice starts making sense."
			tag={
				<Badge
					variant="secondary"
					className="rounded-full px-3 py-1 text-xs font-semibold"
				>
					All calculations stay in your browser
				</Badge>
			}
			className="rise-in mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
		>
			<div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-8">
				<div className="min-w-0 self-start lg:sticky lg:top-20">
					{!storageReady ? (
						<ConfigPanelLoadingFallback />
					) : (
						<ConfigPanel
							draft={draft}
							taxOpen={taxOpen}
							setTaxOpen={setTaxOpen}
							loadedFromStorage={loadedFromStorage}
							propertyPriceRupees={propertyPriceRupees}
							downPaymentValue={downPaymentValue}
							downPaymentShare={downPaymentShare}
							maxDownPaymentLakhs={maxDownPaymentLakhs}
							onFieldChange={setField}
							onCityTierChange={(value) =>
								setDraft((current) => ({
									...current,
									cityTier: value,
								}))
							}
							onReset={resetDefaults}
						/>
					)}
				</div>

				{!storageReady ? (
					<ResultsColumnLoadingFallback />
				) : (
					<ResultsColumn
						result={result}
						showRealView={showRealView}
						setShowRealView={setShowRealView}
					/>
				)}
			</div>
		</ToolPageShell>
	);
}
