import { NICHE_OPTIONS } from "@/features/blog-builder/types";

export type AutopilotNicheKey = (typeof NICHE_OPTIONS)[number]["value"];

export type TrafficDemand = "low" | "medium" | "high";

export interface AutopilotNicheProfile {
  key: AutopilotNicheKey;
  label: string;
  community: string;
  subreddit: string;
  hashtags: readonly string[];
  keywords: readonly string[];
  directoryQuery: string;
  offerAngle: string;
  demand: TrafficDemand;
}

export const AUTOPILOT_NICHE_PROFILES = {
  health: {
    key: "health",
    label: "Health & Wellness",
    community: "health and wellness community",
    subreddit: "r/Health",
    hashtags: ["#wellness", "#healthyhabits", "#healthtips"],
    keywords: ["wellness", "healthy habits", "preventive health"],
    directoryQuery: "health and wellness resource directories",
    offerAngle: "a practical health and wellness resource page",
    demand: "high",
  },
  finance: {
    key: "finance",
    label: "Finance & Investing",
    community: "personal finance community",
    subreddit: "r/personalfinance",
    hashtags: ["#personalfinance", "#investing", "#moneymindset"],
    keywords: ["personal finance", "investing basics", "money management"],
    directoryQuery: "personal finance resource directories",
    offerAngle: "a practical personal-finance resource page",
    demand: "high",
  },
  fitness: {
    key: "fitness",
    label: "Fitness & Sports",
    community: "fitness and sports community",
    subreddit: "r/fitness",
    hashtags: ["#fitness", "#workouttips", "#sportsperformance"],
    keywords: ["fitness", "workout planning", "sports performance"],
    directoryQuery: "fitness and sports resource directories",
    offerAngle: "a practical fitness and sports resource page",
    demand: "high",
  },
  marketing: {
    key: "marketing",
    label: "Digital Marketing",
    community: "digital marketing community",
    subreddit: "r/marketing",
    hashtags: ["#digitalmarketing", "#marketingtips", "#growthmarketing"],
    keywords: ["digital marketing", "content strategy", "audience growth"],
    directoryQuery: "digital marketing resource directories",
    offerAngle: "a practical digital-marketing resource page",
    demand: "medium",
  },
  selfhelp: {
    key: "selfhelp",
    label: "Self-Help & Personal Development",
    community: "personal development community",
    subreddit: "r/selfimprovement",
    hashtags: ["#personaldevelopment", "#selfimprovement", "#mindset"],
    keywords: ["personal development", "self improvement", "goal setting"],
    directoryQuery: "personal development resource directories",
    offerAngle: "a practical personal-development resource page",
    demand: "medium",
  },
  beauty: {
    key: "beauty",
    label: "Beauty & Skincare",
    community: "beauty and skincare community",
    subreddit: "r/SkincareAddiction",
    hashtags: ["#skincare", "#beautytips", "#makeup"],
    keywords: ["skincare", "beauty routines", "makeup advice"],
    directoryQuery: "beauty and skincare resource directories",
    offerAngle: "a practical beauty and skincare resource page",
    demand: "high",
  },
  education: {
    key: "education",
    label: "Education & Learning",
    community: "learning and study community",
    subreddit: "r/learnprogramming",
    hashtags: ["#learning", "#studytips", "#education"],
    keywords: ["learning", "study strategies", "online education"],
    directoryQuery: "education and learning resource directories",
    offerAngle: "a practical education and learning resource page",
    demand: "medium",
  },
  business: {
    key: "business",
    label: "Business & Entrepreneurship",
    community: "business and entrepreneurship community",
    subreddit: "r/Entrepreneur",
    hashtags: ["#entrepreneurship", "#smallbusiness", "#businesstips"],
    keywords: ["entrepreneurship", "small business", "business strategy"],
    directoryQuery: "business and entrepreneurship resource directories",
    offerAngle: "a practical business and entrepreneurship resource page",
    demand: "high",
  },
  travel: {
    key: "travel",
    label: "Travel & Lifestyle",
    community: "travel and lifestyle community",
    subreddit: "r/travel",
    hashtags: ["#travel", "#travelplanning", "#lifestyle"],
    keywords: ["travel planning", "travel tips", "lifestyle"],
    directoryQuery: "travel and lifestyle resource directories",
    offerAngle: "a practical travel and lifestyle resource page",
    demand: "medium",
  },
} as const satisfies Record<AutopilotNicheKey, AutopilotNicheProfile>;

export function getAutopilotNicheProfile(key: string) {
  return AUTOPILOT_NICHE_PROFILES[key as AutopilotNicheKey] ?? null;
}
