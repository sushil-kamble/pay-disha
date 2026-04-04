import { createFileRoute } from "@tanstack/react-router";
import {
	Calculator,
	ChevronDown,
	Info,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ToolPageShell } from "#/components/common";
import { Badge } from "#/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import {
	calculate,
	formatIndian,
	formatShort,
} from "#/tools/inhand-salary/calculator";
import {
	CTC_WARNING_THRESHOLD_LAKHS,
	DEFAULT_PF_MONTHLY,
	FINANCIAL_YEAR,
	INHAND_SALARY_STORAGE_KEY,
	NEW_REGIME_STANDARD_DEDUCTION,
	OLD_REGIME_STANDARD_DEDUCTION,
} from "#/tools/inhand-salary/constants";
import type { CalculationResult, TaxRegime } from "#/tools/inhand-salary/types";

export const Route = createFileRoute("/tools/inhand-salary")({
	component: InHandSalaryPage,
});

interface PersistedInHandSalaryState {
	ctcInput: string;
	expectedExemptionsInput: string;
	pfMonthlyInput: string;
	regime: TaxRegime;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isPersistedInHandSalaryState(
	value: unknown,
): value is PersistedInHandSalaryState {
	if (!isRecord(value)) return false;

	return (
		typeof value.ctcInput === "string" &&
		typeof value.expectedExemptionsInput === "string" &&
		typeof value.pfMonthlyInput === "string" &&
		(value.regime === "new" || value.regime === "old")
	);
}

function getStoredPfMonthlyInput(value: unknown): string | null {
	if (!isRecord(value)) return null;

	if (typeof value.pfMonthlyInput === "string") {
		return value.pfMonthlyInput;
	}

	// Support older saved state that stored PF as a number.
	if (typeof value.pfMonthly === "number" && Number.isFinite(value.pfMonthly)) {
		return String(value.pfMonthly);
	}

	return null;
}

function parseStoredJson(rawValue: string | null) {
	if (!rawValue) return null;

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
}

function loadStoredInHandSalaryState(): PersistedInHandSalaryState | null {
	const parsed = parseStoredJson(
		window.localStorage.getItem(INHAND_SALARY_STORAGE_KEY),
	);

	if (!isRecord(parsed)) return null;

	const pfMonthlyInput = getStoredPfMonthlyInput(parsed);
	if (!pfMonthlyInput) return null;

	const normalizedState = { ...parsed, pfMonthlyInput };
	if (!isPersistedInHandSalaryState(normalizedState)) return null;

	return normalizedState;
}

function saveStoredInHandSalaryState(value: PersistedInHandSalaryState) {
	try {
		window.localStorage.setItem(
			INHAND_SALARY_STORAGE_KEY,
			JSON.stringify(value),
		);
	} catch {
		// Ignore storage write failures such as private browsing quotas.
	}
}

// ─── Page Shell ───────────────────────────────────────────────────────────────

function InHandSalaryPage() {
	const [ctcInput, setCtcInput] = useState("");
	const [expectedExemptionsInput, setExpectedExemptionsInput] = useState("");
	const [pfMonthlyInput, setPfMonthlyInput] = useState(
		String(DEFAULT_PF_MONTHLY),
	);
	const [regime, setRegime] = useState<TaxRegime>("new");
	const [storageReady, setStorageReady] = useState(false);

	useEffect(() => {
		const storedState = loadStoredInHandSalaryState();
		if (storedState) {
			setCtcInput(storedState.ctcInput);
			setExpectedExemptionsInput(storedState.expectedExemptionsInput);
			setPfMonthlyInput(storedState.pfMonthlyInput);
			setRegime(storedState.regime);
		}

		setStorageReady(true);
	}, []);

	useEffect(() => {
		if (!storageReady) return;

		saveStoredInHandSalaryState({
			ctcInput,
			expectedExemptionsInput,
			pfMonthlyInput,
			regime,
		});
	}, [ctcInput, expectedExemptionsInput, pfMonthlyInput, regime, storageReady]);

	const ctcLakhs = Number.parseFloat(ctcInput) || 0;
	const expectedExemptions = Number.parseFloat(expectedExemptionsInput) || 0;
	const parsedPfMonthly = Number.parseFloat(pfMonthlyInput);
	const pfMonthly =
		Number.isFinite(parsedPfMonthly) && parsedPfMonthly >= 0
			? parsedPfMonthly
			: 0;
	const result = calculate(ctcLakhs, pfMonthly, regime, expectedExemptions);
	const oldResult = result
		? calculate(ctcLakhs, pfMonthly, "old", expectedExemptions)
		: null;
	const newResult = result
		? calculate(ctcLakhs, pfMonthly, "new", expectedExemptions)
		: null;

	const showWarning = ctcLakhs > CTC_WARNING_THRESHOLD_LAKHS;

	return (
		<ToolPageShell
			title="In-hand Salary Calculator"
			description="Calculate your exact take-home salary from your CTC — instantly, privately."
			tag={
				<Badge
					variant="secondary"
					className="rounded-full px-3 py-1 text-xs font-semibold"
				>
					{FINANCIAL_YEAR}
				</Badge>
			}
			className="rise-in mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
			descriptionClassName="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground"
		>
			{/* Two-column layout */}
			<div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
				{/* Left: Input Panel */}
				<div className="lg:sticky lg:top-20">
					<InputPanel
						ctcInput={ctcInput}
						setCtcInput={setCtcInput}
						expectedExemptionsInput={expectedExemptionsInput}
						setExpectedExemptionsInput={setExpectedExemptionsInput}
						pfMonthly={pfMonthly}
						pfMonthlyInput={pfMonthlyInput}
						setPfMonthlyInput={setPfMonthlyInput}
						regime={regime}
						setRegime={setRegime}
						showWarning={showWarning}
					/>
				</div>

				{/* Right: Results Panel */}
				<ResultsPanel
					result={result}
					regime={regime}
					oldResult={oldResult}
					newResult={newResult}
				/>
			</div>
		</ToolPageShell>
	);
}

// ─── Input Panel ──────────────────────────────────────────────────────────────

interface InputPanelProps {
	ctcInput: string;
	setCtcInput: (v: string) => void;
	expectedExemptionsInput: string;
	setExpectedExemptionsInput: (v: string) => void;
	pfMonthly: number;
	pfMonthlyInput: string;
	setPfMonthlyInput: (v: string) => void;
	regime: TaxRegime;
	setRegime: (v: TaxRegime) => void;
	showWarning: boolean;
}

function InputPanel({
	ctcInput,
	setCtcInput,
	expectedExemptionsInput,
	setExpectedExemptionsInput,
	pfMonthly,
	pfMonthlyInput,
	setPfMonthlyInput,
	regime,
	setRegime,
	showWarning,
}: InputPanelProps) {
	const ctcLakhs = Number.parseFloat(ctcInput) || 0;
	const ctcRupees = ctcLakhs * 100000;
	const expectedExemptions = Number.parseFloat(expectedExemptionsInput) || 0;
	const stdDeduction =
		regime === "new"
			? NEW_REGIME_STANDARD_DEDUCTION
			: OLD_REGIME_STANDARD_DEDUCTION;

	return (
		<div className="island-shell rounded-2xl p-6">
			{/* Regime Toggle */}
			<div className="mb-4">
				<Label className="mb-2 block text-sm font-semibold text-foreground">
					Tax Regime
				</Label>
				<div
					className="relative flex rounded-xl p-1"
					style={{ background: "var(--mist)", border: "1px solid var(--line)" }}
				>
					{/* sliding pill */}
					<div
						className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-primary shadow-sm transition-all duration-200"
						style={{ left: regime === "new" ? "4px" : "calc(50%)" }}
					/>
					{(["new", "old"] as TaxRegime[]).map((r) => (
						<button
							key={r}
							type="button"
							onClick={() => setRegime(r)}
							className={cn(
								"relative z-10 flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200",
								regime === r
									? "text-white"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{r === "new" ? "New Regime" : "Old Regime"}
						</button>
					))}
				</div>
				<p className="mt-1.5 text-xs text-muted-foreground">
					{regime === "new"
						? "Default from FY 2024-25 · Lower rates, fewer deductions"
						: "Higher rates · Allows 80C, HRA, and other deductions"}
				</p>
			</div>

			<Separator className="mb-4" />

			{/* CTC Input */}
			<div className="mb-4">
				<Label
					htmlFor="ctc-input"
					className="mb-2 block text-sm font-semibold text-foreground"
				>
					Annual CTC (in Lakhs)
				</Label>
				<div className="relative">
					<Input
						id="ctc-input"
						type="number"
						min={0}
						step={0.5}
						placeholder="e.g. 12"
						value={ctcInput}
						onChange={(e) => setCtcInput(e.target.value)}
						className="pr-16 text-lg font-semibold"
					/>
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
						Lakhs
					</span>
				</div>
				{ctcLakhs > 0 && !showWarning && (
					<p className="mt-1.5 text-xs text-muted-foreground">
						= ₹{formatIndian(ctcRupees)} / year
					</p>
				)}
				{showWarning && (
					<p className="mt-1.5 text-xs font-medium text-amber-600">
						That's over ₹10 Crore — double-check the value
					</p>
				)}
			</div>

			{/* Expected Exemptions Input */}
			<div className="mb-4">
				<div className="mb-2 flex items-center">
					<Label
						htmlFor="expected-exemptions-input"
						className="text-sm font-semibold text-foreground"
					>
						<span className="flex items-center">
							Expected Exemptions (Annual)
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="ml-1 inline h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-foreground" />
								</TooltipTrigger>
								<TooltipContent className="max-w-64 text-pretty">
									80C / 80D / etc. Applied only in Old Regime (excluding
									employee PF and professional tax deductions already handled
									above).
								</TooltipContent>
							</Tooltip>
						</span>
					</Label>
				</div>
				<div className="relative">
					<Input
						id="expected-exemptions-input"
						type="number"
						min={0}
						step={1000}
						placeholder="e.g. 150000"
						value={expectedExemptionsInput}
						onChange={(e) => setExpectedExemptionsInput(e.target.value)}
						className="pr-12"
					/>
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
						/yr
					</span>
				</div>
			</div>

			{/* PF Slider */}
			<div className="mb-4">
				<div className="mb-2 flex items-center justify-between">
					<Label className="text-sm font-semibold text-foreground">
						<span className="flex items-center">
							Monthly PF Contribution
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="ml-1 inline h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-foreground" />
								</TooltipTrigger>
								<TooltipContent className="max-w-64 text-pretty">
									Enter employee PF amount. This input is not capped by the
									calculator UI; both employee + employer contributions are
									deducted from CTC.
								</TooltipContent>
							</Tooltip>
						</span>
					</Label>
					<div className="flex items-center gap-1">
						<span className="text-sm font-bold text-foreground">
							₹{formatIndian(pfMonthly)}
						</span>
						<span className="text-xs text-muted-foreground">/mo</span>
					</div>
				</div>
				<div className="relative">
					<Input
						id="pf-monthly-input"
						type="number"
						min={0}
						step={100}
						placeholder="e.g. 1800"
						value={pfMonthlyInput}
						onChange={(e) => {
							setPfMonthlyInput(e.target.value);
						}}
						className="pr-14"
					/>
					<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
						/mo
					</span>
				</div>
			</div>

			<Separator className="mb-4" />

			{/* Summary note */}
			<div className="space-y-1.5">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Applied Deductions
				</p>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						Standard deduction
					</span>
					<span className="text-sm font-semibold text-foreground">
						₹{formatIndian(stdDeduction)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						Professional tax
					</span>
					<span className="text-sm font-semibold text-foreground">
						₹2,400/yr
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">Education cess</span>
					<span className="text-sm font-semibold text-foreground">
						4% on tax
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">
						Expected exemptions
					</span>
					<span className="text-sm font-semibold text-foreground">
						{regime === "old"
							? `₹${formatIndian(expectedExemptions)}`
							: "Old regime only"}
					</span>
				</div>

				<Separator className="my-4" />

				<p className="text-[11px] leading-relaxed text-muted-foreground">
					These values are restored from local storage in your browser. We are
					not saving this data anywhere else.
				</p>
			</div>
		</div>
	);
}

// ─── Results Panel ────────────────────────────────────────────────────────────

interface ResultsPanelProps {
	result: CalculationResult | null;
	regime: TaxRegime;
	oldResult: CalculationResult | null;
	newResult: CalculationResult | null;
}

function ResultsPanel({
	result,
	regime,
	oldResult,
	newResult,
}: ResultsPanelProps) {
	if (!result) {
		return (
			<div className="flex min-h-100 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 py-20 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
					<Calculator className="h-8 w-8 text-primary" />
				</div>
				<div>
					<p className="text-base font-semibold text-foreground">
						Enter your CTC to get started
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Type your annual CTC in Lakhs on the left to see your exact
						take-home salary breakdown.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rise-in space-y-5">
			{/* Summary Cards */}
			<SummaryCards result={result} />

			{/* Rebate Banner */}
			{result.rebateApplied && (
				<div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
					<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
						✓
					</span>
					<p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
						Section 87A rebate applied — tax fully waived on your income
					</p>
				</div>
			)}

			{/* Breakdown Sections */}
			<BreakdownSections result={result} regime={regime} />

			{/* Regime Comparison */}
			{oldResult && newResult && (
				<RegimeComparison
					oldResult={oldResult}
					newResult={newResult}
					current={regime}
				/>
			)}
		</div>
	);
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ result }: { result: CalculationResult }) {
	return (
		<div className="grid gap-3 sm:grid-cols-3">
			{/* In-Hand — prominent, shown first */}
			<div
				className="relative overflow-hidden rounded-2xl p-4"
				style={{
					background:
						"linear-gradient(135deg, #312e81 0%, var(--indigo-deep) 45%, var(--indigo) 100%)",
					boxShadow:
						"0 1px 0 rgba(255,255,255,0.12) inset, 0 10px 28px rgba(79,70,229,0.35)",
				}}
			>
				{/* subtle top-right orb for depth */}
				<div
					className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-20"
					style={{
						background: "radial-gradient(circle, #a5b4fc, transparent 70%)",
					}}
				/>
				<p
					className="island-kicker mb-1.5 relative"
					style={{ color: "rgba(199,210,254,0.95)" }}
				>
					In-Hand Monthly
				</p>
				<p className="relative text-2xl font-bold text-white">
					{formatShort(result.inHandMonthly)}
					<span className="ml-1 text-sm font-semibold text-indigo-200">
						/mo
					</span>
				</p>
				<p className="relative mt-1 text-xs font-medium text-indigo-200">
					₹{formatIndian(result.inHandYearly)}/yr
				</p>
			</div>

			{/* Tax */}
			<div className="island-shell rounded-2xl p-4">
				<p className="mb-1.5 text-[0.69rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
					Income Tax
				</p>
				<p className="text-2xl font-bold text-rose-500">
					{formatShort(result.taxMonthly)}
					<span className="ml-1 text-sm font-semibold text-rose-400">/mo</span>
				</p>
				<p className="mt-1 text-xs font-medium text-muted-foreground">
					₹{formatIndian(result.totalTax)}/yr total
				</p>
			</div>

			{/* PF */}
			<div className="island-shell rounded-2xl p-4">
				<p className="mb-1.5 text-[0.69rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
					PF Deducted
				</p>
				<p className="text-2xl font-bold text-foreground">
					{formatShort(
						result.pfEmployeeYearly / 12 + result.pfEmployerYearly / 12,
					)}
					<span className="ml-1 text-sm font-semibold text-muted-foreground">
						/mo
					</span>
				</p>
				<p className="mt-1 text-xs font-medium text-muted-foreground">
					₹{formatIndian(result.totalPF)}/yr (emp + er)
				</p>
			</div>
		</div>
	);
}

// ─── Breakdown Sections ───────────────────────────────────────────────────────

function BreakdownSections({
	result,
	regime,
}: {
	result: CalculationResult;
	regime: TaxRegime;
}) {
	const [openSections, setOpenSections] = useState<Set<string>>(
		new Set(["taxable-income"]),
	);

	function toggle(id: string) {
		setOpenSections((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	const sections = [
		{
			id: "taxable-income",
			title: "Taxable Income",
			content: (
				<BreakdownTable
					rows={[
						{
							label: "Gross CTC",
							value: `₹${formatIndian(result.grossIncome)}`,
						},
						{
							label: `Standard Deduction (${regime === "new" ? "New" : "Old"} Regime)`,
							value: `− ₹${formatIndian(result.standardDeduction)}`,
							dim: true,
						},
						...(result.professionalTaxDeduction > 0
							? [
									{
										label: "Professional Tax Deduction (Sec 16)",
										value: `− ₹${formatIndian(result.professionalTaxDeduction)}`,
										dim: true,
									},
								]
							: []),
						...(result.employeePfTaxDeduction > 0
							? [
									{
										label: "Employee PF Tax Deduction",
										value: `− ₹${formatIndian(result.employeePfTaxDeduction)}`,
										dim: true,
									},
								]
							: []),
						...(regime === "old"
							? [
									{
										label: "Expected Exemptions (80C / 80D / etc)",
										value: `− ₹${formatIndian(result.exemptionsApplied)}`,
										dim: true,
									},
								]
							: []),
						{
							label: "Taxable Income",
							value: `₹${formatIndian(result.taxableIncome)}`,
							bold: true,
						},
					]}
				/>
			),
		},
		{
			id: "slab-breakdown",
			title: "Tax Slab Breakdown",
			content: (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-xs text-muted-foreground">
								<th className="pb-2 text-left font-semibold">Income Range</th>
								<th className="pb-2 text-right font-semibold">Rate</th>
								<th className="pb-2 text-right font-semibold">Taxable Amt</th>
								<th className="pb-2 text-right font-semibold">Tax</th>
							</tr>
						</thead>
						<tbody>
							{result.slabs.map((slab, i) => (
								<tr
									key={slab.label}
									className={cn(
										"border-b border-border/50",
										i === result.slabs.length - 1 && "border-0",
									)}
								>
									<td className="py-2 text-left text-foreground">
										{slab.label}
									</td>
									<td className="py-2 text-right text-muted-foreground">
										{(slab.rate * 100).toFixed(0)}%
									</td>
									<td className="py-2 text-right text-muted-foreground">
										₹{formatIndian(slab.taxableAmount)}
									</td>
									<td className="py-2 text-right font-medium text-foreground">
										{slab.tax > 0 ? `₹${formatIndian(slab.tax)}` : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			),
		},
		{
			id: "tax-computation",
			title: "Tax Computation",
			content: (
				<BreakdownTable
					rows={[
						{
							label: "Base Tax (from slabs)",
							value: `₹${formatIndian(result.baseTax)}`,
						},
						...(result.rebateAmount > 0
							? [
									{
										label: "Section 87A Rebate",
										value: `− ₹${formatIndian(result.rebateAmount)}`,
										dim: true,
									},
								]
							: []),
						{
							label: "Tax After Rebate",
							value: `₹${formatIndian(result.taxAfterRebate)}`,
							dim: true,
						},
						...(result.surcharge > 0
							? [
									{
										label: `Surcharge (${(result.surchargeRate * 100).toFixed(0)}%)`,
										value: `₹${formatIndian(result.surcharge)}`,
										dim: true,
									},
									...(result.marginalRelief > 0
										? [
												{
													label: "Marginal Relief",
													value: `− ₹${formatIndian(result.marginalRelief)}`,
													dim: true,
												},
											]
										: []),
								]
							: []),
						{
							label: "Education & Health Cess (4%)",
							value: `₹${formatIndian(result.educationCess)}`,
							dim: true,
						},
						{
							label: "Professional Tax",
							value: `₹${formatIndian(result.professionalTax)}`,
							dim: true,
						},
						{
							label: "Total Annual Tax",
							value: `₹${formatIndian(result.totalTax)}`,
							bold: true,
							accent: "rose",
						},
					]}
				/>
			),
		},
		{
			id: "pf-deduction",
			title: "PF Deduction",
			content: (
				<BreakdownTable
					rows={[
						{
							label: "Employee PF",
							value: `₹${formatIndian(result.pfEmployeeYearly)}/yr`,
						},
						{
							label: "Employer PF",
							value: `₹${formatIndian(result.pfEmployerYearly)}/yr`,
							dim: true,
						},
						{
							label: "Total PF Deducted from CTC",
							value: `₹${formatIndian(result.totalPF)}/yr`,
							bold: true,
						},
					]}
				/>
			),
		},
		{
			id: "inhand-calc",
			title: "In-Hand Calculation",
			content: (
				<BreakdownTable
					rows={[
						{
							label: "Gross CTC",
							value: `₹${formatIndian(result.grossIncome)}`,
						},
						{
							label: "Total Tax",
							value: `− ₹${formatIndian(result.totalTax)}`,
							dim: true,
						},
						{
							label: "Total PF (emp + employer)",
							value: `− ₹${formatIndian(result.totalPF)}`,
							dim: true,
						},
						{
							label: "In-Hand Yearly",
							value: `₹${formatIndian(result.inHandYearly)}`,
							bold: true,
							accent: "indigo",
						},
						{
							label: "In-Hand Monthly",
							value: `₹${formatIndian(result.inHandMonthly)}`,
							bold: true,
							accent: "indigo",
						},
					]}
				/>
			),
		},
	];

	return (
		<div className="island-shell divide-y divide-border overflow-hidden rounded-2xl">
			{sections.map((section) => {
				const isOpen = openSections.has(section.id);
				return (
					<Collapsible
						key={section.id}
						open={isOpen}
						onOpenChange={() => toggle(section.id)}
					>
						<CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/40">
							<span className="text-sm font-semibold text-foreground">
								{section.title}
							</span>
							<ChevronDown
								className={cn(
									"h-4 w-4 text-muted-foreground transition-transform duration-200",
									isOpen && "rotate-180",
								)}
							/>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="border-t border-border/50 bg-muted/20 px-5 py-4">
								{section.content}
							</div>
						</CollapsibleContent>
					</Collapsible>
				);
			})}
		</div>
	);
}

// ─── Breakdown Table ──────────────────────────────────────────────────────────

interface BreakdownRow {
	label: string;
	value: string;
	dim?: boolean;
	bold?: boolean;
	accent?: "rose" | "indigo";
}

function BreakdownTable({ rows }: { rows: BreakdownRow[] }) {
	return (
		<div className="space-y-2">
			{rows.map((row) => (
				<div
					key={row.label}
					className="flex items-center justify-between gap-4"
				>
					<span
						className={cn(
							"text-sm",
							row.dim ? "text-muted-foreground" : "text-foreground",
						)}
					>
						{row.label}
					</span>
					<span
						className={cn(
							"shrink-0 text-sm",
							row.bold ? "font-bold" : "font-medium",
							row.accent === "rose" && "text-rose-500",
							row.accent === "indigo" && "text-primary",
							!row.accent &&
								(row.dim ? "text-muted-foreground" : "text-foreground"),
						)}
					>
						{row.value}
					</span>
				</div>
			))}
		</div>
	);
}

// ─── Regime Comparison ────────────────────────────────────────────────────────

interface RegimeComparisonProps {
	oldResult: CalculationResult;
	newResult: CalculationResult;
	current: TaxRegime;
}

function RegimeComparison({
	oldResult,
	newResult,
	current,
}: RegimeComparisonProps) {
	const newBetter = newResult.inHandYearly >= oldResult.inHandYearly;
	const diff = Math.abs(newResult.inHandYearly - oldResult.inHandYearly);
	const betterLabel = newBetter ? "New Regime" : "Old Regime";
	const isCurrent =
		(newBetter && current === "new") || (!newBetter && current === "old");

	return (
		<div
			className="rounded-2xl border p-5"
			style={{
				background: newBetter
					? "linear-gradient(135deg, rgba(79,70,229,0.05) 0%, rgba(6,182,212,0.04) 100%)"
					: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(6,182,212,0.04) 100%)",
				borderColor: newBetter
					? "rgba(79,70,229,0.2)"
					: "rgba(16,185,129,0.25)",
			}}
		>
			<div className="mb-4 flex items-center justify-between">
				<p className="text-sm font-bold text-foreground">Regime Comparison</p>
				{isCurrent ? (
					<Badge
						variant="secondary"
						className="text-xs text-emerald-600 dark:text-emerald-400"
					>
						You're on the better regime
					</Badge>
				) : (
					<Badge variant="destructive" className="text-xs">
						Switch regime to save more
					</Badge>
				)}
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{[
					{ label: "New Regime", res: newResult, isWinner: newBetter },
					{ label: "Old Regime", res: oldResult, isWinner: !newBetter },
				].map(({ label, res, isWinner }) => (
					<div
						key={label}
						className={cn(
							"rounded-xl border p-4 transition-all",
							isWinner
								? "border-primary/30 bg-primary/5"
								: "border-border bg-muted/30",
						)}
					>
						<div className="mb-1 flex items-center justify-between">
							<span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
								{label}
							</span>
							{isWinner && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
							{!isWinner && (
								<TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
							)}
						</div>
						<p
							className={cn(
								"text-xl font-bold",
								isWinner ? "text-primary" : "text-muted-foreground",
							)}
						>
							₹{formatIndian(res.inHandMonthly)}/mo
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Tax: ₹{formatIndian(res.totalTax)}/yr
						</p>
					</div>
				))}
			</div>

			{diff > 0 && (
				<p className="mt-3 text-center text-sm text-muted-foreground">
					<span className="font-bold text-foreground">{betterLabel}</span> saves
					you{" "}
					<span className="font-bold text-foreground">
						₹{formatIndian(diff)}/yr
					</span>{" "}
					({formatShort(diff / 12)}/month more in-hand)
				</p>
			)}
		</div>
	);
}
