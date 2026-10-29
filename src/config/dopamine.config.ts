import { brand } from "./brand.config";

/** Optional dashboard engagement widgets — used when `dopamine` feature is enabled */
export const dopamineContent = {
  milestones: [
    { threshold: 1, label: "First search", icon: "Search", reward: "You started the workflow." },
    { threshold: 5, label: "Getting momentum", icon: "TrendingUp", reward: "Keep posting consistently." },
    { threshold: 25, label: "Power user", icon: "Crown", reward: "You are building a real habit." },
  ],
  earningsCounter: {
    label: "Session activity",
    startValue: 0,
    incrementMin: 1,
    incrementMax: 5,
    intervalMs: 8000,
  },
  testimonials: [
    { name: "Alex M.", location: "TX", quote: "The step-by-step workflow made it easy to get started.", amount: "$0" },
    { name: "Jordan K.", location: "FL", quote: "Training videos answered every question I had.", amount: "$0" },
    { name: "Sam R.", location: "CA", quote: "Support responded quickly when I needed help.", amount: "$0" },
  ],
  trustBar: {
    items: [
      { label: "Secure login", icon: "Shield" },
      { label: "Member support", icon: "Headphones" },
      { label: brand.productName, icon: "Star" },
    ],
  },
} as const;
