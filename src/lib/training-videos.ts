/** Canonical Mobile Cash Vault training videos (Vimeo). */

export type TrainingVideo = {
  id: string;
  title: string;
  description: string;
  duration: string;
  premium?: boolean;
};

/** Academy videos 4–10 (core tools + power-ups). */
export const ACADEMY_TRAINING_VIDEOS: readonly TrainingVideo[] = [
  {
    id: "1213137238",
    title: "Craft",
    description:
      "Turn a topic and a promotional link into a complete SEO-optimized authority article — step by step.",
    duration: "6:31",
  },
  {
    id: "1213138993",
    title: "Images",
    description:
      "Generate or upload Header, Mid-Article, and Conclusion images so every piece looks publish-ready.",
    duration: "7:06",
  },
  {
    id: "1213140795",
    title: "Broadcast",
    description:
      "Copy your article, download images, and publish to LinkedIn, Medium, Quora, Reddit, and X with the right steps.",
    duration: "6:37",
  },
  {
    id: "1213143123",
    title: "Social Payouts",
    description:
      "Generate 10 unique high-converting Facebook posts from one link — each with a different angle.",
    duration: "5:05",
    premium: true,
  },
  {
    id: "1213144701",
    title: "Recurring Wealth",
    description:
      "Browse 100 ready-to-publish authority articles with images — add your link and ship.",
    duration: "6:16",
    premium: true,
  },
  {
    id: "1213146158",
    title: "Automated Profits",
    description:
      "Submit your link to 60 free traffic sources with step-by-step instructions and put traffic on cruise control.",
    duration: "5:30",
    premium: true,
  },
  {
    id: "1213147133",
    title: "Vault Protector",
    description:
      "Your account security overview — what Wealth Protector monitors and why every check stays green.",
    duration: "3:02",
    premium: true,
  },
];

export const SOCIAL_PAYOUTS_VIDEO = ACADEMY_TRAINING_VIDEOS[3];
export const RECURRING_WEALTH_VIDEO = ACADEMY_TRAINING_VIDEOS[4];
export const ACCELERATOR_VIDEO = ACADEMY_TRAINING_VIDEOS[5];
export const WEALTH_PROTECTOR_VIDEO = ACADEMY_TRAINING_VIDEOS[6];
