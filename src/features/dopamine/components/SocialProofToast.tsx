"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { socialProof } from "@/config/social-proof.config";
import { getPromoSlot } from "@/config/promos.config";
import { PromoSlotRenderer } from "@/components/layout/PromoSlotRenderer";

/**
 * Reference: rotating social-proof toasts (name + action + amount).
 *
 * Configure messages in social-proof.config.ts (`toast.messages`) and enable
 * `toast-social` in promos.config.ts. PromoOrchestrator runs this by default when
 * dopamine + social proof are on — this component is for custom placement or timing.
 */
export function SocialProofToast({ paused = false }: { paused?: boolean }) {
  const baseSlot = getPromoSlot("toast-social");
  const [active, setActive] = useState<{ slot: NonNullable<typeof baseSlot>; id: string } | null>(null);

  useEffect(() => {
    if (paused || !baseSlot || !socialProof.enabled) return;
    const messages = socialProof.toast.messages;
    if (messages.length === 0) return;

    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const cycle = () => {
      const msg = messages[idx % messages.length];
      setActive({
        id: `social-${idx}`,
        slot: {
          ...baseSlot,
          content: {
            ...baseSlot.content,
            headline: `${msg.name} ${msg.action}`,
            toastAmount: msg.amount,
          },
        },
      });
      idx += 1;
      const min = baseSlot.behavior?.intervalMinMs ?? socialProof.toast.intervalMinMs;
      const max = baseSlot.behavior?.intervalMaxMs ?? socialProof.toast.intervalMaxMs;
      const visibleMs = 4000;
      timer = setTimeout(() => {
        setActive(null);
        setTimeout(cycle, min + Math.random() * (max - min));
      }, visibleMs);
    };

    cycle();
    return () => clearTimeout(timer);
  }, [paused, baseSlot]);

  return (
    <AnimatePresence>
      {active && (
        <PromoSlotRenderer
          key={active.id}
          slot={active.slot}
          onClose={() => setActive(null)}
        />
      )}
    </AnimatePresence>
  );
}
