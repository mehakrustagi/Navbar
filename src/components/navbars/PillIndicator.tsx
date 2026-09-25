"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SLOTS, SlotIcon } from "./orb-kit";
import { cn } from "@/lib/utils";

/** Dark bar; the selected tab becomes a white pill carrying its own label. */
const BAR_H = 56;
const ICON = 22;

export default function PillIndicator() {
  const [active, setActive] = useState(SLOTS[1].id);

  return (
    <nav
      className="flex items-center gap-1 rounded-full bg-[#141414] p-1.5"
      style={{ height: BAR_H }}
      role="tablist"
    >
      {SLOTS.map((slot) => {
        const isActive = slot.id === active;
        return (
          <motion.button
            key={slot.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActive(slot.id)}
            layout
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(
              "relative flex h-full items-center justify-center gap-2 rounded-full",
              isActive ? "px-4" : "px-5",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="pill"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <SlotIcon
                slot={slot}
                color={isActive ? "#141414" : "rgba(255,255,255,0.55)"}
                size={ICON / Math.max(slot.w, slot.h)}
              />
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden text-[14px] font-semibold whitespace-nowrap text-[#141414]"
                  >
                    {slot.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
