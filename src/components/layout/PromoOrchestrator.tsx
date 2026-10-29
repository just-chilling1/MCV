"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { getPromosByPlacement, type PromoSlot } from "@/config/promos.config";
import { socialProof } from "@/config/social-proof.config";
import { PromoSlotRenderer } from "./PromoSlotRenderer";

interface ActiveToast {
  slot: PromoSlot;
  id: string;
}

export function PromoOrchestrator() {
  const [modalSlot, setModalSlot] = useState<PromoSlot | null>(null);
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const [withdrawVisible, setWithdrawVisible] = useState(false);

  const modalSlots = getPromosByPlacement("modal");
  const toastSlots = getPromosByPlacement("toast-bl").sort(
    (a, b) => (b.behavior?.priority ?? 0) - (a.behavior?.priority ?? 0)
  );

  useEffect(() => {
    for (const slot of modalSlots) {
      const key = slot.behavior?.sessionKey;
      if (key && sessionStorage.getItem(key)) continue;
      const delay = slot.behavior?.delayMs ?? 800;
      const timer = setTimeout(() => {
        if (key) sessionStorage.setItem(key, "1");
        setModalSlot(slot);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [modalSlots]);

  useEffect(() => {
    const withdrawSlot = toastSlots.find((s) => s.id === "toast-withdraw");
    if (!withdrawSlot) return;
    const key = withdrawSlot.behavior?.sessionKey;
    if (key && sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      if (key) sessionStorage.setItem(key, "1");
      setActiveToast({ slot: withdrawSlot, id: withdrawSlot.id });
      setWithdrawVisible(true);
    }, withdrawSlot.behavior?.delayMs ?? 2500);
    return () => clearTimeout(timer);
  }, [toastSlots]);

  useEffect(() => {
    if (withdrawVisible) return;
    const socialSlot = toastSlots.find((s) => s.id === "toast-social");
    if (!socialSlot || !socialProof.enabled) return;

    const messages = socialProof.toast.messages;
    if (messages.length === 0) return;

    let idx = 0;
    const showNext = () => {
      const msg = messages[idx % messages.length];
      setActiveToast({
        slot: {
          ...socialSlot,
          content: {
            ...socialSlot.content,
            headline: `${msg.name} ${msg.action}`,
            toastAmount: msg.amount,
          },
        },
        id: `${socialSlot.id}-${idx}`,
      });
      idx += 1;
      const min = socialSlot.behavior?.intervalMinMs ?? 15000;
      const max = socialSlot.behavior?.intervalMaxMs ?? 25000;
      return min + Math.random() * (max - min);
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = showNext();
      timer = setTimeout(() => {
        setActiveToast(null);
        setTimeout(schedule, delay);
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [withdrawVisible, toastSlots]);

  return (
    <>
      <AnimatePresence>
        {modalSlot && (
          <PromoSlotRenderer slot={modalSlot} onClose={() => setModalSlot(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeToast && (
          <PromoSlotRenderer
            key={activeToast.id}
            slot={activeToast.slot}
            onClose={() => {
              setActiveToast(null);
              if (activeToast.slot.id === "toast-withdraw") setWithdrawVisible(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export function GlobalTopPromo() {
  const slots = getPromosByPlacement("global-top");
  if (slots.length === 0) return null;
  return <PromoSlotRenderer slot={slots[0]} />;
}

export function GlobalFooterPromo() {
  const slots = getPromosByPlacement("global-footer");
  if (slots.length === 0) return null;
  return <PromoSlotRenderer slot={slots[0]} />;
}

export function SidebarPromos() {
  const slots = getPromosByPlacement("sidebar");
  if (slots.length === 0) return null;
  return (
    <div className="mx-1 mt-4 space-y-2 rounded-xl border border-[var(--mcv-line-brass)] bg-brass-100 p-3">
      <p className="px-1 text-[13px] font-medium uppercase tracking-widest text-brass-700">
        Exclusive Offers
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <PromoSlotRenderer key={slot.id} slot={slot} />
        ))}
      </div>
    </div>
  );
}
