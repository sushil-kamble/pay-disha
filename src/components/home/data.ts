import type { LucideIcon } from "lucide-react";
import {
	ArrowLeftRight,
	Briefcase,
	Building2,
	Calculator,
	EyeOff,
	Flame,
	Home,
	PiggyBank,
	TrendingUp,
	UserX,
	Wallet,
} from "lucide-react";

export type Category = "all" | "salary" | "career" | "life" | "retirement";

export type ToolStatus = "live" | "coming-soon";

export type Tool = {
	id: string;
	name: string;
	desc: string;
	category: Exclude<Category, "all">;
	icon: LucideIcon;
	color: string;
	bg: string;
	status: ToolStatus;
	href: string | null;
};

export type TrustPillar = {
	icon: LucideIcon;
	iconColor: string;
	iconBg: string;
	heading: string;
	desc: string;
};

export const CATEGORIES: { id: Category; label: string }[] = [
	{ id: "all", label: "All Tools" },
	{ id: "salary", label: "Salary & Tax" },
	{ id: "career", label: "Career" },
	{ id: "life", label: "Life Decisions" },
	{ id: "retirement", label: "Retirement" },
];

export const TOOLS: Tool[] = [
	{
		id: "inhand-salary",
		name: "In-Hand Salary Calculator",
		desc: "Convert your CTC to exact monthly take-home in seconds",
		category: "salary",
		icon: Calculator,
		color: "text-primary",
		bg: "bg-primary/10",
		status: "live",
		href: "/tools/inhand-salary",
	},
	{
		id: "tax-regime",
		name: "Tax Regime Comparison",
		desc: "Old vs New regime — see exactly which one saves you more",
		category: "salary",
		icon: ArrowLeftRight,
		color: "text-[#06b6d4]",
		bg: "bg-[#06b6d4]/10",
		status: "live",
		href: "/tools/tax-regime",
	},
	{
		id: "hra",
		name: "HRA Exemption Calculator",
		desc: "Calculate your exact HRA exemption and the tax you save",
		category: "salary",
		icon: Building2,
		color: "text-[#8b5cf6]",
		bg: "bg-[#8b5cf6]/10",
		status: "coming-soon",
		href: null,
	},
	{
		id: "salary-growth",
		name: "Salary Growth Calculator",
		desc: "Project your earnings and wealth over 5, 10, or 20 years",
		category: "career",
		icon: TrendingUp,
		color: "text-[#10b981]",
		bg: "bg-[#10b981]/10",
		status: "live",
		href: "/tools/salary-growth",
	},
	{
		id: "offer-compare",
		name: "Job Offer Comparator",
		desc: "Compare job offers across cash, growth, risk, and lifestyle fit",
		category: "career",
		icon: Briefcase,
		color: "text-[#f97316]",
		bg: "bg-[#f97316]/10",
		status: "live",
		href: "/tools/job-offer-comparator",
	},
	{
		id: "buy-vs-rent",
		name: "Buy vs Rent Calculator",
		desc: "Is it smarter to buy a home or keep renting? Find out",
		category: "life",
		icon: Home,
		color: "text-[#ec4899]",
		bg: "bg-[#ec4899]/10",
		status: "live",
		href: "/tools/buy-vs-rent",
	},
	{
		id: "fire",
		name: "FIRE Number Calculator",
		desc: "How much do you need to retire early? Calculate your number",
		category: "retirement",
		icon: Flame,
		color: "text-[#ef4444]",
		bg: "bg-[#ef4444]/10",
		status: "live",
		href: "/tools/fire",
	},
	{
		id: "pf-maturity",
		name: "PF Maturity Calculator",
		desc: "Estimate your EPF corpus at retirement with projected returns",
		category: "retirement",
		icon: PiggyBank,
		color: "text-[#f59e0b]",
		bg: "bg-[#f59e0b]/10",
		status: "coming-soon",
		href: null,
	},
];

export const TRUST_PILLARS: TrustPillar[] = [
	{
		icon: Wallet,
		iconColor: "text-[#10b981]",
		iconBg: "bg-[#10b981]/10",
		heading: "Free, forever",
		desc: "Every tool on PayDisha is free to use. No subscriptions, no paywalls, no hidden premium tier.",
	},
	{
		icon: UserX,
		iconColor: "text-primary",
		iconBg: "bg-primary/10",
		heading: "No account needed",
		desc: "Open any tool and start immediately. No sign-up, no email, no password. Just you and the numbers.",
	},
	{
		icon: EyeOff,
		iconColor: "text-[#06b6d4]",
		iconBg: "bg-[#06b6d4]/10",
		heading: "Zero tracking",
		desc: "All calculations run entirely in your browser. We collect nothing — no usage data, no analytics, no cookies.",
	},
];
