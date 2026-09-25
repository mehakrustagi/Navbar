"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Phone shell every variant is previewed in. */
export default function Stage({
  children,
  background = "#1c1c1c",
  pad = true,
  tone = "dark",
}: {
  children: ReactNode;
  background?: string;
  pad?: boolean;
  /** Tone of the screen behind the bar, so the status row stays readable. */
  tone?: "dark" | "light";
}) {
  return (
    <div
      className="relative h-[620px] w-[375px] shrink-0 overflow-hidden rounded-[46px] shadow-2xl ring-1 ring-black/10"
      style={{ background }}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex items-center justify-between px-8 pt-5 text-[12px] font-semibold",
            tone === "light" ? "text-neutral-400" : "text-white/35",
          )}
        >
          <span>9:41</span>
          <span>100%</span>
        </div>
        <div className="flex-1" />
        <div className={cn("flex justify-center", pad ? "px-5 pb-7" : "pb-0")}>{children}</div>
      </div>
    </div>
  );
}

/** Small helper so each variant owns its own active-tab state. */
export function useTab(initial: string) {
  return useState(initial);
}
