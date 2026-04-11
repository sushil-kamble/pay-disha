import { ChevronDown, RefreshCcw, ShieldCheck } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { cn } from "#/lib/utils";
import {
	BUY_VS_RENT_CITY_TIER_OPTIONS,
	BUY_VS_RENT_LIMITS,
} from "#/tools/buy-vs-rent/constants";
import { formatCurrency, formatIndian } from "#/tools/buy-vs-rent/insights";
import {
	type BuyVsRentDraft,
	type BuyVsRentDraftFieldKey,
	formatPercent,
} from "#/tools/buy-vs-rent/page-state";
import {
	resultCardGridClassName,
	surfaceClassName,
} from "#/tools/buy-vs-rent/page-ui";
import type { BuyVsRentCityTier } from "#/tools/buy-vs-rent/types";

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
			<Label
				htmlFor={id}
				className="flex items-end text-sm font-semibold text-foreground"
			>
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
					className={cn(suffix ? "pr-14" : undefined)}
				/>
				{suffix ? (
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
			{helper ? (
				<p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
			) : null}
		</div>
	);
}

function SelectField({
	id,
	label,
	value,
	onValueChange,
	placeholder,
	helper,
	options,
}: {
	id: string;
	label: string;
	value: BuyVsRentCityTier;
	onValueChange: (value: BuyVsRentCityTier) => void;
	placeholder: string;
	helper?: string;
	options: readonly {
		value: BuyVsRentCityTier;
		label: string;
		cities: string;
	}[];
}) {
	return (
		<div className="grid content-start gap-1.5">
			<Label
				htmlFor={id}
				className="flex items-end text-sm font-semibold text-foreground"
			>
				{label}
			</Label>
			<Select
				value={value}
				onValueChange={(nextValue) =>
					onValueChange(nextValue as BuyVsRentCityTier)
				}
			>
				<SelectTrigger id={id} className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label} · {option.cities}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			{helper ? (
				<p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
			) : null}
		</div>
	);
}

export function ConfigPanelLoadingFallback() {
	return (
		<div
			className={cn(
				surfaceClassName,
				"p-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto",
			)}
		>
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-3 border-b border-border/80 pb-4">
					<div className="h-5 w-32 rounded bg-muted/70" />
					<div className="h-9 w-20 rounded-md bg-muted/60" />
				</div>
				<div className="space-y-3">
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className="h-16 rounded-xl bg-muted/60" />
				</div>
				<div className="h-px bg-border/80" />
				<div className="space-y-3">
					<div className="h-4 w-40 rounded bg-muted/70" />
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className="h-16 rounded-xl bg-muted/60" />
					<div className={resultCardGridClassName}>
						<div className="h-16 rounded-xl bg-muted/60" />
						<div className="h-16 rounded-xl bg-muted/60" />
					</div>
				</div>
				<div className="h-px bg-border/80" />
				<div className="h-14 rounded-lg bg-muted/50" />
			</div>
		</div>
	);
}

