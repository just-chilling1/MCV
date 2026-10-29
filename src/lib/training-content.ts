import type { LucideIcon } from "lucide-react";
import { Rocket } from "lucide-react";
import { trainingContent } from "@/config/training.config";
import {
  trainingCta,
  trainingMindsetVideos,
  trainingPremiumVideos,
  trainingProTips,
  trainingQuickStartChecklist,
  trainingWorkflowSteps,
} from "@/config/training-content.config";
import { isFeatureEnabled } from "@/config/features.config";
import {
  getAcademyMindsetThumbnail,
  getAcademyPlatformThumbnail,
  getAcademyPremiumThumbnail,
} from "@/lib/video-thumbnails";
import { vimeoPlayerUrl } from "@/lib/dashboard-content";

export type AcademyVideo = {
  id: string;
  title: string;
  description: string;
  duration?: string;
  badge?: string;
  thumbnailSrc: string | null;
};

export function getPlatformTutorialVideos(): AcademyVideo[] {
  return trainingContent.videos.map((video, index) => ({
    ...video,
    thumbnailSrc: getAcademyPlatformThumbnail(index),
  }));
}

export function getPremiumTutorialVideos(): AcademyVideo[] {
  return trainingPremiumVideos.map((video, index) => ({
    ...video,
    thumbnailSrc: getAcademyPremiumThumbnail(index),
  }));
}

export function getMindsetTutorialVideos(): AcademyVideo[] {
  return trainingMindsetVideos.map((video, index) => ({
    ...video,
    thumbnailSrc: getAcademyMindsetThumbnail(index),
  }));
}

export function getTrainingStartCta(): {
  href: string;
  label: string;
  icon: LucideIcon;
} {
  if (isFeatureEnabled("article-wizard")) {
    return {
      href: "/write",
      label: "Get Started with Craft",
      icon: Rocket,
    };
  }
  if (isFeatureEnabled("blog-builder")) {
    return {
      href: "/sales-offer-generator",
      label: "Get Started with Sales Offer Generator",
      icon: Rocket,
    };
  }
  return {
    href: trainingCta.href,
    label: trainingCta.buttonLabel,
    icon: Rocket,
  };
}

export { trainingCta, trainingProTips, trainingQuickStartChecklist, trainingWorkflowSteps, vimeoPlayerUrl };
