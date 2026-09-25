"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/* Geometry taken 1:1 from Figma node 295:3274 (bar 335 x 50).
   Shared by every orb-styled nav so they cannot drift apart. */
export const W = 335;
export const BAR_H = 50;
export const BAR_R = 25;

export const ORB_R = 25; // Rectangle 240647736 — white rim
export const ORB_INNER = 44; // Rectangle 240647956 — black disc
export const ORB_GLOW = 65; // "Nav 1" glow texture

/* Selected-state disc / tap-target box — Rectangle 34647274. */
export const PILL_W = 41;
export const PILL_H = 40;
export const PILL_R = 20;

/** Icon centre within the 50px bar. */
export const ICON_OFFSET = 25;
/** Snapmap's slot — where a fixed orb lives. */
export const ORB_HOME = 167;

export type Slot = {
  id: string;
  label: string;
  cx: number;
  /** Mask SVG — tintable to any colour. */
  src?: string;
  /** Full-colour render. When present it wins, and `color` is ignored.
   *  Unset for now — the flat mask icons read better on the bar. */
  img?: string;
  w: number;
  h: number;
  avatar?: boolean;
  theme: Theme;
};

export type Theme = {
  /** Disc behind the icon. */
  disc: string;
  /** Hue shift applied to the Figma glow texture, in degrees. */
  hue: number;
  /** Three drifting aurora blobs, brightest first. */
  aurora: [string, string, string];
  /** Artwork from the design, shown only when the variant opts in. */
  art?: string;
  /** Colour the icon takes when it is the selected one. */
  accent: string;
};

/* The blue glow + map artwork are Snapmap's. Every other tab re-skins the orb:
   its own disc gradient, and the same Figma glow texture hue-shifted to match. */
const THEMES: Record<string, Theme> = {
  snapmap: {
    disc: "radial-gradient(circle at 35% 28%, #7FD2FF, #1B6EF3 58%, #06266E 100%)",
    accent: "#4DA3FF",
    hue: 0,
    aurora: ["#8FE3FF", "#2F7BFF", "#7C4DFF"],
    art: "/figma/orb-mask.svg",
  },
  home: {
    disc: "radial-gradient(circle at 50% 42%, #3A1A05, #120802 72%, #050201 100%)",
    accent: "#F2A03D",
    hue: 173,
    aurora: ["#FFE0A3", "#FF8A3D", "#FF4D6D"],
  },
  docvault: {
    disc: "radial-gradient(circle at 50% 42%, #042C22, #01100C 72%, #000504 100%)",
    accent: "#3DDC97",
    hue: 305,
    aurora: ["#A8FFD8", "#19C89A", "#0E8FA8"],
  },
  dream: {
    disc: "radial-gradient(circle at 50% 42%, #1E0C3F, #0A0318 72%, #030109 100%)",
    accent: "#A78BFA",
    hue: 53,
    aurora: ["#E9CCFF", "#8B5CF6", "#4C2BC9"],
  },
};

/* Five slots. near_me sits at 167 — it reads as "missing" in the Figma frame
   because it is the selected one, and the selected icon lives inside the orb. */
/* Four slots, inset to 79..256 so the notch's shoulders always have room to
   sweep back to the bar's top edge without hitting the rounded ends. */
export const SLOTS: Slot[] = [
  {
    id: "snapmap",
    label: "Snapmap",
    cx: 79,
    src: "/figma/near_me.svg",
    w: 16,
    h: 16,
    theme: THEMES.snapmap,
  },
  {
    id: "home",
    label: "Home",
    cx: 138,
    src: "/figma/home.svg",
    w: 20,
    h: 20,
    theme: THEMES.home,
  },
  {
    id: "docvault",
    label: "Doc Vault",
    cx: 197,
    src: "/figma/folder.svg",
    w: 20,
    h: 20,
    theme: THEMES.docvault,
  },
  {
    id: "dream",
    label: "Dream Tab",
    cx: 256,
    src: "/figma/cloud.svg",
    w: 20,
    h: 20,
    theme: THEMES.dream,
  },
];

export const MIN_X = SLOTS[0].cx;
export const MAX_X = SLOTS[SLOTS.length - 1].cx;
export const SNAPMAP = SLOTS.find((s) => s.id === "snapmap")!;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/* Shared motion. Critical damping is 2*sqrt(stiffness * mass); at or above it
   the spring settles without oscillating. Every orb nav uses these, so travel
   feels identical across variants. */
/* Smoked glass: light enough to read as glass, dark enough that white icons
   stay legible against a milky screen. Shared so every variant matches. */
