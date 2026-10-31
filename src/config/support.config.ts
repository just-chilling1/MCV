export const supportRoutes = {
  contact: "/support#contact",
  /** @deprecated FAQ lives on the main support page */
  faq: "/support#faq",
} as const;

export const support = {
  email: "MobileCashVault@neoai.freshdesk.com",
  /** In-app contact form anchor on the support page */
  contactUrl: "/support#contact",
  /** Freshdesk help portal — browse articles and track tickets */
  helpCenterUrl: "https://neoaifreshdesk.freshdesk.com",
  headline: "Need Help?",
  pageTitle: "Support",
  pageSubtitle: "Send a message below — we usually reply within about 2 hours",
  subcopy: "Our support team is here for you 24/7",
  ctaLabel: "Contact Support",
  formHeading: "Contact Support",
  formSubheading: "Fastest way to reach us — describe the issue and we'll reply by email.",
  floatingWidget: {
    label: "Need help?",
    panelTitle: "Need help?",
    panelSubtitle: "Send us a message — we typically reply within 2 hours",
    ariaLabel: "Need help? Contact support",
  },
  stats: [
    { icon: "clock", label: "Avg response", highlight: "under 2 hours", highlightClass: "text-success" },
    { icon: "star", label: "4.9/5 support rating" },
    { icon: "shield", label: "98% satisfaction rate" },
  ],
  refundPolicy: {
    title: "Refund Policy",
    subtitle: "Satisfaction guarantee terms",
    items: [
      {
        title: "30-Day Guarantee",
        body: "Full refund available within 30 days of purchase. No questions asked.",
      },
      {
        title: "Request Procedure",
        body: "Email our support team with your account email and purchase date. We will confirm receipt and begin processing.",
      },
      {
        title: "Processing Timeline",
        body: "Refunds are typically processed within 5–7 business days. You will receive confirmation once complete.",
      },
    ],
  },
} as const;
