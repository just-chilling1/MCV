export interface ArmedLink {
  label: string;
  url: string;
  network: "digistore" | "amazon" | "other";
  description?: string;
  tag?: string;
}

export interface ThemeConfig {
  templateId?: string;
  presetId: string;
  accentOverride?: string;
  headingFont?: string;
  bodyFont?: string;
}

export interface BlogSite {
  id: string;
  user_id: string;
  hobby: string;
  territory?: string | null;
  title: string;
  tagline: string | null;
  slug: string;
  owner_handle?: string | null;
  theme: string;
  theme_config?: ThemeConfig | null;
  armed_links: ArmedLink[];
  status: "draft" | "live";
  site_type?: "product" | "blog";
  sales_page_html?: string | null;
  sales_page_json?: Record<string, unknown> | null;
  created_at: string;
  is_template?: boolean;
  template_key?: string | null;
}

export interface BlogPost {
  id: string;
  site_id: string;
  user_id: string;
  title: string;
  slug: string;
  html: string;
  excerpt: string | null;
  meta_description: string | null;
  image_url: string | null;
  image_alt: string | null;
  is_pillar: boolean;
  status: "draft" | "scheduled" | "live";
  publish_at: string | null;
  views: number;
  created_at: string;
}

export type ContentTier = "deploy" | "full" | "authority";

export interface GeneratedPostContent {
  title: string;
  excerpt: string;
  metaDescription: string;
  html: string;
}

/** Long-form authority article output (Recurring Stream). */
export type GeneratedArticleContent = GeneratedPostContent & { wordCount?: number };

export type ArticleAngle =
  | "pillar-guide"
  | "best-picks"
  | "mistakes"
  | "budget"
  | "pro-tips"
  | "worth-it"
  | "beginners";

export interface ClusterTopic {
  title: string;
  slug: string;
  isPillar: boolean;
  angle?: ArticleAngle;
}

export type PostSlotStatus = "queued" | "generating" | "complete" | "error";

export interface PostSlotState {
  topic: ClusterTopic;
  status: PostSlotStatus;
  progress: number;
  post?: BlogPost;
  error?: string;
}

export interface GenerationQuota {
  limit: number | null;
  usedToday: number;
  remaining: number | null;
  unlimited?: boolean;
}

export interface NicheOption {
  value: string;
  label: string;
}

export const NICHE_OPTIONS = [
  { value: "health", label: "Health & Wellness" },
  { value: "finance", label: "Finance & Investing" },
  { value: "fitness", label: "Fitness & Sports" },
  { value: "marketing", label: "Digital Marketing" },
  { value: "selfhelp", label: "Self-Help & Personal Development" },
  { value: "beauty", label: "Beauty & Skincare" },
  { value: "education", label: "Education & Learning" },
  { value: "business", label: "Business & Entrepreneurship" },
  { value: "travel", label: "Travel & Lifestyle" },
] as const satisfies readonly NicheOption[];

export const WIZARD_STEPS = [
  { number: 1, title: "Add Your Link", description: "Save your promotional or affiliate link" },
  { number: 2, title: "Pick Your Niche", description: "Choose one of nine niches for your quiz site" },
  { number: 3, title: "Choose Template", description: "Pick a template, color theme, and fonts" },
  { number: 4, title: "Launch Offer", description: "Generate and publish your niche questionnaire" },
] as const;
