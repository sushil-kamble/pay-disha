import { ArrowRight } from "lucide-react";

export function CTABanner() {
	return (
		<section
			className="relative overflow-hidden py-20"
			style={{
				background:
					"linear-gradient(135deg, var(--indigo-deep) 0%, var(--indigo) 55%, #6366f1 100%)",
			}}
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 65% 70% at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 70%)",
				}}
			/>
			<div className="page-wrap relative text-center">
				<p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-white/55">
					Start now — no account needed
				</p>
				<h2 className="display-title mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
					Start with any tool. Always free.
				</h2>
				<p className="mx-auto mb-8 max-w-md text-lg text-white/65">
					No spreadsheets. No CA required. Open a tool, get the number you need,
					and move on with your day.
				</p>
				<a
					href="#tools"
					className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold shadow-xl transition-all duration-180 hover:-translate-y-0.5 hover:opacity-95"
					style={{ color: "var(--indigo-deep)" }}
				>
					Browse all tools
					<ArrowRight className="h-4 w-4" />
				</a>
			</div>
		</section>
	);
}
