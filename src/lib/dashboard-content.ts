import type { LucideIcon } from "lucide-react";
import { BookOpen, Rocket } from "lucide-react";
import { dashboardContent } from "@/config/dashboard.config";
import { trainingContent } from "@/config/training.config";
import { isFeatureEnabled } from "@/config/features.config";
import { getDashboardHowItWorksSteps } from "@/lib/dashboard-steps";
import { getDashboardVideoThumbnail } from "@/lib/video-thumbnails";

/** Keep in sync with navigation.config `/write` label — do not read nav at render time. */
const WRITE_TOOL_LABEL = "Craft";

export type DashboardVideo = {
  id: string;
  title: string;
  description: string;
  duration?: string;
  thumbnailSrc: string | null;
};

export function getDashboardVideos(): DashboardVideo[] {
  return dashboardContent.videos.map((video, index) => ({
    ...video,
    id: video.id || trainingContent.videos[index]?.id || "",
    thumbnailSrc: getDashboardVideoThumbnail(index),
  }));
}

export function getDashboardSubtitle(): string {
  if (isFeatureEnabled("article-wizard")) {
    return `Watch the three videos below in order — then open ${WRITE_TOOL_LABEL} and turn a link into an article. The Academy is there whenever you want a deeper walkthrough.`;
  }
  if (isFeatureEnabled("blog-builder")) {
    return "Watch the three videos below in order — then build your first offer. The Academy is there whenever you want a deeper walkthrough.";
  }
  if (isFeatureEnabled("core-workflow")) {
    return "Watch the three videos below in order — then enter your first topic and start finding ads. The Academy is there whenever you want a deeper walkthrough.";
  }
  return dashboardContent.subtitle;
}

export function getDashboardStartCta(): {
  href: string;
  label: string;
  icon: LucideIcon;
} {
  if (isFeatureEnabled("article-wizard")) {
    return {
      href: "/write",
      label: `Get Started with ${WRITE_TOOL_LABEL}`,
      icon: Rocket,
    };
  }
  if (isFeatureEnabled("blog-builder")) {
    return {
      href: "/sales-offer-generator",
      label: "Get Started Now with Sales Offer Generator",
      icon: Rocket,
    };
  }

  const firstStep = getDashboardHowItWorksSteps()[0];
  return {
    href: firstStep.href,
    label: `Get Started Now — ${firstStep.title}`,
    icon: firstStep.icon,
  };
}

export function getDashboardAcademyCta(): {
  href: string;
  label: string;
  icon: LucideIcon;
} {
  return {
    href: "/training",
    label: "Know More from the Academy",
    icon: BookOpen,
  };
}

export function vimeoPlayerUrl(id: string): string {
  return `https://player.vimeo.com/video/${id}`;
}
