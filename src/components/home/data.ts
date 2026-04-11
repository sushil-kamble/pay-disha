import type { LucideIcon } from "lucide-react";
import {
	Briefcase,
	Calculator,
	EyeOff,
	Flame,
	Home,
	Target,
	TrendingUp,
	UserX,
	Wallet,
} from "lucide-react";

import { SITE_NAME } from "#/lib/site";

export type Category = "all" | "salary" | "career" | "life" | "retirement";

export type ToolStatus = "live" | "cooking";

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
		name: "In-hand Salary Calculator",
		desc: "Convert your CTC to exact monthly take-home in seconds",
		category: "salary",
		icon: Calculator,
		color: "text-primary",
		bg: "bg-primary/10",
		status: "live",
		href: "/tools/inhand-salary",
	},
	{
		id: "salary-growth",
		name: "Salary Growth Calculator",
		desc: "Project your earnings and wealth over 5, 10, or 20 years",
		category: "career",
		icon: TrendingUp,
		color: "text-[#10b981]",
		bg: "bg-[#10b981]/10",
		status: "cooking",
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
		status: "cooking",
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
		status: "cooking",
		href: "/tools/fire",
	},
	{
		id: "sip-calculator",
		name: "SIP Future Value Calculator",
		desc: "See what your SIP can become, what gap remains, and how to close it",
		category: "retirement",
		icon: Target,
		color: "text-[#0f766e]",
		bg: "bg-[#0f766e]/10",
		status: "cooking",
		href: "/tools/sip-calculator",
	},
];

export const TRUST_PILLARS: TrustPillar[] = [
	{
		icon: Wallet,
		iconColor: "text-[#10b981]",
		iconBg: "bg-[#10b981]/10",
		heading: "Free, forever",
		desc: `Every tool on ${SITE_NAME} is free to use. No subscriptions, no paywalls, no hidden premium tier.`,
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