export const GLASS_TOP = "rgba(60,60,76,0.52)";
export const GLASS_BOTTOM = "rgba(34,34,46,0.44)";
export const GLASS_RIM = "rgba(255,255,255,0.34)";
export const GLASS_BLUR = "blur(20px) saturate(135%)";
/* Orb aurora palette, tinted 61.3% toward white. Multiply darkens wherever two
   ellipses cross, so full-strength hues drove three-way overlaps down to
   near-black; these tints keep the darkest overlap at ~0.41 luminance, which
   is what lets the colours merge softly instead of bruising. */
export const ORB_BASE = "#FFFFFF";
export const ORB_SHEEN = "rgba(255,255,255,0.10)";
/** Icon colour inside the orb — dark, since the orb is light. */
export const ORB_ICON = "#141018";
export const ORB_ELLIPSES = ["#BBBEF7", "#E0B2E7", "#EAA8A8", "#F8F0BE", "#FBD9A1"] as const;

export const IDLE_ICON = "#FFFFFF";

export const LEAD_SPRING = { stiffness: 300, damping: 34, mass: 0.85 }; // critical 31.9
export const TRAIL_SPRING = { stiffness: 150, damping: 28, mass: 1 }; // critical 24.5

/**
 * Plain pill silhouette. Shadows are cast from this rather than from the live
 * notched path: an SVG filter re-runs its Gaussian blurs every time `d`
 * changes, so filtering the animated path meant two full-bar blurs per frame
 * while dragging. The notch sits on the top edge and the shadow is offset
 * downward, so the cast is indistinguishable.
 */
