import { AlignLeft, BriefcaseBusiness, Lightbulb } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolPageShell } from "#/components/common";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { compareOffers } from "./calculator";
import { ComparisonChart } from "./components/comparison-chart";
import { FitSummary } from "./components/fit-summary";
import { OfferBreakdownTable } from "./components/offer-breakdown-table";
import { QuickCompareForm } from "./components/quick-compare-form";
import { ResultsMetricCards } from "./components/results-metric-cards";
import { VerdictHeader } from "./components/verdict-header";
import {
	DEFAULT_COMPARE_CONFIG,
	MAX_OFFERS,
	SCENARIO_LABELS,
} from "./constants";
import { formatCompactCurrency } from "./format";
import { parseNumberInput } from "./input";
import {
	applyEmployerPreset,
	createDefaultBaselineOffer,
	createDefaultOffers,
} from "./presets";
import {
	loadStoredJobOfferComparatorState,
	saveStoredJobOfferComparatorState,
} from "./storage";
import type {
	BenefitKey,
	CompareConfig,
	OfferInput,
	QualitativeInputs,
} from "./types";

function createOfferId() {
	return `offer-${Math.random().toString(36).slice(2, 8)}`;
}

function nextOfferLabel(offers: OfferInput[]) {
	const index = Math.max(0, Math.min(25, offers.length));
	const next = String.fromCharCode(65 + index);
	return `Offer ${next}`;
}

export function buildComparedOffers(
	offers: OfferInput[],
	showCurrentBaseline: boolean,
	baselineOffer: OfferInput | null,
) {
	if (showCurrentBaseline && baselineOffer) {
		return [baselineOffer, ...offers];
	}

	return offers;
}

