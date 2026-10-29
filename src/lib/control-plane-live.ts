import { setSidebarOverride, setVideoWithdrawUrl, type ExclusiveOffer } from "@/config/offers.config";
import { applyPromoSlotPatch } from "@/config/promos.config";
import type { PromoCatalog } from "@/lib/control-plane-catalog";

export function applyLiveCatalog(catalog: PromoCatalog) {
  const sidebar: ExclusiveOffer[] = catalog.items
    .filter((item) => item.group === "sidebar")
    .map((item) => ({
      title: item.title,
      href: item.href,
      subtitle: item.subtitle || item.ctaLabel || undefined,
    }));
  setSidebarOverride(sidebar, catalog.sidebarEnabled);

  for (const item of catalog.items) {
    if (item.id === "banner-video-withdraw" && item.href) setVideoWithdrawUrl(item.href);
    if (item.group === "sidebar" || item.id === "banner-video-withdraw" || item.id === "other-help-center") {
      continue;
    }
    applyPromoSlotPatch(item.id, {
      enabled: item.enabled,
      headline: item.title,
      title: item.title,
      ctaLabel: item.ctaLabel,
      ctaUrl: item.href,
    });
  }
}
