"use client";

import { useState } from "react";
import type { Variant } from "@/components/navbars/registry";
import { cn } from "@/lib/utils";

const SURFACES: Record<Variant["surface"], string> = {
  dark: "bg-neutral-950",
  light: "bg-white dark:bg-neutral-950",
  gradient: "bg-gradient-to-b from-indigo-600 via-purple-700 to-neutral-950",
};

export default function PhoneFrame({ variant }: { variant: Variant }) {
  const [active, setActive] = useState(variant.items[0].id);
  const { Component } = variant;

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative h-[420px] w-[236px] overflow-hidden rounded-[38px] border-[7px] border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className={cn("flex h-full flex-col", SURFACES[variant.surface])}>
          <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-neutral-500">
            <span>9:41</span>
            <span className="h-4 w-14 rounded-full bg-neutral-800/70" />
            <span>100%</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-[11px] font-medium tracking-[0.18em] text-neutral-500 uppercase">
              {active}
            </span>
            <div className="h-24 w-full rounded-2xl border border-dashed border-neutral-500/30" />
          </div>

          <div className={cn("pb-4", variant.inset ? "px-3" : "px-0")}>
            <Component items={variant.items} active={active} onChange={setActive} />
          </div>
        </div>
      </div>

      <figcaption className="w-[236px]">
        <p className="text-sm font-semibold text-neutral-900">{variant.name}</p>
        <p className="text-xs leading-relaxed text-neutral-500">{variant.note}</p>
      </figcaption>
    </figure>
  );
}
