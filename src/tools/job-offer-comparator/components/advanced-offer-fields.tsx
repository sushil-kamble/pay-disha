import { Info } from "lucide-react";
import { useState } from "react";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { BENEFIT_LABELS, QUALITATIVE_LABELS } from "../constants";
import { parseIntegerInput, parseNumberInput } from "../input";
import { archetypeDefaults } from "../presets";
import type {
	BenefitKey,
	OfferInput,
	QualitativeInputs,
	TaxRegime,
} from "../types";

// Month 4 (April) is the most common Indian increment cycle.
const DEFAULT_NEXT_INCREMENT_MONTH = 4;

type GrowthDraftKey =
	| "expectedAnnualIncrementPct"
	| "nextIncrementMonth"
	| "expectedPromotionMonths"
	| "promotionUpliftPct";

function makeDrafts(offer: OfferInput) {
	return {
		expectedAnnualIncrementPct:
			offer.expectedAnnualIncrementPct > 0
				? String(offer.expectedAnnualIncrementPct)
				: "",
		nextIncrementMonth:
			offer.nextIncrementMonth > 0 ? String(offer.nextIncrementMonth) : "",
		expectedPromotionMonths:
			offer.expectedPromotionMonths > 0
				? String(offer.expectedPromotionMonths)
				: "",
		promotionUpliftPct:
			offer.promotionUpliftPct > 0 ? String(offer.promotionUpliftPct) : "",
	};
}

interface AdvancedOfferFieldsProps {
	offer: OfferInput;
	onOfferFieldChange: <K extends keyof OfferInput>(
		key: K,
		value: OfferInput[K],
	) => void;
	onBenefitChange: (
		key: BenefitKey,
		patch: { enabled?: boolean; monthlyValue?: number },
	) => void;
	onQualitativeChange: <K extends keyof QualitativeInputs>(
		key: K,
		value: QualitativeInputs[K],
	) => void;
}

