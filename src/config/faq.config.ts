import { brand } from "./brand.config";

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

const productName = brand.productName;

export const faqSections: FaqSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: `What is ${productName}?`,
        a: `${productName} helps you create authority articles, add images, and broadcast them with your affiliate links — all in one workspace. Build once, save to your vault, and promote across platforms without starting from scratch.`,
      },
      {
        q: "Where do I start?",
        a: "Watch the walkthrough videos on Vault HQ, then open Craft from the sidebar. Add your link and niche, pick a topic, and generate your first article in three steps.",
      },
      {
        q: "Do I need my own affiliate link?",
        a: "Yes. Paste a valid affiliate or promotional URL in Craft or any upgrade tool. That link is placed inside your articles and generated posts so clicks go to you.",
      },
    ],
  },
  {
    title: "Generate & Broadcast",
    items: [
      {
        q: "What is Craft?",
        a: "Craft is the article generator. Step 1: add your link and niche. Step 2: choose a topic and settings. Step 3: get a full authority article ready to save.",
      },
      {
        q: "What is Visual Lab?",
        a: "Visual Lab adds images to your articles. Generate or upload one image per section, preview the full article, then save it.",
      },
      {
        q: "What is Broadcast?",
        a: "Broadcast is where you publish. Select a saved article, choose a platform, and launch it or copy it out.",
      },
    ],
  },
  {
    title: "Library",
    items: [
      {
        q: "What is Link Vault?",
        a: "Link Vault stores your affiliate and promo links in one place. Create, edit, or delete links anytime, and reuse them without retyping.",
      },
      {
        q: "What is My Vault?",
        a: "My Vault holds every article you have saved. Search, copy, or open any article to send it to Broadcast.",
      },
    ],
  },
  {
    title: "Vault Upgrades",
    items: [
      {
        q: "What is Done-For-You Profit?",
        a: "Paste your affiliate link, pick a niche, and get a Craft article, an authority article, header/mid/conclusion images, and 3 Facebook posts in one run.",
      },
      {
        q: "What is Automated Profits?",
        a: "Automated Profits drives traffic to the links and Craft articles you already built, using 180 practical traffic sources across nine niches.",
      },
      {
        q: "What is Social Payouts?",
        a: "Social Payouts generates 10+ Facebook post variants with different hooks from one offer or link. The built-in best practices show you how to post without getting flagged.",
      },
      {
        q: "What is Unlimited?",
        a: "Unlimited gives you 100 complete SEO articles across 10 niches, each with 3 professional images. Add your links and broadcast.",
      },
      {
        q: "What is Guaranteed High-Ticket Payouts?",
        a: "100 long-form authority articles (1,000+ words each). Pick an offer, preview with your link included, and publish across platforms.",
      },
      {
        q: "What is Vault Protector?",
        a: "Vault Protector is your account security overview — membership verification, encryption status, and recent activity — so your account stays in good standing.",
      },
      {
        q: "How do I get Reseller & License Rights?",
        a: "Open Reseller & License Rights and send an activation request. It goes to our support desk, and the team unlocks it on your account.",
      },
    ],
  },
  {
    title: "Account & Support",
    items: [
      {
        q: "How do I reset my password?",
        a: "Use Forgot Password on the login screen. If you are already signed in, sign out first, then request a reset link to the email on your account.",
      },
      {
        q: "How quickly does support respond?",
        a: "We usually reply within about 2 hours. During busy periods, allow 24–48 hours. Use the contact form on the Support page if your question is not answered here.",
      },
      {
        q: "I did not get a reply. What now?",
        a: "Replies go to the email you entered in the contact form. Check that inbox's spam or junk folder. Still nothing after 48 hours? Send a new message or email us directly.",
      },
      {
        q: "Is my data secure?",
        a: `${productName} uses secure authentication and encrypted connections. Never share your password, and contact support immediately if you notice unusual account activity.`,
      },
    ],
  },
];

export const faqPageCopy = {
  title: "Frequently Asked Questions",
  subtitle: `Quick answers about ${productName}, your articles, and Vault Upgrades`,
} as const;
