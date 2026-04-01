import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { useState } from "react";

import { CATEGORIES, type Category, TOOLS, type Tool } from "./data";

export function ToolsSection() {
	const [active, setActive] = useState<Category>("all");

	const filtered =
		active === "all" ? TOOLS : TOOLS.filter((tool) => tool.category === active);
	const liveCount = filtered.filter((tool) => tool.status === "live").length;

	return (
		<section id="tools" className="py-24">
			<div className="page-wrap">
				<div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="island-kicker mb-2">The Toolbox</p>
						<h2 className="display-title text-4xl font-bold text-foreground md:text-5xl">
							Pick your tool
						</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						{filtered.length} tool{filtered.length !== 1 ? "s" : ""} &middot;{" "}
						<span className="font-medium text-[#10b981]">
							{liveCount} live now
						</span>
					</p>
				</div>

				<div className="mb-8 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
					{CATEGORIES.map((category) => (
						<button
							key={category.id}
							type="button"
							onClick={() => setActive(category.id)}
							className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-180 ${
								active === category.id
									? "bg-primary text-white"
									: "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
							}`}
						>
							{category.label}
						</button>
					))}
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{filtered.map((tool) => (
						<ToolCard key={tool.id} tool={tool} />
					))}
				</div>
			</div>
		</section>
	);
}

function ToolCard({ tool }: { tool: Tool }) {
	const isLive = tool.status === "live";
	const categoryLabel =
		CATEGORIES.find((category) => category.id === tool.category)?.label ??
		tool.category;

	const inner = (
		<div
			className={`feature-card group relative flex h-full flex-col rounded-2xl border border-border p-5 ${
				isLive ? "cursor-pointer" : "cursor-default opacity-60"
			}`}
		>
			{!isLive && (
				<span className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
					<Lock className="h-2.5 w-2.5" />
					Soon
				</span>
			)}

			<div
				className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${tool.bg}`}
			>
				<tool.icon
					className={`h-5 w-5 ${isLive ? tool.color : "text-muted-foreground"}`}
				/>
			</div>

			<p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
				{categoryLabel}
			</p>
			<h3 className="mb-1.5 font-semibold leading-snug text-foreground">
				{tool.name}
			</h3>
			<p className="flex-1 text-sm leading-relaxed text-muted-foreground">
				{tool.desc}
			</p>

			<div className="mt-4 flex items-center gap-1 text-sm font-semibold">
				{isLive ? (
					<>
						<span className="text-primary">Open tool</span>
						<ArrowRight className="h-3.5 w-3.5 text-primary transition-transform duration-180 group-hover:translate-x-0.5" />
					</>
				) : (
					<span className="text-muted-foreground">Coming soon</span>
				)}
			</div>
		</div>
	);

	return isLive ? (
		<Link to={tool.href ?? "#"} className="h-full">
			{inner}
		</Link>
	) : (
		<div className="h-full">{inner}</div>
	);
}
