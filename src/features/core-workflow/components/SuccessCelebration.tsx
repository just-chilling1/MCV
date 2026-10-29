"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface SuccessCelebrationProps {
  show: boolean;
  title: string;
  subtitle: string;
  onDone?: () => void;
}

const CONFETTI_COLORS = ["#D4AF37", "#E6C65C", "#4A6B5B", "#36C982", "#F0B44D", "#F2F5F0"];

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const x = (Math.random() - 0.5) * 300;
  const y = -(Math.random() * 200 + 100);
  const rotation = Math.random() * 720 - 360;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x, y, rotate: rotation, scale: 0 }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color, top: "50%", left: "50%" }}
    />
  );
}

export function SuccessCelebration({ show, title, subtitle, onDone }: SuccessCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onAnimationComplete={() => {
            if (onDone) setTimeout(onDone, 2500);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30 }}
            animate={{ y: 0 }}
            className="relative flex flex-col items-center gap-5 surface-nested rounded-3xl border-[var(--mcv-line-brass)] p-10 shadow-[0_0_60px_rgba(234,179,8,0.15)] max-w-sm"
          >
            <div className="relative">
              {Array.from({ length: 20 }).map((_, i) => (
                <ConfettiParticle
                  key={i}
                  delay={i * 0.05}
                  color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                />
              ))}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 bg-brass-100 rounded-full flex items-center justify-center border-2 border-[var(--mcv-line-brass)]"
              >
                <CheckCircle2 size={40} className="text-brass-700" />
              </motion.div>
            </div>
            <div className="text-center flex flex-col gap-2">
              <h3 className="text-2xl font-medium text-text-heading">{title}</h3>
              <p className="text-sm text-text-secondary">{subtitle}</p>
            </div>
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="h-1 bg-grad-brass rounded-full self-start"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
