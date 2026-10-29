"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getPromoSlot } from "@/config/promos.config";
import { PromoSlotRenderer } from "@/components/layout/PromoSlotRenderer";

const SLOT_ID = "toast-withdraw";

/**
 * Reference: bottom-left withdraw / payout toast (high-priority promo).
 *
 * Default path: enable `toast-withdraw` in promos.config.ts — PromoOrchestrator schedules it.
 * Use this component for a standalone mount or as a template for custom toast styling.
 */
export function WithdrawPopup() {
  const slot = getPromoSlot(SLOT_ID);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!slot) return;
    const key = slot.behavior?.sessionKey;
    if (key && sessionStorage.getItem(key)) return;
    const delay = slot.behavior?.delayMs ?? 2500;
    const timer = setTimeout(() => {
      if (key) sessionStorage.setItem(key, "1");
      setOpen(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [slot]);

  if (!slot) return null;

  return (
    <AnimatePresence>
      {open && (
        <PromoSlotRenderer slot={slot} onClose={() => setOpen(false)} />
      )}
    </AnimatePresence>
  );
}
