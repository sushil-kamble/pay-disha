export type TaxRegime = "new" | "old";

export type ScenarioKey = "conservative" | "expected" | "upside";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type EmployerType = "startup" | "late-stage" | "mnc" | "global-tech";

export type EquityType = "none" | "rsu" | "esop";

export type BenefitKey =
	| "healthSelf"
	| "healthFamily"
	| "meal"
	| "internet"
	| "learning"
	| "wellness"
	| "transport"
	| "childcare";

export interface BenefitSelection {
	enabled: boolean;
	monthlyValue: number;
}

export type BenefitSelections = Record<BenefitKey, BenefitSelection>;

export interface QualitativeInputs {
	roleExcitement: number;
	managerConfidence: number;
	workLifeSustainability: number;
	growthConfidence: number;
	brandValue: number;
	jobSecurity: number;
}

export interface OfferInput {
	id: string;
	label: string;
	companyName: string;
	employerType: EmployerType;
	city: string;
	workMode: WorkMode;
	fixedAnnualCash: number;
	variableAnnualTarget: number;
	joiningBonus: number;
	retentionBonus: number;
	relocationSupportOneTime: number;
	equityType: EquityType;
	equityAnnualizedValue: number;
	equityCliffMonths: number;
	expectedBonusPayoutPct: number;
	expectedAnnualIncrementPct: number;
	nextIncrementMonth: number;
	expectedPromotionMonths: number;
	promotionUpliftPct: number;
	pfMonthly: number;
	taxRegime: TaxRegime;
	commuteMonthlyCost: number;
	rentDeltaMonthlyCost: number;
	remoteSetupMonthlyCost: number;
	noticeBuyoutRisk: number;
	clawbackRisk: number;
	benefits: BenefitSelections;
	qualitative: QualitativeInputs;
}

export interface CompareConfig {
	scenario: ScenarioKey;
	includeQualitativeFit: boolean;
	financeWeightPct: number;
	fitWeightPct: number;
	showCurrentBaseline: boolean;
}

export interface YearValue {
	year: number;
	value: number;
}

export interface OfferComputed {
	offer: OfferInput;
	annualGuaranteedCash: number;
	expectedVariableAnnualCash: number;
	annualEmployerRetirement: number;
	annualWorkCost: number;
	annualBenefitValue: number;
	monthlyTakeHome: number;
	firstYearRealizedValue: number;
	steadyStateAnnualValue: number;
	value24Months: number;
	value36Months: number;
	downside12Months: number;
	upside36Months: number;
	riskAdjustedValue: number;
	financeScore: number;
	fitScore: number;
	blendedScore: number;
	insights: string[];
	projection: YearValue[];
}

export interface LensWinner {
	offerId: string;
	label: string;
	value: number;
}

export interface ComparisonLensWinners {
	bestCashNow: LensWinner;
	bestLongTerm: LensWinner;
	bestRiskAdjusted: LensWinner;
	bestOverall: LensWinner | null;
}

export interface ComparisonResult {
	offers: OfferComputed[];
	winners: ComparisonLensWinners;
	chartRows: Array<{
		year: string;
		[key: string]: string | number;
	}>;
	narrative: string[];
}

export interface PersistedJobOfferComparatorState {
	offers: OfferInput[];
	config: CompareConfig;
	baselineOffer: OfferInput | null;
	advancedOpenByOfferId: Record<string, boolean>;
}
