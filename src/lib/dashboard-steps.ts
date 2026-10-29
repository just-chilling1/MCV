import type { LucideIcon } from "lucide-react";
import { Link2, Megaphone, Rocket, Search, Brain, Radar, MessageSquare } from "lucide-react";
import { isFeatureEnabled } from "@/config/features.config";
import type { HowItWorksStep } from "@/components/ui/how-it-works";

export interface QuickAction {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  accent: "gold" | "ink" | "brass";
}

function blogBuilderSteps(): HowItWorksStep[] {
  return [
    {
      number: 1,
      title: "Add your link",
      description: "Save your affiliate or promotional link in the Links Library.",
      minutes: "~2 min",
      href: "/links",
      icon: Link2,
      cta: "Open Links Library",
    },
    {
      number: 2,
      title: "Build your offer",
      description: "Open Craft — pick a niche, add your link, and generate the article.",
      minutes: "~5 min",
      href: "/write",
      icon: Rocket,
      cta: "Start Craft",
    },
    {
      number: 3,
      title: "Manage your offers",
      description: "Open Offers Library to view live sites, generate story threads, and scale with premium tools.",
      minutes: "~3 min",
      href: "/offers",
      icon: Megaphone,
      cta: "Open Offers Library",
    },
  ];
}

function coreWorkflowSteps(): HowItWorksStep[] {
  return [
    {
      number: 1,
      title: "Enter a topic",
      description: "Type one niche or product angle to discover related keywords.",
      minutes: "~2 min",
      href: "/search",
      icon: Search,
      cta: "Go to Step 1",
    },
    {
      number: 2,
      title: "Find high-demand ads",
      description: "Check demand, pick active posts, and select the best places to reply.",
      minutes: "~5 min",
      href: "/radar",
      icon: Radar,
      cta: "Go to Step 3",
    },
    {
      number: 3,
      title: "Copy AI replies",
      description: "Generate replies with your link baked in and paste under the ad.",
      minutes: "~3 min",
      href: "/replies",
      icon: MessageSquare,
      cta: "Go to Step 4",
    },
  ];
}

function defaultSteps(): HowItWorksStep[] {
  return [
    {
      number: 1,
      title: "Watch the intro",
      description: "Start with the training video to understand the full workflow.",
      minutes: "~3 min",
      href: "/training",
      icon: Rocket,
      cta: "Open Academy",
    },
    {
      number: 2,
      title: "Configure your product",
      description: "Set branding, links, and enabled features in the config files.",
      minutes: "~10 min",
      href: "/support",
      icon: Brain,
      cta: "Get Help",
    },
    {
      number: 3,
      title: "Launch your workflow",
      description: "Enable your product modules and start with the first sidebar step.",
      minutes: "~5 min",
      href: "/dashboard",
      icon: Megaphone,
      cta: "Review Steps",
    },
  ];
}

export function getDashboardHowItWorksSteps(): HowItWorksStep[] {
  if (isFeatureEnabled("blog-builder")) return blogBuilderSteps();
  if (isFeatureEnabled("core-workflow")) return coreWorkflowSteps();
  return defaultSteps();
}

export type DashboardStepStatus = "completed" | "current" | "upcoming";

function statusesFromCompleted(completed: boolean[]): DashboardStepStatus[] {
  const firstIncomplete = completed.findIndex((done) => !done);
  return completed.map((done, index) => {
    if (done) return "completed";
    if (index === firstIncomplete) return "current";
    return "upcoming";
  });
}

function blogBuilderStepStatuses(progress: number): DashboardStepStatus[] {
  return statusesFromCompleted([progress >= 1, progress >= 4, false]);
}

function coreWorkflowStepStatuses(progress: number): DashboardStepStatus[] {
  return statusesFromCompleted([progress >= 1, progress >= 3, progress >= 4]);
}

/** Maps workflow progress to per-card completed / current / upcoming states. */
export function getDashboardStepStatuses(progress: number): DashboardStepStatus[] {
  if (isFeatureEnabled("blog-builder")) return blogBuilderStepStatuses(progress);
  if (isFeatureEnabled("core-workflow")) return coreWorkflowStepStatuses(progress);
  return statusesFromCompleted([false, false, false]);
}

export function getDashboardQuickActions(): QuickAction[] {
  if (isFeatureEnabled("blog-builder")) {
    return [
      {
        href: "/sales-offer-generator",
        title: "Sales Offer Generator",
        description: "Build and publish a niche questionnaire site",
        icon: Rocket,
        buttonText: "Launch Now",
        accent: "gold",
      },
      {
        href: "/offers",
        title: "Offers Library",
        description: "Manage live offers and generate X story threads from any offer",
        icon: Megaphone,
        buttonText: "Open Library",
        accent: "ink",
      },
      {
        href: "/training",
        title: "Training Academy",
        description: "Video tutorials and step-by-step guides",
        icon: Brain,
        buttonText: "Watch Training",
        accent: "brass",
      },
    ];
  }

  if (isFeatureEnabled("core-workflow")) {
    return [
      {
        href: "/search",
        title: "Step 1: Enter Topic",
        description: "Start with one niche or product angle",
        icon: Search,
        buttonText: "Start Search",
        accent: "gold",
      },
      {
        href: "/analysis",
        title: "Step 2: Check Demand",
        description: "See which keywords win in your niche",
        icon: Brain,
        buttonText: "Analyze",
        accent: "ink",
      },
      {
        href: "/radar",
        title: "Step 3: Find Ads",
        description: "Pick posts to reply to with your link",
        icon: Radar,
        buttonText: "Find Ads",
        accent: "brass",
      },
    ];
  }

  return [
    {
      href: "/training",
      title: "Training Academy",
      description: "Learn the platform with video walkthroughs",
      icon: Rocket,
      buttonText: "Open Academy",
      accent: "gold",
    },
    {
      href: "/support",
      title: "Contact Support",
      description: "Get help from the support team",
      icon: MessageSquare,
      buttonText: "Get Help",
      accent: "ink",
    },
    {
      href: "/infinite",
      title: "Premium Upgrades",
      description: "Unlock advanced tools and pre-made assets",
      icon: Megaphone,
      buttonText: "Explore",
      accent: "brass",
    },
  ];
}
