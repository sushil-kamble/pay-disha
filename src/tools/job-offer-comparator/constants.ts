import type {
	BenefitKey,
	CompareConfig,
	EmployerType,
	ScenarioKey,
} from "./types";

export const JOB_OFFER_COMPARATOR_STORAGE_KEY = "job-offer-comparator:v1:state";

export const MAX_OFFERS = 10;

export const DEFAULT_FINANCE_WEIGHT_PCT = 75;

export const DEFAULT_FIT_WEIGHT_PCT = 25;

export const BENEFIT_LABELS: Record<BenefitKey, string> = {
	healthSelf: "Health cover (self)",
	healthFamily: "Health cover (family)",
	meal: "Meal benefit",
	internet: "Internet/phone reimbursement",
	learning: "Learning budget",
	wellness: "Wellness allowance",
	transport: "Transport/cab support",
	childcare: "Childcare/family support",
};

export const EMPLOYER_TYPE_LABELS: Record<EmployerType, string> = {
	startup: "Startup",
	"late-stage": "Late-stage",
	mnc: "MNC",
	"global-tech": "Global Tech",
};

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
	conservative: "Conservative",
	expected: "Expected",
	upside: "Upside",
};

export const SCENARIO_CONFIG = {
	conservative: {
		bonusMultiplier: 0.72,
		equityMultiplier: 0.62,
		incrementMultiplier: 0.85,
		promotionDelayMonths: 6,
	},
	expected: {
		bonusMultiplier: 1,
		equityMultiplier: 1,
		incrementMultiplier: 1,
		promotionDelayMonths: 0,
	},
	upside: {
		bonusMultiplier: 1.15,
		equityMultiplier: 1.35,
		incrementMultiplier: 1.12,
		promotionDelayMonths: -6,
	},
} as const;

export const DEFAULT_COMPARE_CONFIG: CompareConfig = {
	scenario: "expected",
	includeQualitativeFit: false,
	financeWeightPct: DEFAULT_FINANCE_WEIGHT_PCT,
	fitWeightPct: DEFAULT_FIT_WEIGHT_PCT,
	showCurrentBaseline: false,
};

export const QUALITATIVE_LABELS = [
	{ key: "roleExcitement", label: "Role excitement" },
	{ key: "managerConfidence", label: "Manager confidence" },
	{ key: "workLifeSustainability", label: "Work-life sustainability" },
	{ key: "growthConfidence", label: "Growth confidence" },
	{ key: "brandValue", label: "Brand value" },
	{ key: "jobSecurity", label: "Job security" },
] as const;

export const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];
