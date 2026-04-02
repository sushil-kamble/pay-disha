import { Info } from "lucide-react";
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
import type {
	BenefitKey,
	OfferInput,
	QualitativeInputs,
	TaxRegime,
} from "../types";

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

function toNumber(value: string) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function toInt(value: string) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function AdvancedOfferFields({
	offer,
	onOfferFieldChange,
	onBenefitChange,
	onQualitativeChange,
}: AdvancedOfferFieldsProps) {
	return (
		<div className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-2">
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
							onOfferFieldChange("pfMonthly", toNumber(event.target.value))
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${offer.id}-increment`} className="text-xs">
						Expected annual increment (%)
					</Label>
					<Input
						id={`${offer.id}-increment`}
						type="number"
						value={offer.expectedAnnualIncrementPct}
						onChange={(event) =>
							onOfferFieldChange(
								"expectedAnnualIncrementPct",
								toNumber(event.target.value),
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${offer.id}-next-increment`} className="text-xs">
						Next increment month (1-12)
					</Label>
					<Input
						id={`${offer.id}-next-increment`}
						type="number"
						min={1}
						max={12}
						value={offer.nextIncrementMonth}
						onChange={(event) =>
							onOfferFieldChange(
								"nextIncrementMonth",
								toInt(event.target.value),
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${offer.id}-promotion-months`} className="text-xs">
						Expected promotion in (months)
					</Label>
					<Input
						id={`${offer.id}-promotion-months`}
						type="number"
						value={offer.expectedPromotionMonths}
						onChange={(event) =>
							onOfferFieldChange(
								"expectedPromotionMonths",
								toInt(event.target.value),
							)
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${offer.id}-promotion-uplift`} className="text-xs">
						Promotion uplift (%)
					</Label>
					<Input
						id={`${offer.id}-promotion-uplift`}
						type="number"
						value={offer.promotionUpliftPct}
						onChange={(event) =>
							onOfferFieldChange(
								"promotionUpliftPct",
								toNumber(event.target.value),
							)
						}
					/>
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				<div className="flex items-center gap-1.5">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Benefits You Value
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
						<TooltipContent className="max-w-64 text-pretty">
							Enable only benefits that matter to you. Disabled benefits are
							excluded from effective value.
						</TooltipContent>
					</Tooltip>
				</div>

				<div className="space-y-2">
					{(Object.keys(BENEFIT_LABELS) as BenefitKey[]).map((key) => {
						const item = offer.benefits[key];
						return (
							<div
								key={key}
								className="grid items-center gap-2 rounded-lg border border-border/70 p-2.5 sm:grid-cols-[1fr_auto_120px]"
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
								<Input
									type="number"
									disabled={!item.enabled}
									value={item.monthlyValue}
									onChange={(event) =>
										onBenefitChange(key, {
											monthlyValue: toNumber(event.target.value),
										})
									}
									className="h-9 text-xs"
								/>
							</div>
						);
					})}
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Optional Fit Inputs
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
