import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { SiteFooter, SiteNav } from "#/components/home";
import { cn } from "#/lib/utils";

type ToolPageHeaderProps = {
	title: string;
	description?: string;
	tag?: ReactNode;
	backHref?: string;
	backLabel?: string;
	className?: string;
	backLinkClassName?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	titleWrapClassName?: string;
	tagWrapClassName?: string;
};

type ToolPageShellProps = ToolPageHeaderProps & {
	children: ReactNode;
	rootClassName?: string;
	rootStyle?: CSSProperties;
	mainClassName?: string;
};

export function ToolPageHeader({
	title,
	description,
	tag,
	backHref = "/",
	backLabel = "Back to Tools",
	className,
	backLinkClassName,
	titleClassName,
	descriptionClassName,
	titleWrapClassName,
	tagWrapClassName,
}: ToolPageHeaderProps) {
	return (
		<div
			className={cn(
				"mb-4 flex flex-col gap-2 md:mb-5 md:flex-row md:items-start md:justify-between md:gap-4",
				className,
			)}
		>
			<div className={titleWrapClassName}>
				<Link
					to={backHref}
					className={cn(
						"mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
						backLinkClassName,
					)}
				>
					<ArrowLeft className="size-3.5" />
					{backLabel}
				</Link>
				<h1
					className={cn(
						"display-title text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl",
						titleClassName,
					)}
				>
					{title}
				</h1>
				{description ? (
					<p
						className={cn(
							"mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground",
							descriptionClassName,
						)}
					>
						{description}
					</p>
				) : null}
			</div>
			{tag ? (
				<div className={cn("shrink-0", tagWrapClassName)}>{tag}</div>
			) : null}
		</div>
	);
}

export function ToolPageShell({
	title,
	description,
	tag,
	children,
	backHref,
	backLabel,
	className,
	backLinkClassName,
	titleClassName,
	descriptionClassName,
	titleWrapClassName,
	tagWrapClassName,
	rootClassName,
	rootStyle,
	mainClassName,
}: ToolPageShellProps) {
	return (
		<div
			className={cn("min-h-dvh bg-background text-foreground", rootClassName)}
			style={rootStyle}
		>
			<SiteNav />
			<main className={cn("page-wrap pb-20 pt-4 sm:pt-5", mainClassName)}>
				<ToolPageHeader
					title={title}
					description={description}
					tag={tag}
					backHref={backHref}
					backLabel={backLabel}
					className={className}
					backLinkClassName={backLinkClassName}
					titleClassName={titleClassName}
					descriptionClassName={descriptionClassName}
					titleWrapClassName={titleWrapClassName}
					tagWrapClassName={tagWrapClassName}
				/>
				{children}
			</main>
			<SiteFooter />
		</div>
	);
}
