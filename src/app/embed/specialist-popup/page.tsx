"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SpecialistWelcomePopup } from "@/components/ui/specialist-welcome-popup";

function EmbedInner() {
  const searchParams = useSearchParams();
  const previewParam = searchParams.get("preview");
  const previewSecret = process.env.NEXT_PUBLIC_SPECIALIST_POPUP_PREVIEW_SECRET;
  const preview =
    (process.env.NODE_ENV === "development" && previewParam === "1") ||
    (!!previewSecret && previewParam === previewSecret);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, []);

  const notifyParent = useCallback((open: boolean) => {
    try {
      window.parent?.postMessage({ type: "mcv-specialist-popup", open }, "*");
    } catch {
      // host page may block messaging
    }
  }, []);

  // Production embed: no forceOpen — popup calls /api/eligibility/specialist-popup
  // (US/CA GeoIP + Mon–Fri 08:30–17:30 PT) before posting open:true to the parent.
  // Preview (?preview=1 in dev, or ?preview=SECRET in prod) skips the gate for QA only.
  if (preview) {
    return <SpecialistWelcomePopup forceOpen onOpenChange={notifyParent} />;
  }

  return <SpecialistWelcomePopup onOpenChange={notifyParent} />;
}

export default function SpecialistPopupEmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedInner />
    </Suspense>
  );
}
