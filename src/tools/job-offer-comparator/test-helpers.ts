import { DEFAULT_COMPARE_CONFIG } from "./constants";
import type {
	BenefitKey,
	BenefitSelection,
	BenefitSelections,
	CompareConfig,
	OfferInput,
	QualitativeInputs,
} from "./types";

type BenefitOverrides = Partial<Record<BenefitKey, Partial<BenefitSelection>>>;

export type OfferOverrides = Partial<
	Omit<OfferInput, "benefits" | "qualitative">
> & {
	benefits?: BenefitOverrides;
	qualitative?: Partial<QualitativeInputs>;
};

const DEFAULT_BENEFITS: BenefitSelections = {
	healthSelf: { enabled: false, monthlyValue: 1400 },
	healthFamily: { enabled: false, monthlyValue: 2000 },
	meal: { enabled: false, monthlyValue: 1800 },
	internet: { enabled: false, monthlyValue: 900 },
	learning: { enabled: false, monthlyValue: 1000 },
	wellness: { enabled: false, monthlyValue: 800 },
	transport: { enabled: false, monthlyValue: 1500 },
	childcare: { enabled: false, monthlyValue: 2200 },
};

const DEFAULT_QUALITATIVE: QualitativeInputs = {
	roleExcitement: 3,
	managerConfidence: 3,
	workLifeSustainability: 3,
	growthConfidence: 3,
	brandValue: 3,
	jobSecurity: 3,
};

function cloneBenefits(): BenefitSelections {
	return {
		healthSelf: { ...DEFAULT_BENEFITS.healthSelf },
		healthFamily: { ...DEFAULT_BENEFITS.healthFamily },
		meal: { ...DEFAULT_BENEFITS.meal },
		internet: { ...DEFAULT_BENEFITS.internet },
		learning: { ...DEFAULT_BENEFITS.learning },
		wellness: { ...DEFAULT_BENEFITS.wellness },
		transport: { ...DEFAULT_BENEFITS.transport },
		childcare: { ...DEFAULT_BENEFITS.childcare },
	};
}

function cloneQualitative(): QualitativeInputs {
	return { ...DEFAULT_QUALITATIVE };
}

export function createTestOffer(overrides: OfferOverrides = {}): OfferInput {
	const base: OfferInput = {
		id: "offer-a",
		label: "Offer A",
		companyName: "Company A",
		employerType: "mnc",
		city: "Bengaluru",
		workMode: "hybrid",
		fixedAnnualCash: 1200000,
		variableAnnualTarget: 0,
		joiningBonus: 0,
		retentionBonus: 0,
		relocationSupportOneTime: 0,
		equityType: "none",
		equityAnnualizedValue: 0,
		equityCliffMonths: 0,
		expectedBonusPayoutPct: 100,
		expectedAnnualIncrementPct: 0,
		nextIncrementMonth: 13,
		expectedPromotionMonths: 36,
		promotionUpliftPct: 0,
		pfMonthly: 0,
		taxRegime: "new",
		expensesMonthly: 0,
		noticeBuyoutRisk: 0,
		clawbackRisk: 0,
		benefits: cloneBenefits(),
		qualitative: cloneQualitative(),
	};

	const next: OfferInput = {
		...base,
		...overrides,
		benefits: cloneBenefits(),
		qualitative: cloneQualitative(),
	};

	if (overrides.benefits) {
		for (const [key, value] of Object.entries(overrides.benefits)) {
			next.benefits[key as BenefitKey] = {
				...next.benefits[key as BenefitKey],
				...value,
			};
		}
	}

	if (overrides.qualitative) {
		next.qualitative = {
			...next.qualitative,
			...overrides.qualitative,
		};
	}

	return next;
}

export function createTestConfig(
	overrides: Partial<CompareConfig> = {},
): CompareConfig {
	return {
		...DEFAULT_COMPARE_CONFIG,
		...overrides,
	};
}