export function ConfigPanel({
	draft,
	taxOpen,
	setTaxOpen,
	loadedFromStorage,
	propertyPriceRupees,
	downPaymentValue,
	downPaymentShare,
	maxDownPaymentLakhs,
	onFieldChange,
	onCityTierChange,
	onReset,
}: {
	draft: BuyVsRentDraft;
	taxOpen: boolean;
	setTaxOpen: (value: boolean) => void;
	loadedFromStorage: boolean;
	propertyPriceRupees: number;
	downPaymentValue: number;
	downPaymentShare: number;
	maxDownPaymentLakhs: number;
	onFieldChange: (key: BuyVsRentDraftFieldKey, value: string) => void;
	onCityTierChange: (value: BuyVsRentCityTier) => void;
	onReset: () => void;
}) {
	return (
		<div
			className={cn(
				surfaceClassName,
				"p-6 pb-12 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto",
			)}
		>
			<div className="mb-4 flex items-center justify-between gap-3 border-b border-border/80 pb-4">
				<p className="text-md font-semibold text-foreground">Configuration</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onReset}
					className="hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
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
					helper={`= ₹${formatIndian(propertyPriceRupees)}`}
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
					label="How long do you expect to stay?"
					value={draft.stayYears}
					onChange={(value) => onFieldChange("stayYears", value)}
					placeholder="10"
					suffix="yrs"
					min={BUY_VS_RENT_LIMITS.minStayYears}
					max={BUY_VS_RENT_LIMITS.maxStayYears}
					step={1}
					helper="Holding period is the biggest driver in this decision."
				/>
				<Field
					id="down-payment"
					label="Down payment"
					value={draft.downPaymentLakhs}
					onChange={(value) => onFieldChange("downPaymentLakhs", value)}
					placeholder="18"
					suffix="Lakhs"
					min={BUY_VS_RENT_LIMITS.minDownPaymentLakhs}
					max={maxDownPaymentLakhs}
					step={0.1}
					helper={`${formatCurrency(downPaymentValue)} up front${propertyPriceRupees > 0 ? `, about ${formatPercent(downPaymentShare)} of the home price.` : "."}`}
				/>
				<Field
					id="loan-rate"
					label="Home loan interest rate"
					value={draft.homeLoanRatePct}
					onChange={(value) => onFieldChange("homeLoanRatePct", value)}
					placeholder="8.75"
					suffix="%"
					min={BUY_VS_RENT_LIMITS.minInterestPct}
					max={BUY_VS_RENT_LIMITS.maxInterestPct}
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

				<Separator />

				<Collapsible open={taxOpen} onOpenChange={setTaxOpen}>
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-semibold text-foreground">
								Income & life stage
							</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								Share your earnings profile so the affordability stress check
								uses a rough take-home estimate.
							</p>
						</div>
						<CollapsibleTrigger asChild>
							<button
								type="button"
								aria-label={taxOpen ? "Collapse" : "Expand"}
								className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
							>
								<ChevronDown
									className={cn(
										"size-4 transition-transform",
										taxOpen && "rotate-180",
									)}
								/>
							</button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent className="mt-3 space-y-3">
						<Field
							id="annual-ctc"
							label="Annual income (CTC)"
							value={draft.annualCtcLakhs}
							onChange={(value) => onFieldChange("annualCtcLakhs", value)}
							placeholder="18"
							suffix="LPA"
							min={BUY_VS_RENT_LIMITS.minAnnualCtcLakhs}
							max={BUY_VS_RENT_LIMITS.maxAnnualCtcLakhs}
							step={0.1}
							helper="Pre-tax annual salary in lakhs."
						/>
						<SelectField
							id="city-tier"
							label="City type"
							value={draft.cityTier}
							onValueChange={onCityTierChange}
							placeholder="Select city tier"
							helper="Used to tune hidden city-level assumptions like rent friction, carrying costs, and growth bias."
							options={BUY_VS_RENT_CITY_TIER_OPTIONS}
						/>
						<div className="grid gap-4 sm:grid-cols-2 *:h-full">
							<Field
								id="age-years"
								label="Age"
								value={draft.ageYears}
								onChange={(value) => onFieldChange("ageYears", value)}
								placeholder="30"
								suffix="yrs"
								min={BUY_VS_RENT_LIMITS.minAgeYears}
								max={BUY_VS_RENT_LIMITS.maxAgeYears}
								step={1}
								helper="Used for age-vs-tenure affordability checks."
							/>
							<Field
								id="salary-growth"
								label="Growth CTC Exp."
								value={draft.salaryGrowthPct}
								onChange={(value) => onFieldChange("salaryGrowthPct", value)}
								placeholder="8"
								suffix="%"
								min={BUY_VS_RENT_LIMITS.minSalaryGrowthPct}
								max={BUY_VS_RENT_LIMITS.maxSalaryGrowthPct}
								step={0.1}
								helper="Used to project take-home as income grows."
							/>
						</div>
					</CollapsibleContent>
				</Collapsible>

				<Separator />

				<p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
					<span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
						<ShieldCheck className="size-3" />
					</span>
					<span>
						{loadedFromStorage
							? "The values are coming from local storage in your browser. Nothing is stored on our servers."
							: "Your values are saved to local storage in your browser. Nothing is stored on our servers."}
					</span>
				</p>
			</div>
		</div>
	);
}
