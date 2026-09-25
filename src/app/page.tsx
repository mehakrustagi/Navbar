"use client";

import { useState } from "react";
import { Flame, Home, Settings } from "lucide-react";
import AppScreen from "@/components/AppScreen";
import Stage, { useTab } from "@/components/Stage";
import FigmaOrbNav from "@/components/navbars/FigmaOrbNav";
import LiquidNotch from "@/components/navbars/LiquidNotch";
import PillIndicator from "@/components/navbars/PillIndicator";
import LiquidGlassNav from "@/components/navbars/LiquidGlassNav";
import OrbNav3D from "@/components/navbars/OrbNav3D";
import ScoopNav, { CTA_GAP, ScoopCta } from "@/components/navbars/ScoopNav";
import OrbNavLiquid from "@/components/navbars/OrbNavLiquid";
import BouncingBall from "@/components/navbars/BouncingBall";
import type { NavItem } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

function Shell({
  appBg,
  bg,
  children,
}: {
  appBg: boolean;
  bg: string;
  children: React.ReactNode;
}) {
  if (appBg) return <AppScreen>{children}</AppScreen>;
  return (
    <Stage background={bg} tone="light" pad={false}>
      <div className="pb-7">{children}</div>
    </Stage>
  );
}

const NOTCH_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "settings", label: "Settings", icon: Settings },
];

function OrbDemo({
  bg,
  plainOrb,
  appBg,
}: {
  bg: string;
  plainOrb: boolean;
  appBg: boolean;
}) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <FigmaOrbNav plainOrb={plainOrb} />
    </Shell>
  );
}

function ScoopDarkDemo({
  bg,
  plainOrb,
  appBg,
}: {
  bg: string;
  plainOrb: boolean;
  appBg: boolean;
}) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <div className="flex items-end" style={{ gap: CTA_GAP }}>
        <ScoopNav tone="dark" plainOrb={plainOrb} />
        <ScoopCta tone="dark" />
      </div>
    </Shell>
  );
}

function ScoopLightDemo({
  bg,
  plainOrb,
  appBg,
}: {
  bg: string;
  plainOrb: boolean;
  appBg: boolean;
}) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <div className="flex items-end" style={{ gap: CTA_GAP }}>
        <ScoopNav tone="light" plainOrb={plainOrb} />
        <ScoopCta tone="light" />
      </div>
    </Shell>
  );
}

function Orb3DDemo({
  bg,
  plainOrb,
  appBg,
}: {
  bg: string;
  plainOrb: boolean;
  appBg: boolean;
}) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <OrbNav3D plainOrb={plainOrb} />
    </Shell>
  );
}

function LiquidGlassDemo({ bg, appBg }: { bg: string; appBg: boolean }) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <LiquidGlassNav />
    </Shell>
  );
}

function OrbLiquidDemo({ bg, appBg }: { bg: string; appBg: boolean }) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <OrbNavLiquid />
    </Shell>
  );
}

function PillDemo({ appBg }: { appBg: boolean }) {
  // slightly grey, so the dark bar is not sitting on pure white
  return (
    <Shell appBg={appBg} bg="#F3F3F4">
      <PillIndicator />
    </Shell>
  );
}

function LiquidNotchDemo() {
  const [active, setActive] = useTab("home");
  return (
    <Stage background="#f4f4f5">
      <LiquidNotch items={NOTCH_ITEMS} active={active} onChange={setActive} />
    </Stage>
  );
}

function BouncingBallDemo({ bg, appBg }: { bg: string; appBg: boolean }) {
  return (
    <Shell appBg={appBg} bg={bg}>
      <BouncingBall />
    </Shell>
  );
}

const TABS = [
  {
    id: "orb",
    name: "Orb Nav (Figma)",
    hint: "Drag the orb, release over an icon",
  },
  {
    id: "scoop-dark",
    name: "Scoop — Dark",
    hint: "Figma 301:3409 — scoop travels to the selected tab",
  },
  {
    id: "scoop-light",
    name: "Scoop — Light",
    hint: "Figma 301:3410 — same bar, light fill",
  },
  {
    id: "orb-3d",
    name: "Orb Nav — 3D Icons",
    hint: "3D icons spin and colour up when selected",
  },
  {
    id: "glass",
    name: "Liquid Glass",
    hint: "Lens magnifies the bar beneath it; drag it between tabs",
  },
  {
    id: "orb-liquid",
    name: "Orb Nav — Liquid",
    hint: "Notch stretches into a tail behind the orb, then snaps back",
  },
  {
    id: "liquid",
    name: "Liquid Notch",
    hint: "Exact circular notch, tap to move",
  },
  {
    id: "ball",
    name: "Bouncing Ball",
    hint: "Orb nav UI, jelly bar — drag or fling the orb",
  },
  { id: "pill", name: "Pill Indicator", hint: "Selected tab expands into a labelled pill" },
];

export default function Page() {
  const [tab, setTab] = useState("scoop-light");
  // Orb fill: the drifting aurora, or a plain white disc.
  const [orb, setOrb] = useState<"colour" | "white">("colour");
  const [screen, setScreen] = useState<"white" | "app">("app");
  const bg = "#FFFFFF";
  const appBg = screen === "app";
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-semibold text-neutral-900">
          Bottom Nav Lab
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {TABS.length} variants — one mounted at a time.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                t.id === tab
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <p className="text-xs text-neutral-400">{current.hint}</p>
          <span className="ml-auto inline-flex rounded-full bg-neutral-100 p-1">
            {(["white", "app"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setScreen(k)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                  screen === k
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                screen: {k}
              </button>
            ))}
          </span>
          <span className="inline-flex rounded-full bg-neutral-100 p-1">
            {(["colour", "white"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setOrb(k)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-colors",
                  orb === k
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                orb: {k}
              </button>
            ))}
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          {tab === "orb" && (
            <OrbDemo bg={bg} plainOrb={orb === "white"} appBg={appBg} />
          )}
          {tab === "orb-liquid" && <OrbLiquidDemo bg={bg} appBg={appBg} />}
          {tab === "glass" && <LiquidGlassDemo bg={bg} appBg={appBg} />}
          {tab === "orb-3d" && (
            <Orb3DDemo bg={bg} plainOrb={orb === "white"} appBg={appBg} />
          )}
          {tab === "scoop-dark" && (
            <ScoopDarkDemo bg={bg} plainOrb={orb === "white"} appBg={appBg} />
          )}
          {tab === "scoop-light" && (
            <ScoopLightDemo bg={bg} plainOrb={orb === "white"} appBg={appBg} />
          )}
          {tab === "liquid" && <LiquidNotchDemo />}
          {tab === "ball" && <BouncingBallDemo bg={bg} appBg={appBg} />}
          {tab === "pill" && <PillDemo appBg={appBg} />}
        </div>
      </div>
    </main>
  );
}
