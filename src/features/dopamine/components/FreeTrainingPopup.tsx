"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPromoSlot } from "@/config/promos.config";
import { PromoSlotRenderer } from "@/components/layout/PromoSlotRenderer";

const SLOT_ID = "modal-training";

/**
 * Reference: timed full-screen training / upsell modal.
 *
 * Default production path: enable `modal-training` in promos.config.ts — PromoOrchestrator
 * shows it automatically. Use this component when you need the same slot mounted elsewhere
 * or as a template for a fully custom modal (fork and replace PromoSlotRenderer).
 */
export function FreeTrainingPopup() {
  const slot = getPromoSlot(SLOT_ID);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!slot) return;
    const key = slot.behavior?.sessionKey;
    if (key && sessionStorage.getItem(key)) return;
    const delay = slot.behavior?.delayMs ?? 800;
    const timer = setTimeout(() => {
      if (key) sessionStorage.setItem(key, "1");
      setOpen(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [slot]);

  if (!slot) return null;

  return (
    <AnimatePresence>
      {open && <PromoSlotRenderer slot={slot} onClose={() => setOpen(false)} />}
    </AnimatePresence>
  );
}
