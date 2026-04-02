import { Link } from "@tanstack/react-router";
import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteNav } from "#/components/home";
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

function toNumber(value: string) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
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
		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredJobOfferComparatorState({
			offers,
			config,
			baselineOffer,
			advancedOpenByOfferId,
		});
	}, [offers, config, baselineOffer, advancedOpenByOfferId, storageReady]);

	const comparedOffers = useMemo(() => {
		if (config.showCurrentBaseline && baselineOffer) {
			return [baselineOffer, ...offers];
		}
		return offers;
	}, [config.showCurrentBaseline, baselineOffer, offers]);

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

			const template = applyEmployerPreset(
				{
					...prev[prev.length - 1],
					id: createOfferId(),
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
	};

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<SiteNav />
			<main className="page-wrap pb-20 pt-8">
				<div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<Link
							to="/"
							className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Back to Tools
						</Link>
						<h1 className="display-title text-4xl font-bold leading-tight text-foreground md:text-5xl">
							Job Offer Comparator
						</h1>
						<p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
							Compare job offers the way your real life sees them: monthly
							in-hand, 36-month value, risk, benefits, and fit.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className="rounded-full px-3 py-1 text-xs"
						>
							{SCENARIO_LABELS[config.scenario]} mode
						</Badge>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
					<div className="space-y-4 lg:sticky lg:top-20">
						<QuickCompareForm
							offers={offers}
							config={config}
							advancedOpenByOfferId={advancedOpenByOfferId}
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
																fixedAnnualCash: toNumber(event.target.value),
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
																variableAnnualTarget: toNumber(
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

								<div className="rounded-xl border border-border bg-card p-3">
									<p className="mb-2 text-sm font-semibold text-foreground">
										Why this ranking
									</p>
									<ul className="space-y-1.5 text-sm text-muted-foreground">
										{result.narrative.map((line) => (
											<li key={line} className="leading-relaxed">
												• {line}
											</li>
										))}
									</ul>
								</div>

								<div className="overflow-x-auto pb-1">
									<div className="flex min-w-max gap-3 pr-1">
										{result.offers.map((offer) => (
											<div
												key={offer.offer.id}
												className="w-72 shrink-0 rounded-xl border border-border bg-card p-3"
											>
												<div className="mb-2 flex items-center justify-between gap-2">
													<p className="text-sm font-semibold text-foreground">
														{offer.offer.label}
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
									Enter fixed cash, variable pay, joining bonus, and equity to
									get a decision-ready view across cash now and long-term value.
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
					<p className="inline-flex items-center gap-1 font-semibold">
						<ShieldCheck className="h-3.5 w-3.5" />
						Data privacy reminder
					</p>
					<p className="mt-1">
						This comparison runs entirely in your browser. Offer details are
						kept in local storage on your device only.
					</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
