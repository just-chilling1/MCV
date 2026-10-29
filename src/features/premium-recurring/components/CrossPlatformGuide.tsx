"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  Globe,
  Linkedin,
  BookOpen,
  HelpCircle,
  Rss,
  MousePointerClick,
} from "lucide-react";

const PLATFORMS = [
  {
    icon: Rss,
    name: "Your blog / site",
    steps: [
      "Copy the HTML version and paste into WordPress, Ghost, or your site editor.",
      "Set the meta description from the article excerpt for SEO.",
      "Add internal links to your sales page where relevant.",
      "Publish on a schedule — one article per week builds long-term traffic.",
    ],
  },
  {
    icon: BookOpen,
    name: "Medium",
    steps: [
      "Copy the plain-text version and paste into a new Medium story.",
      "Add 3–5 relevant tags for your niche at the bottom.",
      "Keep your affiliate link in the closing CTA — Medium allows external links in articles.",
      "Submit to a niche publication for extra reach, or publish on your profile.",
    ],
  },
  {
    icon: Linkedin,
    name: "LinkedIn",
    steps: [
      "Use plain text for a LinkedIn article, or paste HTML into your blog CMS and link from a short LinkedIn post.",
      "Lead with a personal hook in the first two lines — they show before “see more.”",
      "End with a clear CTA and your affiliate link.",
      "Post a shorter teaser on your feed linking to the full article.",
    ],
  },
  {
    icon: HelpCircle,
    name: "Quora",
    steps: [
      "Search for questions in your niche with lots of followers but thin answers.",
      "Adapt a section of the article into a direct answer — lead with the takeaway, not a link.",
      "Add your article or offer link at the end as “further reading” — Quora allows relevant links, but link-only answers get collapsed.",
      "Answer 2–3 related questions using different sections of the same article.",
    ],
  },
  {
    icon: Globe,
    name: "Cross-posting workflow",
    steps: [
      "Publish the full article on one platform first (your blog or Medium).",
      "Adapt the intro for LinkedIn and Quora — don’t paste identical copy everywhere.",
      "Track which platform drives clicks and double down on what works.",
      "Saved articles stay tied to this offer in your Offers Library for easy reuse.",
    ],
  },
] as const;

type PlatformName = (typeof PLATFORMS)[number]["name"];

export function CrossPlatformGuide() {
  const [selected, setSelected] = useState<PlatformName | null>(null);

  const platform = PLATFORMS.find((p) => p.name === selected);

  return (
    <section className="glass-card p-5 md:p-6">
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-brass-700">
        Where to use it
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        These long-form articles are built for platforms that reward in-depth content. Pick where
        you want to publish and the posting steps appear — your offer link is already woven in.
      </p>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-divider" role="tablist">
        {PLATFORMS.map((p) => (
          <button
            key={p.name}
            type="button"
            role="tab"
            aria-selected={selected === p.name}
            onClick={() => setSelected((prev) => (prev === p.name ? null : p.name))}
            className={clsx("tab-pill", selected === p.name && "is-active")}
          >
            <p.icon size={15} aria-hidden />
            {p.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {platform ? (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mt-4 rounded-xl border border-border-dim/70 bg-page/60 p-4 md:p-5"
          >
            <ol className="list-decimal space-y-2 pl-4 text-sm leading-relaxed text-text-secondary">
              {platform.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border-dim bg-page/40 px-4 py-5 text-sm text-text-muted"
          >
            <MousePointerClick size={16} className="shrink-0 text-brass-700" aria-hidden />
            Select a platform above to see exactly how to post there.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
