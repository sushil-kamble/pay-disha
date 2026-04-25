import {
	ChevronDown,
	RefreshCcw,
	ShieldCheck,
	SlidersHorizontal,
} from "lucide-react";

import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { cn } from "#/lib/utils";
import { formatCurrency, formatIndian } from "#/tools/buy-vs-rent/calculator";
import {
	BUY_VS_RENT_LIMITS,
	MARKET_TYPE_OPTIONS,
} from "#/tools/buy-vs-rent/constants";
import {
	type BuyVsRentDraft,
	type BuyVsRentDraftFieldKey,
	formatPercent,
} from "#/tools/buy-vs-rent/page-state";
import { surfaceClassName } from "#/tools/buy-vs-rent/page-ui";
import type { MarketType } from "#/tools/buy-vs-rent/types";

function Field({
	id,
	label,
	value,
	onChange,
	placeholder,
	suffix,
	helper,
	min,
	max,
	step,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	suffix?: string;
	helper?: string;
	min?: number;
	max?: number;
	step?: number;
}) {
	return (
		<div className="grid content-start gap-1.5">
			<Label htmlFor={id} className="text-xs font-semibold text-foreground">
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type="number"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={placeholder}
					min={min}
					max={max}
					step={step}
					className={cn("h-10", suffix ? "pr-16" : undefined)}
				/>
				{suffix ? (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
			{helper ? (
				<p className="text-xs leading-relaxed text-muted-foreground">
					{helper}
				</p>
			) : null}
		</div>
	);
}

function SelectField<TValue extends string>({
	id,
	label,
	value,
	onValueChange,
	options,
}: {
	id: string;
	label: string;
	value: TValue;
	onValueChange: (value: TValue) => void;
	options: readonly {
		value: TValue;
		label: string;
		description: string;
	}[];
}) {
	const selectedOption = options.find((option) => option.value === value);

	return (
		<div className="grid content-start gap-1.5">
			<Label htmlFor={id} className="text-xs font-semibold text-foreground">
				{label}
			</Label>
			<div className="relative">
				<select
					id={id}
					value={value}
					onChange={(event) => onValueChange(event.target.value as TValue)}
					className={cn(
						"h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-left text-sm font-medium text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20",
					)}
				>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
			</div>
			{selectedOption ? (
				<p className="text-xs leading-relaxed text-muted-foreground">
					{selectedOption.description}
				</p>
			) : null}
		</div>
	);
}

export function ConfigPanelLoadingFallback() {
	return (
		<div className={cn(surfaceClassName, "p-4 sm:p-5")}>
			<div className="space-y-4">
				<div className="h-16 rounded-xl bg-muted/60" />
				<div className="h-16 rounded-xl bg-muted/60" />
				<div className="h-16 rounded-xl bg-muted/60" />
				<div className="h-16 rounded-xl bg-muted/60" />
				<div className="h-16 rounded-xl bg-muted/60" />
				<div className="h-12 rounded-xl bg-muted/50" />
			</div>
		</div>
	);
}

export function ConfigPanel({
	draft,
	advancedOpen,
	setAdvancedOpen,
	customGrowthOpen,
	setCustomGrowthOpen,
	loadedFromStorage,
	propertyPriceRupees,
	availableCashRupees,
	estimatedExtraBuyingCosts,
	onFieldChange,
	onMarketTypeChange,
	onReset,
}: {
	draft: BuyVsRentDraft;
	advancedOpen: boolean;
	setAdvancedOpen: (value: boolean) => void;
	customGrowthOpen: boolean;
	setCustomGrowthOpen: (value: boolean) => void;
	loadedFromStorage: boolean;
	propertyPriceRupees: number;
	availableCashRupees: number;
	estimatedExtraBuyingCosts: number;
	onFieldChange: (key: BuyVsRentDraftFieldKey, value: string) => void;
	onMarketTypeChange: (value: MarketType) => void;
	onReset: () => void;
}) {
	return (
		<div
			className={cn(
				surfaceClassName,
				"p-4 pb-7 sm:p-5 sm:pb-8 lg:sticky lg:top-20",
			)}
		>
			<div className="mb-4 flex items-start justify-between gap-3 border-b border-border/80 pb-4">
				<div>
					<p className="text-base font-semibold text-foreground">
						Your decision inputs
					</p>
					<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
						Five numbers are enough for a useful directional answer.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onReset}
					className="shrink-0 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
				>
					<RefreshCcw className="size-4" />
					Reset
				</Button>
			</div>

			<div className="space-y-4">
				<Field
					id="property-price"
					label="Home price"
					value={draft.propertyPriceLakhs}
					onChange={(value) => onFieldChange("propertyPriceLakhs", value)}
					placeholder="90"
					suffix="Lakhs"
					min={BUY_VS_RENT_LIMITS.minPropertyPriceLakhs}
					max={BUY_VS_RENT_LIMITS.maxPropertyPriceLakhs}
					step={0.1}
					helper={`About ₹${formatIndian(propertyPriceRupees)}.`}
				/>
				<Field
					id="monthly-rent"
					label="Monthly rent for a similar home"
					value={draft.monthlyRent}
					onChange={(value) => onFieldChange("monthlyRent", value)}
					placeholder="30000"
					suffix="/mo"
					min={BUY_VS_RENT_LIMITS.minMonthlyRent}
					max={BUY_VS_RENT_LIMITS.maxMonthlyRent}
					step={500}
				/>
				<Field
					id="stay-years"
					label="How long will you stay?"
					value={draft.stayYears}
					onChange={(value) => onFieldChange("stayYears", value)}
					placeholder="8"
					suffix="yrs"
					min={BUY_VS_RENT_LIMITS.minStayYears}
					max={BUY_VS_RENT_LIMITS.maxStayYears}
					step={1}
					helper="This is usually the biggest swing factor."
				/>
				<Field
					id="monthly-take-home"
					label="Household take-home"
					value={draft.monthlyTakeHome}
					onChange={(value) => onFieldChange("monthlyTakeHome", value)}
					placeholder="125000"
					suffix="/mo"
					min={BUY_VS_RENT_LIMITS.minMonthlyTakeHome}
					max={BUY_VS_RENT_LIMITS.maxMonthlyTakeHome}
					step={1000}
					helper="Use actual monthly money after tax, not CTC."
				/>
				<Field
					id="available-cash"
					label="Cash available for buying"
					value={draft.availableCashLakhs}
					onChange={(value) => onFieldChange("availableCashLakhs", value)}
					placeholder="25"
					suffix="Lakhs"
					min={BUY_VS_RENT_LIMITS.minAvailableCashLakhs}
					max={BUY_VS_RENT_LIMITS.maxAvailableCashLakhs}
					step={0.1}
					helper={`${formatCurrency(availableCashRupees)} available. Estimated buying friction is ${formatCurrency(estimatedExtraBuyingCosts)} before down payment.`}
				/>

				<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
					<div className="rounded-xl border border-border/80 bg-muted/35 p-3">
						<div className="flex items-center justify-between gap-3">
							<div className="flex min-w-0 items-start gap-2">
								<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<SlidersHorizontal className="size-4" />
								</span>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-foreground">
										Advanced assumptions
									</p>
									<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
										Optional grouped values, not a long real-estate form.
									</p>
								</div>
							</div>
							<CollapsibleTrigger asChild>
								<button
									type="button"
									aria-label={advancedOpen ? "Collapse" : "Expand"}
									className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
								>
									<ChevronDown
										className={cn(
											"size-4 transition-transform",
											advancedOpen && "rotate-180",
										)}
									/>
								</button>
							</CollapsibleTrigger>
						</div>

						<CollapsibleContent className="mt-4 space-y-4">
							<SelectField
								id="market-type"
								label="Market type"
								value={draft.marketType}
								onValueChange={onMarketTypeChange}
								options={MARKET_TYPE_OPTIONS}
							/>

							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									id="loan-rate"
									label="Loan rate"
									value={draft.loanRatePct}
									onChange={(value) => onFieldChange("loanRatePct", value)}
									placeholder="7.75"
									suffix="%"
									min={BUY_VS_RENT_LIMITS.minLoanRatePct}
									max={BUY_VS_RENT_LIMITS.maxLoanRatePct}
									step={0.01}
								/>
								<Field
									id="loan-tenure"
									label="Loan tenure"
									value={draft.loanTenureYears}
									onChange={(value) => onFieldChange("loanTenureYears", value)}
									placeholder="20"
									suffix="yrs"
									min={BUY_VS_RENT_LIMITS.minLoanTenureYears}
									max={BUY_VS_RENT_LIMITS.maxLoanTenureYears}
									step={1}
								/>
							</div>

							<Field
								id="extra-buying-cost"
								label="Extra buying costs"
								value={draft.extraBuyingCostPct}
								onChange={(value) => onFieldChange("extraBuyingCostPct", value)}
								placeholder="7"
								suffix="%"
								min={BUY_VS_RENT_LIMITS.minExtraBuyingCostPct}
								max={BUY_VS_RENT_LIMITS.maxExtraBuyingCostPct}
								step={0.1}
								helper="Stamp duty, registration, GST if any, legal, brokerage, interiors, move-in."
							/>

							<Field
								id="monthly-owner-cost"
								label="Monthly owner costs"
								value={draft.monthlyOwnerCost}
								onChange={(value) => onFieldChange("monthlyOwnerCost", value)}
								placeholder="5625"
								suffix="₹"
								min={BUY_VS_RENT_LIMITS.minMonthlyOwnerCost}
								max={BUY_VS_RENT_LIMITS.maxMonthlyOwnerCost}
								step={500}
								helper="Society maintenance, repairs, property tax, insurance, sinking fund."
							/>

							<Field
								id="rent-setup-cost"
								label="Rent setup cost"
								value={draft.rentSetupCost}
								onChange={(value) => onFieldChange("rentSetupCost", value)}
								placeholder="90000"
								suffix="₹"
								min={BUY_VS_RENT_LIMITS.minRentSetupCost}
								max={BUY_VS_RENT_LIMITS.maxRentSetupCost}
								step={1000}
								helper="Deposit plus brokerage."
							/>
							<Field
								id="rent-increase"
								label="Rent increase"
								value={draft.rentIncreasePct}
								onChange={(value) => onFieldChange("rentIncreasePct", value)}
								placeholder="6"
								suffix="%/yr"
								min={BUY_VS_RENT_LIMITS.minRentIncreasePct}
								max={BUY_VS_RENT_LIMITS.maxRentIncreasePct}
								step={0.1}
								helper="Expected yearly increase for a similar rented home."
							/>

							<div className="overflow-hidden rounded-xl border border-border/75 bg-background/70">
								<Collapsible
									open={customGrowthOpen}
									onOpenChange={setCustomGrowthOpen}
								>
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
										>
											<span>Customize growth numbers</span>
											<ChevronDown
												className={cn(
													"size-4 shrink-0 text-muted-foreground transition-transform",
													customGrowthOpen && "rotate-180",
												)}
											/>
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent className="border-t border-border/70 px-3 pb-3 pt-3">
										<div className="grid gap-4 sm:grid-cols-2">
											<Field
												id="property-appreciation"
												label="Home growth"
												value={draft.propertyAppreciationPct}
												onChange={(value) =>
													onFieldChange("propertyAppreciationPct", value)
												}
												placeholder="5"
												suffix="%/yr"
												min={BUY_VS_RENT_LIMITS.minPropertyAppreciationPct}
												max={BUY_VS_RENT_LIMITS.maxPropertyAppreciationPct}
												step={0.1}
												helper={`Current input: ${formatPercent(Number.parseFloat(draft.propertyAppreciationPct) || 0)}.`}
											/>
											<Field
												id="investment-return"
												label="Investment return"
												value={draft.investmentReturnPct}
												onChange={(value) =>
													onFieldChange("investmentReturnPct", value)
												}
												placeholder="9"
												suffix="%/yr"
												min={BUY_VS_RENT_LIMITS.minInvestmentReturnPct}
												max={BUY_VS_RENT_LIMITS.maxInvestmentReturnPct}
												step={0.1}
											/>
										</div>
									</CollapsibleContent>
								</Collapsible>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				<Separator />

				<p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/45 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
					<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
						<ShieldCheck className="size-3" />
					</span>
					<span>
						{loadedFromStorage
							? "These values came from local storage in your browser."
							: "Your values stay in this browser. Nothing is stored on our servers."}{" "}
						Tax benefits are not included in the default verdict because HRA and
						home-loan deductions depend on salary structure and regime.
					</span>
				</p>
			</div>
		</div>
	);
}
