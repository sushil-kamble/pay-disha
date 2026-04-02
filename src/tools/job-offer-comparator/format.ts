import { MONTH_NAMES } from "./constants";

export function formatIndianCurrency(value: number) {
	return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatCompactCurrency(value: number) {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
	if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
	if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
	return `${sign}₹${Math.round(abs)}`;
}

export function formatPercent(value: number) {
	return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function formatMonthLabel(month: number) {
	if (month < 1 || month > 12) return "Unknown";
	return MONTH_NAMES[month - 1] ?? "Unknown";
}
