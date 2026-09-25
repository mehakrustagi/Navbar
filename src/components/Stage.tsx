"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Phone shell every variant is previewed in. */
export default function Stage({
  children,
  background = "#1c1c1c",
  pad = true,
  tone = "dark",
  appBackdrop = false,
}: {
  children: ReactNode;
  background?: string;
  pad?: boolean;
  /** Tone of the screen behind the bar, so the status row stays readable. */
  tone?: "dark" | "light";
  /** Drop the real app screen's mesh gradient behind the bar. */
  appBackdrop?: boolean;
}) {
  return (
    <div
      className="relative h-[620px] w-[375px] shrink-0 overflow-hidden rounded-[46px] shadow-2xl ring-1 ring-black/10"
      style={{ background }}
    >
      {appBackdrop && (
        /* Figma 231:3139 — a 1130.689 box at (-369, -147) on a 393 screen,
           holding a 1530.69 SVG inset by -17.69% for its blur padding.
           Everything is scaled by 375/393 for this stage. */
        <img
          src="/figma/screen/bg.svg"
          alt=""
          className="pointer-events-none absolute max-w-none"
          style={{ width: 1460.6, height: 1460.6, left: -543, top: -331.1 }}
        />
      )}

      <div className="relative flex h-full flex-col">
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
