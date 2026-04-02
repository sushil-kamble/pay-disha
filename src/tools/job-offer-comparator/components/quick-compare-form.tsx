import { Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import type {
	BenefitKey,
	CompareConfig,
	OfferInput,
	QualitativeInputs,
} from "../types";
import { OfferCard } from "./offer-card";
import { ScenarioTabs } from "./scenario-tabs";

interface QuickCompareFormProps {
	offers: OfferInput[];
	config: CompareConfig;
	advancedOpenByOfferId: Record<string, boolean>;
	onConfigChange: <K extends keyof CompareConfig>(
		key: K,
		value: CompareConfig[K],
	) => void;
	onOfferFieldChange: <K extends keyof OfferInput>(
		offerId: string,
		key: K,
		value: OfferInput[K],
	) => void;
	onOfferBenefitChange: (
		offerId: string,
		key: BenefitKey,
		patch: { enabled?: boolean; monthlyValue?: number },
	) => void;
	onOfferQualitativeChange: <K extends keyof QualitativeInputs>(
		offerId: string,
		key: K,
		value: QualitativeInputs[K],
	) => void;
	onOfferDuplicate: (offerId: string) => void;
	onOfferDelete: (offerId: string) => void;
	onAdvancedOpenChange: (offerId: string, open: boolean) => void;
	onAddOffer: () => void;
	onReset: () => void;
	canAddOffer: boolean;
}

export function QuickCompareForm({
	offers,
	config,
	advancedOpenByOfferId,
	onConfigChange,
	onOfferFieldChange,
	onOfferBenefitChange,
	onOfferQualitativeChange,
	onOfferDuplicate,
	onOfferDelete,
	onAdvancedOpenChange,
	onAddOffer,
	onReset,
	canAddOffer,
}: QuickCompareFormProps) {
	return (
		<div className="space-y-4 rounded-2xl border border-border bg-card p-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-2">
					<p className="text-sm font-semibold text-foreground">Quick compare</p>
					<Badge variant="outline" className="text-[11px]">
						Offer set
					</Badge>
				</div>
				<p className="text-xs leading-relaxed text-muted-foreground">
					Start simple. Add advanced assumptions only if you need deeper
					realism.
				</p>
			</div>

			<div className="space-y-2">
				<Label className="text-xs font-semibold text-foreground">
					Scenario lens
				</Label>
				<ScenarioTabs
					value={config.scenario}
					onValueChange={(value) => onConfigChange("scenario", value)}
				/>
			</div>

			<div className="space-y-2 rounded-lg border border-border/70 bg-muted/25 p-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-xs font-semibold text-foreground">
							Include fit inputs
						</p>
						<p className="text-[11px] text-muted-foreground">
							Blend money with role, growth, and culture confidence.
						</p>
					</div>
					<Switch
						checked={config.includeQualitativeFit}
						onCheckedChange={(checked) =>
							onConfigChange("includeQualitativeFit", checked)
						}
					/>
				</div>

				{config.includeQualitativeFit ? (
					<div className="space-y-3 pt-2">
						<div className="space-y-1">
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium text-foreground">
									Finance weight
								</span>
								<span className="text-muted-foreground">
									{Math.round(config.financeWeightPct)}%
								</span>
							</div>
							<Slider
								value={[config.financeWeightPct]}
								min={50}
								max={95}
								step={1}
								onValueChange={(next) => {
									const financeWeight = next[0] ?? config.financeWeightPct;
									onConfigChange("financeWeightPct", financeWeight);
									onConfigChange("fitWeightPct", 100 - financeWeight);
								}}
							/>
						</div>
					</div>
				) : null}
			</div>

			<div className="space-y-3">
				{offers.map((offer) => (
					<OfferCard
						key={offer.id}
						offer={offer}
						advancedOpen={advancedOpenByOfferId[offer.id] ?? false}
						canDelete={offers.length > 2}
						onAdvancedOpenChange={(open) =>
							onAdvancedOpenChange(offer.id, open)
						}
						onDuplicate={() => onOfferDuplicate(offer.id)}
						onDelete={() => onOfferDelete(offer.id)}
						onOfferFieldChange={(key, value) =>
							onOfferFieldChange(offer.id, key, value)
						}
						onBenefitChange={(key, patch) =>
							onOfferBenefitChange(offer.id, key, patch)
						}
						onQualitativeChange={(key, value) =>
							onOfferQualitativeChange(offer.id, key, value)
						}
					/>
				))}
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onAddOffer}
					disabled={!canAddOffer}
				>
					<Plus className="h-4 w-4" />
					Add offer
				</Button>
				<Button type="button" variant="ghost" onClick={onReset}>
					<RotateCcw className="h-4 w-4" />
					Reset
				</Button>
			</div>

			<div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-[11px] leading-relaxed text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
				<p className="inline-flex items-center gap-1 font-semibold">
					<ShieldCheck className="h-3.5 w-3.5" />
					Privacy first
				</p>
				<p className="mt-1">
					Your offer data stays in your browser only. We do not track or send
					these inputs to any server.
				</p>
			</div>
		</div>
	);
}
