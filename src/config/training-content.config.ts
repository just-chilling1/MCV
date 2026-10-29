/**
 * Mobile Cash Vault Academy content — platform tutorials, premium walkthroughs, mindset, and launch helpers.
 * Add Vimeo IDs when videos are uploaded; empty id shows the poster with “coming soon.”
 */

import { faqSections } from "./faq.config";

export const trainingWorkflowSteps = [
  {
    step: 1,
    title: "Craft",
    page: "/write",
    description: "Paste your affiliate link, pick a niche, and generate your first authority article.",
    tips: ["Save the link to Link Vault on step one so you never re-paste the same URL."],
    examples: [] as string[],
  },
  {
    step: 2,
    title: "Visual Lab & Broadcast",
    page: "/images",
    description: "Add images in Visual Lab, then open Broadcast to copy and post by hand on your platforms.",
    tips: ["Manual posting keeps your accounts safer — Broadcast never auto-posts."],
    examples: [] as string[],
  },
  {
    step: 3,
    title: "Link Vault & My Vault",
    page: "/links",
    description: "Keep every promo link and saved article organized so scaling stays simple.",
    tips: ['Name links like "Keto supplement — Digistore" instead of "link2."'],
    examples: [] as string[],
  },
] as const;

export const trainingFaqSections = faqSections;

export const trainingProTips = [
  {
    title: "Launch before you optimize",
    text: "Your first Craft article does not need to be perfect — generate, light-edit, save, and broadcast tonight.",
  },
  {
    title: "One hub for promotion",
    text: "After you save an article, start from My Vault or Broadcast — not old browser tabs.",
  },
  {
    title: "Name your links clearly",
    text: 'In Link Vault use labels like "Keto supplement — Digistore" instead of "link2" so scaling stays organized.',
  },
] as const;

export const trainingQuickStartChecklist = [
  "Watch the three Start Here videos on Vault HQ",
  "Open Craft, save one affiliate link, and generate your first article",
  "Add images in Visual Lab, then Broadcast to one platform by hand",
  "Keep your best URLs in Link Vault and articles in My Vault",
] as const;

/** Premium walkthrough slots — order matches Vault Upgrades nav */
export const trainingPremiumVideos = [
  {
    id: "",
    badge: "Done-For-You Profit",
    title: "Done-For-You Profit",
    description:
      "Paste your affiliate link, pick a niche, and generate a Craft article, authority article, and three Facebook posts in one kit.",
    duration: "5+ min",
  },
  {
    id: "",
    badge: "Automated Profits",
    title: "Automated Profits",
    description:
      "Share Craft articles and Link Vault URLs across curated traffic sources — pick a niche and show up consistently.",
    duration: "5+ min",
  },
  {
    id: "1215574185",
    badge: "Social Payouts",
    title: "Social Payouts",
    description:
      "Generate ten-plus Facebook post variants from one offer — different hooks and angles, ready to copy and paste.",
    duration: "5+ min",
  },
  {
    id: "1215530104",
    badge: "Unlimited",
    title: "Unlimited",
    description:
      "Browse 100 ready authority articles across ten niches — add your links and broadcast.",
    duration: "5+ min",
  },
  {
    id: "1215568587",
    badge: "Guaranteed High-Ticket Payouts",
    title: "Guaranteed High-Ticket Payouts",
    description:
      "Attach long-form authority articles (1,000+ words) with your link baked in, and publish for recurring traffic.",
    duration: "5+ min",
  },
  {
    id: "",
    badge: "Reseller & License Rights",
    title: "Reseller & License Rights",
    description:
      "Send a License Rights request and wait for team activation — typically within 2–48 hours.",
    duration: "5+ min",
  },
  {
    id: "1215579801",
    badge: "Vault Protector",
    title: "Vault Protector",
    description:
      "Cyber Protection overview — verification status, AES-256 encryption checks, and activity log for peace of mind.",
    duration: "2+ min",
  },
] as const;

/** Mindset companions — one per Academy feature (how-to first, then mindset) */
export const trainingMindsetVideos = [
  {
    id: "",
    badge: "Mindset",
    title: "Craft Mindset",
    description: "Editor identity, blank-page fear, and the habits that get articles shipped.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Visual Lab & Broadcast Mindset",
    description: "Ship imperfect visuals and post by hand without freezing on “professional enough.”",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Link Vault & My Vault Mindset",
    description: "Organization as an identity — name links once and stop hunting browser tabs.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Done-For-You Profit Mindset",
    description: "Permission to use kits without guilt — customize one line, then volume.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Automated Profits Mindset",
    description: "Focus over 180-source overwhelm — pick a few paths and show up.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Social Payouts Mindset",
    description: "Helpful-member identity, 70/30 value, and calm pacing in Facebook groups.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Unlimited Mindset",
    description: "Pick one article this week — browsing the library forever is the trap.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Guaranteed High-Ticket Mindset",
    description: "Long-form without intimidation — helpful depth beats perfect prose.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Reseller & License Rights Mindset",
    description: "Patient owner energy while activation lands — usually 2–48 hours.",
    duration: "3–5 min",
  },
  {
    id: "",
    badge: "Mindset",
    title: "Vault Protector Mindset",
    description: "Thirty-second weekly security check as a pro habit — not paranoia.",
    duration: "3–5 min",
  },
] as const;

export const trainingContentReady = true;

export const trainingCta = {
  headline: "Ready to ship your first article?",
  subcopy:
    "The Academy gives you the click-by-click detail — Craft is where you put it into action. Paste a link and generate tonight.",
  buttonLabel: "Get Started with Craft",
  href: "/write",
} as const;