export function JobOfferComparatorPage() {
	const [offers, setOffers] = useState<OfferInput[]>(createDefaultOffers());
	const [config, setConfig] = useState<CompareConfig>(DEFAULT_COMPARE_CONFIG);
	const [baselineOffer, setBaselineOffer] = useState<OfferInput | null>(
		createDefaultBaselineOffer(),
	);
	const [advancedOpenByOfferId, setAdvancedOpenByOfferId] = useState<
		Record<string, boolean>
	>({});
	const [offerOpenByOfferId, setOfferOpenByOfferId] = useState<
		Record<string, boolean>
	>({});
	const [storageReady, setStorageReady] = useState(false);

	useEffect(() => {
		const stored = loadStoredJobOfferComparatorState();
		if (!stored) {
			setStorageReady(true);
			return;
		}

		setOffers(stored.offers.slice(0, MAX_OFFERS));
		setConfig(stored.config);
		setBaselineOffer(stored.baselineOffer);
		setAdvancedOpenByOfferId(stored.advancedOpenByOfferId);
		setOfferOpenByOfferId(stored.offerOpenByOfferId);
		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredJobOfferComparatorState({
			offers,
			config,
			baselineOffer,
			advancedOpenByOfferId,
			offerOpenByOfferId,
		});
	}, [
		offers,
		config,
		baselineOffer,
		advancedOpenByOfferId,
		offerOpenByOfferId,
		storageReady,
	]);

	const comparedOffers = useMemo(
		() =>
			buildComparedOffers(offers, config.showCurrentBaseline, baselineOffer),
		[config.showCurrentBaseline, baselineOffer, offers],
	);

	const result = useMemo(() => {
		if (comparedOffers.length < 2) return null;
		return compareOffers(comparedOffers, config);
	}, [comparedOffers, config]);

	const setConfigField = <K extends keyof CompareConfig>(
		key: K,
		value: CompareConfig[K],
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	const updateOfferField = <K extends keyof OfferInput>(
		offerId: string,
		key: K,
		value: OfferInput[K],
	) => {
		setOffers((prev) =>
			prev.map((offer) =>
				offer.id === offerId ? { ...offer, [key]: value } : offer,
			),
		);
	};

	const updateOfferBenefit = (
		offerId: string,
		key: BenefitKey,
		patch: { enabled?: boolean; monthlyValue?: number },
	) => {
		setOffers((prev) =>
			prev.map((offer) => {
				if (offer.id !== offerId) return offer;
				return {
					...offer,
					benefits: {
						...offer.benefits,
						[key]: {
							...offer.benefits[key],
							...patch,
						},
					},
				};
			}),
		);
	};

	const updateOfferQualitative = <K extends keyof QualitativeInputs>(
		offerId: string,
		key: K,
		value: QualitativeInputs[K],
	) => {
		setOffers((prev) =>
			prev.map((offer) => {
				if (offer.id !== offerId) return offer;
				return {
					...offer,
					qualitative: {
						...offer.qualitative,
						[key]: value,
					},
				};
			}),
		);
	};

	const addOffer = () => {
		setOffers((prev) => {
			if (prev.length >= MAX_OFFERS) return prev;

			const newId = createOfferId();
			const template = applyEmployerPreset(
				{
					...prev[prev.length - 1],
					id: newId,
					label: nextOfferLabel(prev),
					companyName: "New shortlist",
					joiningBonus: 0,
					retentionBonus: 0,
					relocationSupportOneTime: 0,
					noticeBuyoutRisk: 0,
					clawbackRisk: 0,
				},
				prev[prev.length - 1]?.employerType ?? "mnc",
			);

			// New offer defaults to expanded
			setOfferOpenByOfferId((openState) => ({ ...openState, [newId]: true }));

			return [...prev, template];
		});
	};

	const duplicateOffer = (offerId: string) => {
		setOffers((prev) => {
			if (prev.length >= MAX_OFFERS) return prev;
			const source = prev.find((offer) => offer.id === offerId);
			if (!source) return prev;

			const duplicate: OfferInput = {
				...source,
				id: createOfferId(),
				label: nextOfferLabel(prev),
				companyName: `${source.companyName} copy`,
			};

			return [...prev, duplicate];
		});
	};

	const deleteOffer = (offerId: string) => {
		setOffers((prev) => {
			if (prev.length <= 2) return prev;
			return prev.filter((offer) => offer.id !== offerId);
		});
	};

	const resetTool = () => {
		setOffers(createDefaultOffers());
		setConfig(DEFAULT_COMPARE_CONFIG);
		setBaselineOffer(createDefaultBaselineOffer());
		setAdvancedOpenByOfferId({});
		setOfferOpenByOfferId({});
	};

	return (
		<ToolPageShell
			title="Job Offer Comparator"
			description="Compare job offers the way your real life sees them: monthly in-hand, 36-month value, risk, benefits, and fit."
			tag={
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
						{SCENARIO_LABELS[config.scenario]} mode
					</Badge>
				</div>
			}
			className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
			descriptionClassName="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground"
		>
			<div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
				<div className="space-y-4">
					<QuickCompareForm
						offers={offers}
						config={config}
						advancedOpenByOfferId={advancedOpenByOfferId}
						offerOpenByOfferId={offerOpenByOfferId}
						onConfigChange={setConfigField}
						onOfferFieldChange={updateOfferField}
						onOfferBenefitChange={updateOfferBenefit}
						onOfferQualitativeChange={updateOfferQualitative}
						onOfferDuplicate={duplicateOffer}
						onOfferDelete={deleteOffer}
						onAdvancedOpenChange={(offerId, open) =>
							setAdvancedOpenByOfferId((prev) => ({
								...prev,
								[offerId]: open,
							}))
						}
						onOfferOpenChange={(offerId, open) =>
							setOfferOpenByOfferId((prev) => ({
								...prev,
								[offerId]: open,
							}))
						}
						onAddOffer={addOffer}
						onReset={resetTool}
						canAddOffer={offers.length < MAX_OFFERS}
					/>

					<div className="rounded-xl border border-border bg-card p-3">
						<div className="flex items-center justify-between gap-2">
							<div>
								<p className="text-sm font-semibold text-foreground">
									Include current role baseline
								</p>
								<p className="text-xs text-muted-foreground">
									See effective hike versus staying put.
								</p>
							</div>
							<Switch
								checked={config.showCurrentBaseline}
								onCheckedChange={(checked) =>
									setConfigField("showCurrentBaseline", checked)
								}
							/>
						</div>

						{config.showCurrentBaseline && baselineOffer ? (
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								<div className="space-y-1.5">
									<Label className="text-xs">Current fixed annual cash</Label>
									<Input
										type="number"
										value={baselineOffer.fixedAnnualCash}
										onChange={(event) =>
											setBaselineOffer((prev) =>
												prev
													? {
															...prev,
															fixedAnnualCash: parseNumberInput(
																event.target.value,
															),
														}
													: prev,
											)
										}
									/>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs">Current variable target</Label>
									<Input
										type="number"
										value={baselineOffer.variableAnnualTarget}
										onChange={(event) =>
											setBaselineOffer((prev) =>
												prev
													? {
															...prev,
															variableAnnualTarget: parseNumberInput(
																event.target.value,
															),
														}
													: prev,
											)
										}
									/>
								</div>
							</div>
						) : null}
					</div>
				</div>

				<div className="min-w-0 space-y-4">
					{result ? (
						<>
							<VerdictHeader result={result} />
							<ResultsMetricCards offers={result.offers} />
							<ComparisonChart result={result} />
							<FitSummary
								offers={result.offers}
								includeFit={config.includeQualitativeFit}
							/>
							<div className="rounded-2xl border border-border bg-card p-4">
								<div className="mb-3 flex items-center gap-2">
									<AlignLeft className="h-4 w-4 text-primary" />
									<p className="text-sm font-semibold text-foreground">
										Why this ranking
									</p>
								</div>
								<ul className="space-y-1.5 text-sm text-muted-foreground">
									{result.narrative.map((line) => (
										<li key={line} className="leading-relaxed">
											• {line}
										</li>
									))}
								</ul>
							</div>
							<div className="rounded-2xl border border-border bg-card p-4">
								<div className="mb-3 flex items-center gap-2">
									<Lightbulb className="h-4 w-4 text-primary" />
									<p className="text-sm font-semibold text-foreground">
										Offer insights
									</p>
								</div>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									{result.offers.map((offer) => (
										<div
											key={offer.offer.id}
											className="rounded-xl border border-border bg-background p-3"
										>
											<div className="mb-2 flex items-center justify-between gap-2">
												<p className="text-sm font-semibold text-foreground">
													{offer.offer.companyName || "Unnamed offer"}
												</p>
												<Badge variant="outline" className="text-[10px]">
													{formatCompactCurrency(offer.monthlyTakeHome)}/mo
												</Badge>
											</div>
											<ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
												{offer.insights.map((insight) => (
													<li key={insight}>• {insight}</li>
												))}
											</ul>
										</div>
									))}
								</div>
							</div>
							<OfferBreakdownTable offers={result.offers} />
						</>
					) : (
						<div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
							<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<BriefcaseBusiness className="h-6 w-6" />
							</div>
							<p className="text-base font-semibold text-foreground">
								Add at least 2 offers to compare.
							</p>
							<p className="max-w-md text-sm text-muted-foreground">
								Enter fixed cash, variable pay, joining bonus, and equity to get
								a decision-ready view across cash now and long-term value.
							</p>
						</div>
					)}
				</div>
			</div>
		</ToolPageShell>
	);
}
