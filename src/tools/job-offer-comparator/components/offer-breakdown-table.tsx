import { TableProperties } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { formatCompactCurrency } from "../format";
import type { OfferComputed } from "../types";

interface OfferBreakdownTableProps {
	offers: OfferComputed[];
}

const ROWS: Array<{ key: string; label: string }> = [
	{ key: "annualGuaranteedCash", label: "Guaranteed annual cash" },
	{ key: "expectedVariableAnnualCash", label: "Expected variable cash" },
	{ key: "firstYearEquityValue", label: "Equity value (year 1)" },
	{ key: "annualBenefitValue", label: "Benefits you value" },
	{ key: "annualExpenses", label: "Expenses (annual)" },
	{ key: "firstYearOneTimeUpside", label: "One-time upside (year 1)" },
	{
		key: "firstYearRiskDeductions",
		label: "One-time risk deductions (year 1)",
	},
	{ key: "firstYearRealizedValue", label: "Year-1 realized value" },
	{ key: "value24Months", label: "24-month value" },
	{ key: "value36Months", label: "36-month value" },
	{ key: "riskAdjustedValue", label: "Risk-adjusted value" },
];

export function OfferBreakdownTable({ offers }: OfferBreakdownTableProps) {
	return (
		<div className="rounded-2xl border border-border bg-card p-4">
			<div className="mb-3 flex items-center gap-2">
				<TableProperties className="h-4 w-4 text-primary" />
				<p className="text-sm font-semibold text-foreground">Full breakdown</p>
			</div>
			<div className="overflow-x-auto rounded-xl border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="min-w-44">Component</TableHead>
							{offers.map((offer) => (
								<TableHead key={offer.offer.id} className="min-w-36 text-right">
									{offer.offer.companyName || "Unnamed"}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{ROWS.map((row) => (
							<TableRow key={row.key}>
								<TableCell className="text-xs font-medium text-muted-foreground">
									{row.label}
								</TableCell>
								{offers.map((offer) => (
									<TableCell
										key={`${offer.offer.id}-${row.key}`}
										className="text-right text-sm font-semibold tabular-nums"
									>
										{formatCompactCurrency(
											offer[row.key as keyof OfferComputed] as number,
										)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
