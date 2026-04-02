import type { FireInputs, FireInsight, LeverScenario } from "./types";

function fmt(value: number): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 10000000) return `${sign}\u20B9${(abs / 10000000).toFixed(2)} Cr`;
	if (abs >= 100000) return `${sign}\u20B9${(abs / 100000).toFixed(1)} L`;
	if (abs >= 1000) return `${sign}\u20B9${(abs / 1000).toFixed(1)}K`;
	return `${sign}\u20B9${Math.round(abs)}`;
}

function fmtMonthly(value: number): string {
	return `\u20B9${Math.round(value).toLocaleString("en-IN")}/mo`;
}

function calculateAnnualExpenses(inputs: FireInputs, years: number) {
	const generalMonthly = Math.max(
		0,
		inputs.monthlyExpenses - inputs.monthlyHealthcareBudget,
	);
	const futureGeneral =
		generalMonthly * 12 * (1 + inputs.inflationPct / 100) ** years;
	const futureHealthcare =
		inputs.monthlyHealthcareBudget *
		12 *
		(1 + inputs.healthcareInflationPct / 100) ** years;
	return futureGeneral + futureHealthcare;
}

function computeFireNumber(inputs: FireInputs): number {
	const years = inputs.targetRetirementAge - inputs.currentAge;
	return calculateAnnualExpenses(inputs, years) / (inputs.swrPct / 100);
}

function solveYears(inputs: FireInputs): number | null {
	const currentTarget =
		calculateAnnualExpenses(inputs, 0) / (inputs.swrPct / 100);
	if (inputs.existingSavings >= currentTarget) return 0;
	if (inputs.monthlySip <= 0) return null;

	const monthlyRate = inputs.expectedReturnPct / 100 / 12;
	let corpus = inputs.existingSavings;

	for (let month = 1; month <= 600; month++) {
		corpus = corpus * (1 + monthlyRate) + inputs.monthlySip;
		const target =
			calculateAnnualExpenses(inputs, month / 12) / (inputs.swrPct / 100);
		if (corpus >= target) return Math.ceil((month / 12) * 10) / 10;
	}

	return null;
}

const LEVER_TWEAKS: Array<{
	id: string;
	label: string;
	modify: (inputs: FireInputs) => FireInputs;
}> = [
	{
		id: "cut-expenses",
		label: "Cut expenses by 10%",
		modify: (inputs) => ({
			...inputs,
			monthlyExpenses: Math.round(inputs.monthlyExpenses * 0.9),
		}),
	},
	{
		id: "increase-sip",
		label: "Increase SIP by \u20B910,000/mo",
		modify: (inputs) => ({
			...inputs,
			monthlySip: inputs.monthlySip + 10000,
		}),
	},
	{
		id: "retire-later",
		label: "Retire 3 years later",
		modify: (inputs) => ({
			...inputs,
			targetRetirementAge: inputs.targetRetirementAge + 3,
		}),
	},
	{
		id: "higher-returns",
		label: "Earn 2% higher returns",
		modify: (inputs) => ({
			...inputs,
			expectedReturnPct: inputs.expectedReturnPct + 2,
		}),
	},
	{
		id: "lean-lifestyle",
		label: "Switch to Lean FIRE lifestyle",
		modify: (inputs) => ({
			...inputs,
			monthlyExpenses: Math.round(inputs.monthlyExpenses * 0.7),
		}),
	},
];

