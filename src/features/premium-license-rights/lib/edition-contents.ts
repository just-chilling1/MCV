export type EditionIconId = "scale" | "palette" | "layout" | "book";

export interface EditionContent {
  id: string;
  title: string;
  description: string;
  icon: EditionIconId;
}

export const EDITION_CONTENTS: EditionContent[] = [
  {
    id: "reseller-license",
    title: "Reseller license",
    description:
      "Full rights to resell this software under your own brand once the team activates your account.",
    icon: "scale",
  },
  {
    id: "rebrandable-assets",
    title: "Rebrandable assets",
    description:
      "Logos, graphics, and copy templates you can swap with your branding after activation.",
    icon: "palette",
  },
  {
    id: "sales-pages",
    title: "Sales pages",
    description:
      "Ready-to-use funnel and sales page assets for promoting the licensed edition.",
    icon: "layout",
  },
  {
    id: "support-docs",
    title: "Support docs",
    description:
      "Buyer-facing help copy and handoff notes so you can support customers under your brand.",
    icon: "book",
  },
];