export function AdvancedOfferFields({
	offer,
	onOfferFieldChange,
	onBenefitChange,
	onQualitativeChange,
}: AdvancedOfferFieldsProps) {
	const [drafts, setDrafts] = useState(() => makeDrafts(offer));

	// Sync draft strings when the offer identity or employer type changes
	// (e.g. switching offers, or applying an employer preset). This uses React's
	// "derived state during render" pattern — safe and avoids extra effects.
	const [prevSyncKey, setPrevSyncKey] = useState(
		`${offer.id}:${offer.employerType}`,
	);
	const syncKey = `${offer.id}:${offer.employerType}`;
	if (prevSyncKey !== syncKey) {
		setPrevSyncKey(syncKey);
		setDrafts(makeDrafts(offer));
	}

	const defaults = archetypeDefaults[offer.employerType];
	const fieldDefaults: Record<GrowthDraftKey, number> = {
		expectedAnnualIncrementPct: defaults.expectedAnnualIncrementPct,
		nextIncrementMonth: DEFAULT_NEXT_INCREMENT_MONTH,
		expectedPromotionMonths: defaults.expectedPromotionMonths,
		promotionUpliftPct: defaults.promotionUpliftPct,
	};

	function handleGrowthChange(
		key: GrowthDraftKey,
		raw: string,
		isInteger: boolean,
	) {
		setDrafts((prev) => ({ ...prev, [key]: raw }));
		const parsed = isInteger ? parseIntegerInput(raw) : parseNumberInput(raw);
		if (raw.trim() === "" || parsed <= 0) {
			// Empty or zero → fall back to the archetype default silently.
			onOfferFieldChange(key, fieldDefaults[key]);
		} else {
			onOfferFieldChange(key, parsed);
		}
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-2 sm:items-end">
				<div className="space-y-2 sm:col-span-2">
					<div className="flex items-center gap-1">
						<Label htmlFor={`${offer.id}-expenses-monthly`} className="text-xs">
							Expenses
						</Label>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<Info className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-72 text-pretty text-xs leading-relaxed">
								<p>
									This is your estimated monthly cost of taking this role. It is
									subtracted from effective value after tax and benefits.
								</p>
								<p className="mt-1 opacity-75">
									If this is in a different city, include the higher cost of
									living for that city. If travel is needed, include
									transport/commute.
								</p>
								<p className="mt-1 opacity-75">
									Add any recurring financial change caused by choosing this
									offer, including lifestyle-linked costs.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<Input
						id={`${offer.id}-expenses-monthly`}
						type="number"
						placeholder="e.g. 15000 per month"
						value={offer.expensesMonthly}
						onChange={(event) =>
							onOfferFieldChange(
								"expensesMonthly",
								parseNumberInput(event.target.value),
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${offer.id}-tax-regime`} className="text-xs">
						Tax Regime
					</Label>
					<select
						id={`${offer.id}-tax-regime`}
						value={offer.taxRegime}
						onChange={(event) =>
							onOfferFieldChange("taxRegime", event.target.value as TaxRegime)
						}
						className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
					>
						<option value="new">New Regime</option>
						<option value="old">Old Regime</option>
					</select>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${offer.id}-pf`} className="text-xs">
						Employee PF / month
					</Label>
					<Input
						id={`${offer.id}-pf`}
						type="number"
						value={offer.pfMonthly}
						onChange={(event) =>
							onOfferFieldChange(
								"pfMonthly",
								parseNumberInput(event.target.value),
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-1">
						<Label htmlFor={`${offer.id}-increment`} className="text-xs">
							Expected annual increment (%)
						</Label>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<Info className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-72 text-pretty text-xs leading-relaxed">
								<p>
									The percentage by which your fixed salary grows each year.
								</p>
								<p className="mt-1 opacity-75">
									Example: fixed is ₹10L, increment is 12% → next year's fixed
									becomes ₹11.2L. Startups typically give 15–20%, MNCs 8–12%.
								</p>
								<p className="mt-1 opacity-75">
									Not sure? Leave blank — the default for your employer type (
									{fieldDefaults.expectedAnnualIncrementPct}%) will be used.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<Input
						id={`${offer.id}-increment`}
						type="number"
						value={drafts.expectedAnnualIncrementPct}
						placeholder={String(fieldDefaults.expectedAnnualIncrementPct)}
						onChange={(event) =>
							handleGrowthChange(
								"expectedAnnualIncrementPct",
								event.target.value,
								false,
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-1">
						<Label htmlFor={`${offer.id}-next-increment`} className="text-xs">
							Next increment month (1-12)
						</Label>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<Info className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-72 text-pretty text-xs leading-relaxed">
								<p>
									The calendar month your next salary revision is due (1 = Jan,
									4 = Apr, 10 = Oct).
								</p>
								<p className="mt-1 opacity-75">
									Example: if your increment happens in April, enter 4. The
									calculator prorates the raise — joining in October with an
									April increment means you get only 6 months of the higher
									salary in year 1.
								</p>
								<p className="mt-1 opacity-75">
									Not sure? Leave blank — month{" "}
									{fieldDefaults.nextIncrementMonth} (April) will be used.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<Input
						id={`${offer.id}-next-increment`}
						type="number"
						min={1}
						max={12}
						value={drafts.nextIncrementMonth}
						placeholder={String(fieldDefaults.nextIncrementMonth)}
						onChange={(event) =>
							handleGrowthChange("nextIncrementMonth", event.target.value, true)
						}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-1">
						<Label htmlFor={`${offer.id}-promotion-months`} className="text-xs">
							Expected promotion in (months)
						</Label>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<Info className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-72 text-pretty text-xs leading-relaxed">
								<p>
									How many months from today you expect your next promotion.
								</p>
								<p className="mt-1 opacity-75">
									Example: enter 12 for a promotion in ~1 year, 24 for 2 years.
									The promotion uplift is applied from that year's salary
									onwards in the 3-year projection.
								</p>
								<p className="mt-1 opacity-75">
									Not sure? Leave blank —{" "}
									{fieldDefaults.expectedPromotionMonths} months will be used.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<Input
						id={`${offer.id}-promotion-months`}
						type="number"
						value={drafts.expectedPromotionMonths}
						placeholder={String(fieldDefaults.expectedPromotionMonths)}
						onChange={(event) =>
							handleGrowthChange(
								"expectedPromotionMonths",
								event.target.value,
								true,
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-1">
						<Label htmlFor={`${offer.id}-promotion-uplift`} className="text-xs">
							Promotion uplift (%)
						</Label>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<Info className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-72 text-pretty text-xs leading-relaxed">
								<p>
									The extra salary jump (%) you receive at the time of
									promotion, on top of your regular annual increment.
								</p>
								<p className="mt-1 opacity-75">
									Example: if your fixed is ₹12L after the increment and the
									promotion uplift is 15%, your post-promotion fixed becomes
									₹13.8L. Typical range: 10–25%.
								</p>
								<p className="mt-1 opacity-75">
									Not sure? Leave blank — {fieldDefaults.promotionUpliftPct}%
									will be used.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
					<Input
						id={`${offer.id}-promotion-uplift`}
						type="number"
						value={drafts.promotionUpliftPct}
						placeholder={String(fieldDefaults.promotionUpliftPct)}
						onChange={(event) =>
							handleGrowthChange(
								"promotionUpliftPct",
								event.target.value,
								false,
							)
						}
					/>
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				<div className="flex items-center gap-1.5">
					<p className="text-xs font-semibold text-muted-foreground">
						Benefits you value
					</p>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								<Info className="h-3.5 w-3.5" />
							</button>
						</TooltipTrigger>
						<TooltipContent className="max-w-72 text-pretty text-xs leading-relaxed">
							<p>
								Enable only benefits that genuinely matter to you. Each value is
								the monthly rupee worth of that benefit.
							</p>
							<p className="mt-1 opacity-75">
								Example: if the employer pays ₹1,400/month towards your health
								insurance premium, enter 1400. These are added to your effective
								annual value.
							</p>
						</TooltipContent>
					</Tooltip>
				</div>
				<p className="text-[11px] text-muted-foreground">
					Values are in <span className="font-semibold">₹ per month</span>.
					Enter the monthly rupee worth of each benefit, not the total cover
					amount.
				</p>

				<div className="space-y-2">
					{(Object.keys(BENEFIT_LABELS) as BenefitKey[]).map((key) => {
						const item = offer.benefits[key];
						return (
							<div
								key={key}
								className="grid grid-cols-[1fr_auto_120px] items-center gap-2 rounded-lg border border-border/70 p-2.5"
							>
								<Label className="text-xs leading-relaxed">
									{BENEFIT_LABELS[key]}
								</Label>
								<Switch
									checked={item.enabled}
									onCheckedChange={(checked) =>
										onBenefitChange(key, { enabled: checked })
									}
								/>
								<div className="relative">
									<span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[11px] text-muted-foreground">
										₹
									</span>
									<Input
										type="number"
										disabled={!item.enabled}
										value={item.monthlyValue}
										onChange={(event) =>
											onBenefitChange(key, {
												monthlyValue: parseNumberInput(event.target.value),
											})
										}
										className="h-9 pl-5 pr-8 text-xs"
									/>
									<span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
										/mo
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				<p className="text-xs font-semibold text-muted-foreground">
					Optional fit inputs
				</p>
				{QUALITATIVE_LABELS.map((item) => {
					const score = offer.qualitative[item.key];
					return (
						<div key={item.key} className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label className="text-xs">{item.label}</Label>
								<span className="text-xs font-semibold text-foreground">
									{score}/5
								</span>
							</div>
							<Slider
								value={[score]}
								min={1}
								max={5}
								step={1}
								onValueChange={(next) =>
									onQualitativeChange(item.key, next[0] ?? score)
								}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
