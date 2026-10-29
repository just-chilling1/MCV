"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, Users } from "lucide-react";
import { socialProof } from "@/config/social-proof.config";

export function LiveActivityTicker() {
  const [index, setIndex] = useState(0);
  const messages = socialProof.ticker.messages;
  const onlineCount = socialProof.ticker.onlineCount;

  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  if (!socialProof.enabled || messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {onlineCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-brass-500/5 border border-brass-700/10 rounded-lg">
          <Users size={11} className="text-info shrink-0" />
          <span className="text-[13px] font-medium text-info">{onlineCount} members online</span>
          <Circle size={5} className="text-success fill-success animate-pulse ml-auto shrink-0" />
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg overflow-hidden">
        <Circle size={5} className="text-success fill-success shrink-0 animate-pulse" />
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-[13px] font-medium text-success uppercase tracking-widest whitespace-nowrap"
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
