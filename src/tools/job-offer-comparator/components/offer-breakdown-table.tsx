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
	{ key: "annualEmployerRetirement", label: "Employer PF / retirement value" },
	{ key: "annualBenefitValue", label: "Benefits you value" },
	{ key: "annualWorkCost", label: "Location/work-mode costs" },
	{ key: "firstYearRealizedValue", label: "Year-1 realized value" },
	{ key: "value24Months", label: "24-month value" },
	{ key: "value36Months", label: "36-month value" },
	{ key: "riskAdjustedValue", label: "Risk-adjusted value" },
];

export function OfferBreakdownTable({ offers }: OfferBreakdownTableProps) {
	return (
		<div className="overflow-x-auto rounded-xl border border-border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="min-w-44">Component</TableHead>
						{offers.map((offer) => (
							<TableHead key={offer.offer.id} className="min-w-36 text-right">
								{offer.offer.label}
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
	);
}
