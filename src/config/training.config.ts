export const trainingRoutes = {
  videos: "/training",
  faq: "/training/faq",
} as const;

export const trainingContent = {
  pageTitle: "Training",
  pageSubtitle:
    "Click-by-click walkthroughs for every core tool — watch in order after the Dashboard intro videos.",
  /** Used by global-top banner, sidebar promos, and modal-training */
  externalTrainingUrl: "https://perpetualincome365.convertri.com/7figure-everwebinar-registration#aff=DigitalAvalon&cam=membersarea",
  /** Academy platform tutorials — videos 4–6 in the product roster */
  videos: [
    {
      id: "1215373563",
      title: "Craft",
      description:
        "Turn an affiliate link and niche into a full authority article — Link & Niche, Topic & Settings, Generated Article.",
      duration: "5+ min",
    },
    {
      id: "1215508183",
      title: "Visual Lab & Broadcast",
      description:
        "Add header, mid-article, and conclusion images, then package and manually post to LinkedIn, Quora, Medium, Reddit, and X.",
      duration: "5+ min",
    },
    {
      id: "1215513309",
      title: "Link Vault & My Vault",
      description:
        "Save affiliate URLs once and keep every draft and published article in your Content Reserve — ready to reuse and broadcast.",
      duration: "5+ min",
    },
  ],
} as const;
