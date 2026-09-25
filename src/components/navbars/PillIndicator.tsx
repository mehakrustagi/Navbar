"use client";

import { motion } from "motion/react";
import { NAV_ITEMS, type NavbarProps } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

/** Sliding pill that morphs behind the active tab. */
export default function PillIndicator({
  items = NAV_ITEMS,
  active,
  onChange,
}: NavbarProps) {
  return (
    <nav className="flex w-full items-center justify-around rounded-full border border-white/10 bg-neutral-900 p-1.5">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5"
          >
            {isActive && (
              <motion.span
                layoutId="pill-indicator"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex items-center gap-1.5 transition-colors",
                isActive ? "text-neutral-900" : "text-neutral-400",
              )}
            >
              <item.icon size={19} strokeWidth={2.1} />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  className="overflow-hidden whitespace-nowrap text-[13px] font-semibold"
                >
                  {item.label}
                </motion.span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
