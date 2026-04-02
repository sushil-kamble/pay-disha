import {
	Building2,
	ChevronDown,
	Copy,
	MapPin,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { cn } from "#/lib/utils";
import { EMPLOYER_TYPE_LABELS } from "../constants";
import { applyEmployerPreset } from "../presets";
import type {
	BenefitKey,
	EmployerType,
	EquityType,
	OfferInput,
	QualitativeInputs,
	WorkMode,
} from "../types";
import { AdvancedOfferFields } from "./advanced-offer-fields";

interface OfferCardProps {
	offer: OfferInput;
	advancedOpen: boolean;
	canDelete: boolean;
	onAdvancedOpenChange: (open: boolean) => void;
	onDuplicate: () => void;
	onDelete: () => void;
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

function Field({
	id,
	label,
	value,
	onChange,
	placeholder,
	suffix,
}: {
	id: string;
	label: string;
	value: string | number;
	onChange: (value: string) => void;
	placeholder?: string;
	suffix?: string;
}) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id} className="text-xs font-semibold text-foreground">
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type="number"
					value={value}
					placeholder={placeholder}
					onChange={(event) => onChange(event.target.value)}
					className={cn(suffix ? "pr-12" : undefined)}
				/>
				{suffix ? (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
		</div>
	);
}

export function OfferCard({
	offer,
	advancedOpen,
	canDelete,
	onAdvancedOpenChange,
	onDuplicate,
	onDelete,
	onOfferFieldChange,
	onBenefitChange,
	onQualitativeChange,
}: OfferCardProps) {
	return (
		<div className="rounded-2xl border border-border bg-background p-4">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-[11px]">
							{offer.label}
						</Badge>
						<span className="text-xs text-muted-foreground">
							{offer.companyName}
						</span>
					</div>
					<p className="text-xs text-muted-foreground">
						Quick compare first, then add realism only if needed.
					</p>
				</div>
				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onDuplicate}
						className="h-8 px-2"
					>
						<Copy className="h-3.5 w-3.5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onDelete}
						disabled={!canDelete}
						className="h-8 px-2"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label
						htmlFor={`${offer.id}-label`}
						className="text-xs font-semibold"
					>
						Offer label
					</Label>
					<Input
						id={`${offer.id}-label`}
						value={offer.label}
						onChange={(event) =>
							onOfferFieldChange("label", event.target.value)
						}
					/>
				</div>

				<div className="space-y-1.5">
					<Label
						htmlFor={`${offer.id}-company`}
						className="text-xs font-semibold"
					>
						Company name
					</Label>
					<Input
						id={`${offer.id}-company`}
						value={offer.companyName}
						onChange={(event) =>
							onOfferFieldChange("companyName", event.target.value)
						}
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="flex items-center gap-1 text-xs font-semibold">
						<Building2 className="h-3.5 w-3.5 text-muted-foreground" />
						Employer type
					</Label>
					<select
						value={offer.employerType}
						onChange={(event) => {
							const next = event.target.value as EmployerType;
							onOfferFieldChange("employerType", next);
							const withPreset = applyEmployerPreset(offer, next);
							onOfferFieldChange(
								"expectedBonusPayoutPct",
								withPreset.expectedBonusPayoutPct,
							);
							onOfferFieldChange(
								"expectedAnnualIncrementPct",
								withPreset.expectedAnnualIncrementPct,
							);
							onOfferFieldChange(
								"expectedPromotionMonths",
								withPreset.expectedPromotionMonths,
							);
							onOfferFieldChange(
								"promotionUpliftPct",
								withPreset.promotionUpliftPct,
							);
							onOfferFieldChange(
								"equityCliffMonths",
								withPreset.equityCliffMonths,
							);
						}}
						className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
					>
						{(Object.keys(EMPLOYER_TYPE_LABELS) as EmployerType[]).map(
							(key) => (
								<option key={key} value={key}>
									{EMPLOYER_TYPE_LABELS[key]}
								</option>
							),
						)}
					</select>
				</div>

				<div className="space-y-1.5">
					<Label className="flex items-center gap-1 text-xs font-semibold">
						<MapPin className="h-3.5 w-3.5 text-muted-foreground" />
						City
					</Label>
					<Input
						value={offer.city}
						onChange={(event) => onOfferFieldChange("city", event.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold">Work mode</Label>
					<select
						value={offer.workMode}
						onChange={(event) =>
							onOfferFieldChange("workMode", event.target.value as WorkMode)
						}
						className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
					>
						<option value="remote">Remote</option>
						<option value="hybrid">Hybrid</option>
						<option value="onsite">On-site</option>
					</select>
				</div>

				<Field
					id={`${offer.id}-fixed`}
					label="Annual fixed cash"
					value={offer.fixedAnnualCash}
					suffix="₹"
					onChange={(value) =>
						onOfferFieldChange("fixedAnnualCash", toNumber(value))
					}
				/>

				<Field
					id={`${offer.id}-variable`}
					label="Variable target / year"
					value={offer.variableAnnualTarget}
					suffix="₹"
					onChange={(value) =>
						onOfferFieldChange("variableAnnualTarget", toNumber(value))
					}
				/>

				<Field
					id={`${offer.id}-joining`}
					label="Joining bonus"
					value={offer.joiningBonus}
					suffix="₹"
					onChange={(value) =>
						onOfferFieldChange("joiningBonus", toNumber(value))
					}
				/>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold">Equity type</Label>
					<select
						value={offer.equityType}
						onChange={(event) =>
							onOfferFieldChange("equityType", event.target.value as EquityType)
						}
						className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
					>
						<option value="none">None</option>
						<option value="rsu">RSU</option>
						<option value="esop">ESOP</option>
					</select>
				</div>

				<Field
					id={`${offer.id}-equity`}
					label="Equity value / year"
					value={offer.equityAnnualizedValue}
					suffix="₹"
					onChange={(value) =>
						onOfferFieldChange("equityAnnualizedValue", toNumber(value))
					}
				/>
			</div>

			<Collapsible open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="mt-4 flex w-full items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
					>
						<span className="inline-flex items-center gap-1.5">
							<TrendingUp className="h-3.5 w-3.5 text-primary" />
							Add realism (advanced)
						</span>
						<ChevronDown
							className={cn(
								"h-4 w-4 transition-transform",
								advancedOpen ? "rotate-180" : "rotate-0",
							)}
						/>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-4">
					<AdvancedOfferFields
						offer={offer}
						onOfferFieldChange={onOfferFieldChange}
						onBenefitChange={onBenefitChange}
						onQualitativeChange={onQualitativeChange}
					/>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
