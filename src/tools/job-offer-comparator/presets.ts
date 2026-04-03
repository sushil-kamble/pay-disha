import type {
	BenefitSelections,
	EmployerType,
	OfferInput,
	QualitativeInputs,
} from "./types";

function createDefaultBenefits(): BenefitSelections {
	return {
		healthSelf: { enabled: false, monthlyValue: 1400 },
		healthFamily: { enabled: false, monthlyValue: 2000 },
		meal: { enabled: false, monthlyValue: 1800 },
		internet: { enabled: false, monthlyValue: 900 },
		learning: { enabled: false, monthlyValue: 1000 },
		wellness: { enabled: false, monthlyValue: 800 },
		transport: { enabled: false, monthlyValue: 1500 },
		childcare: { enabled: false, monthlyValue: 2200 },
	};
}

function createDefaultQualitative(): QualitativeInputs {
	return {
		roleExcitement: 3,
		managerConfidence: 3,
		workLifeSustainability: 3,
		growthConfidence: 3,
		brandValue: 3,
		jobSecurity: 3,
	};
}

export const archetypeDefaults: Record<
	EmployerType,
	Pick<
		OfferInput,
		| "expectedBonusPayoutPct"
		| "expectedAnnualIncrementPct"
		| "expectedPromotionMonths"
		| "promotionUpliftPct"
		| "equityCliffMonths"
	>
> = {
	startup: {
		expectedBonusPayoutPct: 75,
		expectedAnnualIncrementPct: 18,
		expectedPromotionMonths: 20,
		promotionUpliftPct: 18,
		equityCliffMonths: 12,
	},
	"late-stage": {
		expectedBonusPayoutPct: 85,
		expectedAnnualIncrementPct: 14,
		expectedPromotionMonths: 24,
		promotionUpliftPct: 15,
		equityCliffMonths: 12,
	},
	mnc: {
		expectedBonusPayoutPct: 90,
		expectedAnnualIncrementPct: 10,
		expectedPromotionMonths: 30,
		promotionUpliftPct: 12,
		equityCliffMonths: 0,
	},
	"global-tech": {
		expectedBonusPayoutPct: 95,
		expectedAnnualIncrementPct: 12,
		expectedPromotionMonths: 24,
		promotionUpliftPct: 14,
		equityCliffMonths: 12,
	},
};

function makeOffer(id: string, label: string, companyName: string): OfferInput {
	return {
		id,
		label,
		companyName,
		employerType: "mnc",
		city: "Bengaluru",
		workMode: "hybrid",
		fixedAnnualCash: 2100000,
		variableAnnualTarget: 240000,
		joiningBonus: 150000,
		retentionBonus: 0,
		relocationSupportOneTime: 0,
		equityType: "none",
		equityAnnualizedValue: 0,
		equityCliffMonths: 0,
		expectedBonusPayoutPct: 90,
		expectedAnnualIncrementPct: 10,
		nextIncrementMonth: 4,
		expectedPromotionMonths: 30,
		promotionUpliftPct: 12,
		pfMonthly: 1800,
		taxRegime: "new",
		expensesMonthly: 0,
		noticeBuyoutRisk: 0,
		clawbackRisk: 0,
		benefits: createDefaultBenefits(),
		qualitative: createDefaultQualitative(),
	};
}

export function createDefaultOffers(): OfferInput[] {
	return [
		makeOffer("offer-1", "Offer A", "Current shortlist A"),
		makeOffer("offer-2", "Offer B", "Current shortlist B"),
	];
}

export function createDefaultBaselineOffer(): OfferInput {
	const offer = makeOffer(
		"baseline-current",
		"Current Role",
		"Current company",
	);
	return {
		...offer,
		joiningBonus: 0,
		retentionBonus: 0,
		relocationSupportOneTime: 0,
		noticeBuyoutRisk: 0,
		clawbackRisk: 0,
	};
}

export function applyEmployerPreset(
	offer: OfferInput,
	employerType: EmployerType,
): OfferInput {
	const defaults = archetypeDefaults[employerType];
	return {
		...offer,
		employerType,
		expectedBonusPayoutPct: defaults.expectedBonusPayoutPct,
		expectedAnnualIncrementPct: defaults.expectedAnnualIncrementPct,
		expectedPromotionMonths: defaults.expectedPromotionMonths,
		promotionUpliftPct: defaults.promotionUpliftPct,
		equityCliffMonths: defaults.equityCliffMonths,
	};
}
