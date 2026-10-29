import { getExclusiveOffers, getVideoWithdrawUrl, offers } from "@/config/offers.config";
import { promoSlots } from "@/config/promos.config";
import { support } from "@/config/support.config";

export type CatalogGroup = "sidebar" | "popup" | "banner" | "other";

export interface CatalogItem {
  id: string;
  group: CatalogGroup;
  name: string;
  removable: boolean;
  enabled: boolean;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  href: string;
  note: string;
  vturbPlayerId: string;
  vturbScriptSrc: string;
  phoneDisplay: string;
  phoneTel: string;
}

export interface PromoCatalog {
  schemaVersion: 1;
  sidebarEnabled: boolean;
  addGroups: CatalogGroup[];
  storage?: "saved" | "defaults" | "unavailable";
  items: CatalogItem[];
}

const GROUPS = new Set<CatalogGroup>(["sidebar", "popup", "banner", "other"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function blankItem(
  partial: Pick<CatalogItem, "id" | "group" | "name"> & Partial<CatalogItem>
): CatalogItem {
  return {
    removable: false,
    enabled: true,
    title: "",
    subtitle: "",
    body: "",
    ctaLabel: "",
    href: "",
    note: "",
    vturbPlayerId: "",
    vturbScriptSrc: "",
    phoneDisplay: "",
    phoneTel: "",
    ...partial,
  };
}

export function buildDefaultCatalog(): PromoCatalog {
  const items: CatalogItem[] = getExclusiveOffers().map((offer, index) =>
    blankItem({
      id: `sidebar-${index + 1}`,
      group: "sidebar",
      name: `Sidebar link ${index + 1}`,
      removable: true,
      title: offer.title,
      subtitle: offer.subtitle ?? "",
      ctaLabel: offer.subtitle ?? "",
      href: offer.href,
    })
  );

  items.push(
    blankItem({
      id: "banner-video-withdraw",
      group: "banner",
      name: "Video withdraw link",
      href: getVideoWithdrawUrl() || offers.videoWithdrawUrl,
    }),
    blankItem({
      id: "other-help-center",
      group: "other",
      name: "Help center",
      title: support.headline,
      ctaLabel: support.ctaLabel,
      href: support.helpCenterUrl,
    })
  );

  for (const slot of promoSlots) {
    const body = Array.isArray(slot.content.body) ? slot.content.body.join("\n") : slot.content.body ?? "";
    items.push(
      blankItem({
        id: slot.id,
        group: slot.placement === "modal" ? "popup" : "banner",
        name: slot.id,
        enabled: slot.enabled,
        title: slot.content.headline || slot.content.title || "",
        subtitle: slot.content.subtitle || slot.content.badge || "",
        body,
        ctaLabel: slot.content.ctaLabel || "",
        href: slot.content.ctaUrl || "",
      })
    );
  }

  return { schemaVersion: 1, sidebarEnabled: true, addGroups: ["sidebar"], storage: "defaults", items };
}

export function readCatalog(value: unknown): PromoCatalog {
  if (!value || typeof value !== "object") throw new Error("Invalid catalog.");
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.items)) throw new Error("Catalog items are missing.");
  const items = raw.items.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Item ${index + 1} is invalid.`);
    const row = entry as Record<string, unknown>;
    const group = row.group;
    if (typeof group !== "string" || !GROUPS.has(group as CatalogGroup)) {
      throw new Error(`Item ${index + 1} has an invalid group.`);
    }
    const id = text(row.id);
    if (!id) throw new Error(`Item ${index + 1} is missing an id.`);
    return blankItem({
      id,
      group: group as CatalogGroup,
      name: text(row.name) || id,
      removable: row.removable === true,
      enabled: row.enabled !== false,
      title: text(row.title),
      subtitle: text(row.subtitle),
      body: text(row.body),
      ctaLabel: text(row.ctaLabel),
      href: text(row.href),
      note: text(row.note),
      vturbPlayerId: text(row.vturbPlayerId),
      vturbScriptSrc: text(row.vturbScriptSrc),
      phoneDisplay: text(row.phoneDisplay),
      phoneTel: text(row.phoneTel),
    });
  });
  return {
    schemaVersion: 1,
    sidebarEnabled: raw.sidebarEnabled !== false,
    addGroups: ["sidebar"],
    items,
  };
}
