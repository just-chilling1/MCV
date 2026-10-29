import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  buttonText: string;
  accent?: "gold" | "ink" | "brass";
}

const accents = {
  gold: {
    text: "text-silver-700",
    tile: "bg-silver-100 border-silver-300",
    hoverBorder: "hover:border-silver-300",
    bar: "from-brass-300 to-brass-500",
  },
  ink: {
    text: "text-ink-3",
    tile: "bg-canvas border-border-dim",
    hoverBorder: "hover:border-border-dim",
    bar: "from-ink-4 to-ink-2",
  },
  brass: {
    text: "text-silver-700",
    tile: "bg-silver-200 border-silver-300",
    hoverBorder: "hover:border-silver-300",
    bar: "from-brass-300 to-brass-500",
  },
} as const;

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  buttonText,
  accent = "gold",
}: QuickActionCardProps) {
  const tone = accents[accent];

  return (
    <Link
      href={href}
      className={clsx(
        "dashboard-nested-card group flex h-full flex-col p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        tone.hoverBorder
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={clsx("flex h-12 w-12 items-center justify-center rounded-xl border", tone.tile)}>
          <Icon className={clsx("h-6 w-6", tone.text)} />
        </div>
        <h3 className="text-lg font-medium tracking-tight text-text-heading">{title}</h3>
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-text-secondary">{description}</p>

      <span className={clsx("inline-flex items-center gap-2 text-sm font-medium", tone.text)}>
        {buttonText}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