export function pillPath(top: number, w: number, h: number, r: number) {
  return [
    `M ${r} ${top}`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${top + r}`,
    `V ${top + h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${top + h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${top + h - r}`,
    `V ${top + r}`,
    `A ${r} ${r} 0 0 1 ${r} ${top}`,
    "Z",
  ].join(" ");
}

/** Bar elevation: a tight contact shadow plus a soft one for depth beneath.
 *  Emits shadow only — the bar is painted separately, unfiltered. */
export function BarShadow({ id }: { id: string }) {
  return (
    <filter id={id} x="-30%" y="-80%" width="160%" height="320%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="b1" />
      <feOffset in="b1" dy="2" result="o1" />
      <feFlood floodColor="#000000" floodOpacity="0.10" result="f1" />
      <feComposite in="f1" in2="o1" operator="in" result="contact" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b2" />
      <feOffset in="b2" dy="12" result="o2" />
      <feFlood floodColor="#0B0B0F" floodOpacity="0.20" result="f2" />
      <feComposite in="f2" in2="o2" operator="in" result="depth" />
      <feMerge>
        <feMergeNode in="depth" />
        <feMergeNode in="contact" />
      </feMerge>
    </filter>
  );
}

export function SlotIcon({
  slot,
  color = "#ffffff",
  size = 1,
  /** Dims the full-colour art for an unselected slot. */
  muted = false,
}: {
  slot: Slot;
  /** Only applies to mask icons; full-colour art ignores it. */
  color?: string;
  size?: number;
  muted?: boolean;
}) {
  if (slot.avatar) {
    const s = 20 * size;
    return (
      <span className="block overflow-hidden rounded-full" style={{ width: s, height: s }}>
        {/* Figma offsets the photo by -5.405, +1.532 inside the 20px circle. */}
        <img
          src="/figma/avatar-b.png"
          alt=""
          className="max-w-none"
          style={{
            width: 30.541 * size,
            height: 20.36 * size,
            marginLeft: -5.405 * size,
            marginTop: 1.532 * size,
          }}
        />
      </span>
    );
  }

  if (slot.img) {
    return (
      <img
        src={slot.img}
        alt=""
        className="block max-w-none"
        style={{
          width: slot.w * size,
          height: slot.h * size,
          // These renders carry their own gradient, so an unselected slot is
          // dimmed rather than recoloured.
          filter: muted ? "saturate(0.35) brightness(0.92) opacity(0.75)" : undefined,
        }}
      />
    );
  }

  return (
    <span
      className="block"
      style={{
        width: slot.w * size,
        height: slot.h * size,
        backgroundColor: color,
        WebkitMaskImage: `url(${slot.src})`,
        maskImage: `url(${slot.src})`,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

/**
 * The selected disc, shaded as a ball: aurora field, a tight specular up
 * where the light is, shading falling off to the opposite edge, and a bounce
 * highlight along the bottom rim. Shared so every nav's disc matches.
 */
export function OrbDisc({ r, plain = false }: { r: number; plain?: boolean }) {
  return (
    <>
      {/* Body shading first. Stacking it *over* the colour was what turned the
          orb to chrome — the shading, sheen and rim wash together desaturated
          the aurora to silver. Shade the ball, then lay the colour on top. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 31% 24%, rgba(255,255,255,0) 38%, rgba(118,108,128,0.15) 78%, rgba(96,86,110,0.26) 100%)",
        }}
      />

      {!plain &&
        ORB_ELLIPSES.map((color, i) => (
          <span
            key={color}
            className={`orb-ellipse orb-e${i + 1}`}
            style={{ background: `radial-gradient(circle, ${color}, transparent 68%)` }}
          />
        ))}

      {/* Edge wash, pulled right back: it was bleaching the colour at the rim. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 74%, rgba(255,255,255,0.4) 100%)",
        }}
      />

      {/* Bounce light along the lower rim — what stops a ball reading flat. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(60% 40% at 62% 96%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%)",
        }}
      />

      {/* Specular: small and tight, so it reads as a highlight not a wash. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(30% 24% at 31% 23%, rgba(255,255,255,0.95), rgba(255,255,255,0) 68%)",
        }}
      />

      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: `inset 0 ${r * 0.12}px ${r * 0.24}px rgba(255,255,255,0.8), inset 0 -${r * 0.2}px ${r * 0.36}px rgba(110,100,124,0.2)`,
        }}
      />
    </>
  );
}

/**
 * The orb itself: white rim (50) → black disc (44) → skin (44) → glow (65).
 * The skin is either the design's artwork or the tab's aurora gradients, and
 * crossfades when `skinKey` changes.
 */
export function Orb({
  theme,
  skinKey,
  children,
}: {
  theme: Theme;
  skinKey: string;
  children?: ReactNode;
}) {
  const inset = (ORB_GLOW - ORB_INNER) / 2;
  return (
    /* No filter on this wrapper: it would create a stacking context and
       isolate the glow's mix-blend-mode, leaving its black backing visible. */
    <div className="relative h-full w-full">
      <img
        src="/figma/orb-50.svg"
        alt=""
        width={ORB_R * 2}
        height={ORB_R * 2}
        className="absolute"
        style={{
          left: (ORB_GLOW - ORB_R * 2) / 2,
          top: (ORB_GLOW - ORB_R * 2) / 2,
        }}
      />
      <img
        src="/figma/orb-44.svg"
        alt=""
        width={ORB_INNER}
        height={ORB_INNER}
        className="absolute"
        style={{ left: inset, top: inset }}
      />

      <AnimatePresence initial={false}>
        <motion.div
          key={skinKey}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          {!theme.art && (
            <span
              className="absolute overflow-hidden rounded-full"
              style={{
                left: inset,
                top: inset,
                width: ORB_INNER,
                height: ORB_INNER,
                background: theme.disc,
              }}
            >
              <span
                className="aurora-blob aurora-a"
                style={{
                  background: `radial-gradient(circle, ${theme.aurora[0]}, transparent 62%)`,
                }}
              />
              <span
                className="aurora-blob aurora-b"
                style={{
                  background: `radial-gradient(circle, ${theme.aurora[1]}, transparent 64%)`,
                }}
              />
              <span
                className="aurora-blob aurora-c"
                style={{
                  background: `radial-gradient(circle, ${theme.aurora[2]}, transparent 66%)`,
                }}
              />
            </span>
          )}

          {theme.art && (
            <img
              src={theme.art}
              alt=""
              width={ORB_INNER}
              height={ORB_INNER}
              className="absolute"
              style={{ left: inset, top: inset }}
            />
          )}

          {theme.art && (
            /* Clipped to the orb's 50px rim. The glow PNG is a blue sphere on
               a black field that only disappears because it blends; clipping
               guarantees it can never paint a dark ring onto the bar. */
            <span
              className="absolute overflow-hidden rounded-full"
              style={{
                left: (ORB_GLOW - ORB_R * 2) / 2,
                top: (ORB_GLOW - ORB_R * 2) / 2,
                width: ORB_R * 2,
                height: ORB_R * 2,
              }}
            >
              <img
                src="/figma/orb-glow.png"
                alt=""
                width={ORB_GLOW}
                height={ORB_GLOW}
                className="max-w-none object-cover mix-blend-lighten"
                style={{
                  marginLeft: -(ORB_GLOW - ORB_R * 2) / 2,
                  marginTop: -(ORB_GLOW - ORB_R * 2) / 2,
                  filter: `hue-rotate(${theme.hue}deg)`,
                }}
              />
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