export function buildFireInsights(data: {
	inputs: FireInputs;
	fireNumber: number;
	futureAnnualExpenses: number;
	yearsToFire: number | null;
	fireAge: number | null;
	coastFireNumber: number;
	projectedCorpus: number;
	epfCorpusAtRetirement: number;
	shortfall: number;
}): FireInsight[] {
	const {
		inputs,
		fireNumber,
		futureAnnualExpenses,
		yearsToFire,
		fireAge,
		coastFireNumber,
		projectedCorpus,
		epfCorpusAtRetirement,
		shortfall,
	} = data;

	const insights: FireInsight[] = [];
	const yearsToRetirement = inputs.targetRetirementAge - inputs.currentAge;

	// 1. The headline
	insights.push({
		id: "headline",
		title: "Your FIRE Number",
		value: fmt(fireNumber),
		description: `You need ${fmt(fireNumber)} to retire at age ${inputs.targetRetirementAge} and sustain your lifestyle forever.`,
		tone: "neutral",
	});

	// 2. Timeline
	if (yearsToFire !== null && fireAge !== null) {
		const onTrack = fireAge <= inputs.targetRetirementAge;
		insights.push({
			id: "timeline",
			title: onTrack ? "You're on track" : "Timeline gap",
			value: onTrack ? `Age ${fireAge}` : `${Math.round(yearsToFire)} years`,
			description: onTrack
				? `At your current savings rate, you could hit FIRE by age ${fireAge} — ${inputs.targetRetirementAge - fireAge} years earlier than your target!`
				: `At your current pace, you'll reach FIRE in ${Math.round(yearsToFire)} years (age ${fireAge}). That's ${fireAge - inputs.targetRetirementAge} years past your target — but the levers below can close this gap.`,
			tone: onTrack ? "positive" : "caution",
		});
	} else {
		insights.push({
			id: "timeline",
			title: "Not yet reachable",
			value: "Adjust inputs",
			description:
				"At your current savings rate, FIRE isn't reachable within 50 years. But small changes below can make a huge difference.",
			tone: "caution",
		});
	}

	// 3. Corpus at your target age
	insights.push({
		id: "retirement-gap",
		title: shortfall > 0 ? "Target-age gap" : "Target-age buffer",
		value: fmt(projectedCorpus),
		description:
			shortfall > 0
				? `At age ${inputs.targetRetirementAge}, your liquid corpus reaches ${fmt(projectedCorpus)}. That still leaves a ${fmt(shortfall)} gap versus your FIRE target.`
				: `At age ${inputs.targetRetirementAge}, your liquid corpus reaches ${fmt(projectedCorpus)}. That is ${fmt(Math.abs(shortfall))} above your FIRE target.`,
		tone: shortfall > 0 ? "caution" : "positive",
	});

	// 4. Inflation shock
	const currentAnnual = inputs.monthlyExpenses * 12;
	const inflationAdded = futureAnnualExpenses - currentAnnual;
	if (inflationAdded > 0) {
		insights.push({
			id: "inflation-shock",
			title: "The inflation tax",
			value: fmt(inflationAdded * (1 / (inputs.swrPct / 100))),
			description: `Your ${fmtMonthly(inputs.monthlyExpenses)} expenses become ${fmtMonthly(futureAnnualExpenses / 12)} by age ${inputs.targetRetirementAge}. Inflation alone adds ${fmt(inflationAdded * (1 / (inputs.swrPct / 100)))} to your FIRE number.`,
			tone: "surprise",
		});
	}

	// 5. Healthcare warning
	if (inputs.monthlyHealthcareBudget > 0) {
		const futureHealthcareAnnual =
			inputs.monthlyHealthcareBudget *
			12 *
			(1 + inputs.healthcareInflationPct / 100) ** yearsToRetirement;
		const healthcarePct = (futureHealthcareAnnual / futureAnnualExpenses) * 100;
		if (healthcarePct > 15) {
			insights.push({
				id: "healthcare-warning",
				title: "Healthcare creep",
				value: `${Math.round(healthcarePct)}% of expenses`,
				description: `Healthcare alone will cost ${fmtMonthly(futureHealthcareAnnual / 12)} by retirement — that's ${Math.round(healthcarePct)}% of your total expenses, up from ${Math.round(((inputs.monthlyHealthcareBudget * 12) / currentAnnual) * 100)}% today.`,
				tone: "caution",
			});
		}
	}

	// 6. Coast FIRE
	const coastPct = (inputs.existingSavings / coastFireNumber) * 100;
	if (coastPct >= 30) {
		insights.push({
			id: "coast-fire",
			title: "Coast FIRE progress",
			value: `${Math.round(coastPct)}% there`,
			description:
				coastPct >= 100
					? `You already have more than the ${fmt(coastFireNumber)} needed for Coast FIRE! You could stop saving aggressively and let compounding do the rest.`
					: `You need ${fmt(coastFireNumber)} to Coast FIRE. You're ${Math.round(coastPct)}% of the way — closer than you think.`,
			tone: coastPct >= 100 ? "positive" : "neutral",
		});
	}

	// 7. SIP power
	if (inputs.monthlySip > 0) {
		const monthlyRate = inputs.expectedReturnPct / 100 / 12;
		const months = yearsToRetirement * 12;
		const sipFv =
			inputs.monthlySip *
			(((1 + monthlyRate) ** months - 1) / monthlyRate) *
			(1 + monthlyRate);
		insights.push({
			id: "sip-power",
			title: "SIP compounding power",
			value: fmt(sipFv),
			description: `Your ${fmtMonthly(inputs.monthlySip)} SIP alone will grow to ${fmt(sipFv)} over ${yearsToRetirement} years at ${inputs.expectedReturnPct}% returns. That's the magic of compounding.`,
			tone: "positive",
		});
	}

	// 8. EPF hidden wealth
	if (epfCorpusAtRetirement > 0) {
		const monthsCovered = epfCorpusAtRetirement / (futureAnnualExpenses / 12);
		insights.push({
			id: "epf-wealth",
			title: "EPF hidden wealth",
			value: fmt(epfCorpusAtRetirement),
			description: `Your EPF will quietly build to ${fmt(epfCorpusAtRetirement)} by retirement — enough to cover ${Math.round(monthsCovered)} months of expenses.`,
			tone: "surprise",
		});
	}

	// 9. Expense multiplier shock
	const perTenKCost =
		(10000 * 12 * (1 + inputs.inflationPct / 100) ** yearsToRetirement) /
		(inputs.swrPct / 100);
	insights.push({
		id: "expense-multiplier",
		title: "The cost of lifestyle",
		value: fmt(perTenKCost),
		description: `Every additional \u20B910,000/month in spending adds ${fmt(perTenKCost)} to your FIRE number. Small expenses cast long shadows.`,
		tone: "surprise",
	});

	return insights;
}

