import {
	Building2,
	ChevronDown,
	Copy,
	Info,
	MapPin,
	MoreHorizontal,
	Trash2,
	TrendingUp,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import { EMPLOYER_TYPE_LABELS } from "../constants";
import { formatCompactCurrency } from "../format";
import { parseNumberInput } from "../input";
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
	offerOpen: boolean;
	advancedOpen: boolean;
	canDelete: boolean;
	onOfferOpenChange: (open: boolean) => void;
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
	offerOpen,
	advancedOpen,
	canDelete,
	onOfferOpenChange,
	onAdvancedOpenChange,
	onDuplicate,
	onDelete,
	onOfferFieldChange,
	onBenefitChange,
	onQualitativeChange,
}: OfferCardProps) {
	return (
		<div className="overflow-hidden rounded-2xl border border-border bg-background">
			<Collapsible open={offerOpen} onOpenChange={onOfferOpenChange}>
				{/* Header — always visible */}
				<div className="flex items-center gap-1 px-4 py-3">
					{/* Collapse trigger — company name takes all available space */}
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex flex-1 items-center text-left"
						>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold leading-tight text-foreground">
									{offer.companyName || "Unnamed offer"}
								</p>
								{!offerOpen ? (
									<p className="mt-0.5 text-xs text-muted-foreground">
										{formatCompactCurrency(offer.fixedAnnualCash)} fixed
										{offer.variableAnnualTarget > 0
											? ` · ${formatCompactCurrency(offer.variableAnnualTarget)} variable`
											: ""}
										{offer.equityAnnualizedValue > 0
											? ` · ${formatCompactCurrency(offer.equityAnnualizedValue)} equity`
											: ""}
									</p>
								) : null}
							</div>
						</button>
					</CollapsibleTrigger>

					{/* Three-dots menu + chevron grouped on the right */}
					<div className="flex shrink-0 items-center">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-40">
								<DropdownMenuItem
									onClick={onDuplicate}
									className="gap-2 text-sm focus:bg-primary/10 focus:text-primary"
								>
									<Copy className="h-3.5 w-3.5" />
									Duplicate offer
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onDelete}
									disabled={!canDelete}
									className="gap-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
								>
									<Trash2 className="h-3.5 w-3.5" />
									Delete offer
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex h-8 w-8 items-center justify-center text-muted-foreground"
							>
								<ChevronDown
									className={cn(
										"h-4 w-4 transition-transform duration-200",
										offerOpen ? "rotate-180" : "rotate-0",
									)}
								/>
							</button>
						</CollapsibleTrigger>
					</div>
				</div>

				{/* Collapsible body — form fields + advanced section */}
				<CollapsibleContent>
					<div className="border-t border-border/60 px-4 pb-4 pt-3">
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-1.5 sm:col-span-2">
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
									onChange={(event) =>
										onOfferFieldChange("city", event.target.value)
									}
								/>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor={`${offer.id}-work-mode`}
									className="text-xs font-semibold"
								>
									Work mode
								</Label>
								<select
									id={`${offer.id}-work-mode`}
									value={offer.workMode}
									onChange={(event) =>
										onOfferFieldChange(
											"workMode",
											event.target.value as WorkMode,
										)
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
									onOfferFieldChange("fixedAnnualCash", parseNumberInput(value))
								}
							/>

							<Field
								id={`${offer.id}-variable`}
								label="Variable target / year"
								value={offer.variableAnnualTarget}
								suffix="₹"
								onChange={(value) =>
									onOfferFieldChange(
										"variableAnnualTarget",
										parseNumberInput(value),
									)
								}
							/>

							<div className="space-y-1.5">
								<Label
									htmlFor={`${offer.id}-joining`}
									className="flex items-center gap-1 text-xs font-semibold text-foreground"
								>
									One-time bonus
									<TooltipProvider delayDuration={200}>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="text-muted-foreground transition-colors hover:text-foreground"
												>
													<Info className="h-3.5 w-3.5" />
												</button>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="max-w-56 p-3 text-xs"
											>
												<p className="font-semibold">One-time bonus</p>
												<p className="mt-1 opacity-90">
													Any non-recurring payout — joining bonus, first-year
													retention, sign-on, or similar. Counted once in Year-1
													realized value.
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<div className="relative">
									<Input
										id={`${offer.id}-joining`}
										type="number"
										value={offer.joiningBonus}
										onChange={(event) =>
											onOfferFieldChange(
												"joiningBonus",
												parseNumberInput(event.target.value),
											)
										}
										className="pr-12"
									/>
									<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
										₹
									</span>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label className="flex items-center gap-1 text-xs font-semibold text-foreground">
									Equity type
									<TooltipProvider delayDuration={200}>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="text-muted-foreground transition-colors hover:text-foreground"
												>
													<Info className="h-3.5 w-3.5" />
												</button>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="max-w-64 p-3 text-xs"
											>
												<p className="font-semibold">Equity type</p>
												<div className="mt-1.5 space-y-1 opacity-90">
													<p>
														<span className="font-semibold">None</span> — No
														equity component in this offer.
													</p>
													<p>
														<span className="font-semibold">RSU</span> —
														Restricted Stock Units. Company shares granted on a
														vesting schedule; value tied to stock price at vest.
													</p>
													<p>
														<span className="font-semibold">ESOP</span> —
														Employee Stock Options. Right to buy shares at a
														fixed strike price; valuable if the company grows.
													</p>
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<select
									value={offer.equityType}
									onChange={(event) =>
										onOfferFieldChange(
											"equityType",
											event.target.value as EquityType,
										)
									}
									className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								>
									<option value="none">None</option>
									<option value="rsu">RSU</option>
									<option value="esop">ESOP</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor={`${offer.id}-equity`}
									className="flex items-center gap-1 text-xs font-semibold text-foreground"
								>
									Equity value / year
									<TooltipProvider delayDuration={200}>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="text-muted-foreground transition-colors hover:text-foreground"
												>
													<Info className="h-3.5 w-3.5" />
												</button>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="max-w-64 p-3 text-xs"
											>
												<p className="font-semibold">Equity value / year</p>
												<p className="mt-1 opacity-90">
													Annualised equity value — total grant divided by
													vesting period. For RSUs, use current fair market
													value. For ESOPs, use estimated value above strike
													price. Enter 0 if unknown or none.
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<div className="relative">
									<Input
										id={`${offer.id}-equity`}
										type="number"
										value={offer.equityAnnualizedValue}
										onChange={(event) =>
											onOfferFieldChange(
												"equityAnnualizedValue",
												parseNumberInput(event.target.value),
											)
										}
										className="pr-12"
									/>
									<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
										₹
									</span>
								</div>
							</div>
						</div>

						<Collapsible
							open={advancedOpen}
							onOpenChange={onAdvancedOpenChange}
						>
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
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
