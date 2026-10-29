import { brand } from "./brand.config";

export const ONBOARDING_PRODUCT_NAME = brand.productName;

export const ONBOARDING_DASHBOARD_ROUTE = "/dashboard";

export const ONBOARDING_META_KEY = "onboarding_completed" as const;

export const onboardingContent = {
  activation: {
    headline: "Let's Activate Your System",
    subheadline: "First, tell us your name so we can personalize things for you.",
    inputPlaceholder: "Enter your first name",
    infoTitle: "What happens next:",
    infoSteps: [
      "We'll save your name so everything feels personal",
      "Your home screen shows you exactly what to do first",
      "Getting started takes just a few minutes",
      "Help is always one click away if you get stuck",
    ],
    note: "You're almost there 🔥 — everything stays saved so you can pick up anytime",
    ctaLabel: "Activate My System >",
  },
} as const;