export function buildLeverScenarios(
	inputs: FireInputs,
	baseYearsToFire: number | null,
): LeverScenario[] {
	if (baseYearsToFire === null) {
		const scenarios: LeverScenario[] = [];

		for (const tweak of LEVER_TWEAKS) {
			const modified = tweak.modify(inputs);
			const newFireNumber = computeFireNumber(modified);
			const newYears = solveYears(modified);

			scenarios.push({
				id: tweak.id,
				label: tweak.label,
				description:
					newYears !== null
						? `Makes FIRE reachable in ${Math.round(newYears)} years`
						: "Helps, but more changes needed",
				originalYearsToFire: 0,
				newYearsToFire: newYears,
				yearsSaved: null,
				newFireNumber: Math.round(newFireNumber),
				impact: newYears !== null ? "high" : "low",
			});
		}
		return scenarios;
	}

	const scenarios: LeverScenario[] = [];

	for (const tweak of LEVER_TWEAKS) {
		const modified = tweak.modify(inputs);
		const newFireNumber = computeFireNumber(modified);
		const newYears = solveYears(modified);

		const yearsSaved =
			newYears !== null
				? Math.round((baseYearsToFire - newYears) * 10) / 10
				: null;
		const impact =
			yearsSaved !== null && yearsSaved >= 3
				? "high"
				: yearsSaved !== null && yearsSaved >= 1
					? "medium"
					: "low";

		scenarios.push({
			id: tweak.id,
			label: tweak.label,
			description:
				yearsSaved !== null && yearsSaved > 0
					? `Retire ${Math.round(yearsSaved)} years earlier`
					: newYears !== null
						? "Minimal impact on timeline"
						: "Helps, but not enough alone",
			originalYearsToFire: baseYearsToFire,
			newYearsToFire: newYears,
			yearsSaved,
			newFireNumber: Math.round(newFireNumber),
			impact,
		});
	}

	return scenarios.sort((a, b) => {
		const order = { high: 0, medium: 1, low: 2 };
		return order[a.impact] - order[b.impact];
	});
}
