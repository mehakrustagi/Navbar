"use client";

import { useRef, useState } from "react";
import {
  type MotionValue,
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import {
  LEAD_SPRING,
  ORB_BASE,
  OrbDisc,
  ORB_ICON,
  SLOTS,
  SlotIcon,
  clamp,
  pillPath,
} from "./orb-kit";

/* Same notch geometry as Orb Nav — a circular cut cradling the disc with a
   uniform gap, blended by tangent-continuous fillets. Only the bar's fill and
   rim come from the Figma scoop nodes (301:3409 dark, 301:3410 light).
   The bar keeps Figma's 52.46 height and 26.23 radius but runs 335 wide: at
   the node's 272.5 the shoulders leave only 34.5px between slots, which the
   20px icons cannot live in. */
/* Compact, leaving room for the ingress CTA beside it:
   268 bar + 12 gap + 46 CTA = 326, i.e. 33.5px margins on the 393 screen.
   Depth is 31 of 46 (67%) and the slope ratio holds at 0.71. */
const W = 268;
const BAR_H = 46;
const BAR_R = BAR_H / 2;
export const BAR_W = W;
export const CTA_SIZE = 46;
export const CTA_GAP = 12;

const DISC_R = 20;
const NOTCH_R = DISC_R + 6; // 6px gap, uniform at every position
const NOTCH_DY = 5; // shallower cut: the disc rides higher and the sides flatten
const TOP = DISC_R - NOTCH_DY + 8;
const NOTCH_CY = TOP + NOTCH_DY;
const H = TOP + BAR_H;
const ICON_CY = TOP + BAR_H / 2;
/** Static silhouette the shadow is cast from — see pillPath. */
const PILL = pillPath(TOP, W, BAR_H, BAR_R);

/* The outer slots can only come as close to the bar's ends as the notch's own
   reach allows: BAR_R + sqrt((NOTCH_R+rf)^2 - (NOTCH_DY-rf)^2). Easing the
   resting shoulder from 20 to 10 pulls that limit in from 77px to 67px, which
   is what lets the icons spread wider. */
/* The wave. Depth over horizontal reach is what reads as slope: at DY 11 /
   shoulder 14 that ratio was 0.93 — nearly 45 degrees. Shallower cut plus a
   wider fillet brings it to 0.72, which is the long flat sweep. */
const SHOULDER_REST = 20;
const SHOULDER_MAX = 30;

const SPEED_SCALE = 1500;

const SLOT_X = [66.5, 111.5, 156.5, 201.5];
const MIN_X = SLOT_X[0];
const MAX_X = SLOT_X[SLOT_X.length - 1];

const FADE_HIDDEN = DISC_R + 3;
const FADE_VISIBLE = DISC_R + 20;

export type ScoopTone = "dark" | "light";

const TONE = {
  dark: {
    // Figma's gradient vector runs far outside the bar; these are the colours
    // it actually resolves to at the bar's own edges.
    fill: ["#090909", "#434343"] as const,
    rim: ["#8A8A8A", "#2A2A2A", "#8A8A8A"] as const,
    idle: "rgba(255,255,255,0.55)",
  },
  light: {
    // Translucent white rather than a grey value: over the app screen it
    // picks up whatever is behind it, so it reads as light glass instead of a
    // grey slab. (The node's #E5E5E5 -> #ECECEC moved only 3 levels across the
    // bar, which the browser dithered into visible grain.)
    fill: ["rgba(255,255,255,0.78)", "rgba(255,255,255,0.66)"] as const,
    rim: ["#FFFFFF", "#EDEDED", "#FFFFFF"] as const,
    idle: "rgba(0,0,0,0.38)",
  },
} as const;

function buildPath(cx: number, rf: number) {
  const bottom = TOP + BAR_H;
  const sum = NOTCH_R + rf;
  const d = Math.sqrt(sum * sum - (NOTCH_DY - rf) * (NOTCH_DY - rf));
  const tx = (rf * d) / sum;
  const ty = rf + (rf * (NOTCH_DY - rf)) / sum;

  const lx = cx - d + tx;
  const rx = cx + d - tx;
  const tyAbs = TOP + ty;

  // Once the cut's centre drops below the top edge the arc can exceed a
  // semicircle, which needs the large-arc flag.
  const a1 = Math.atan2(tyAbs - NOTCH_CY, lx - cx);
  const a2 = Math.atan2(tyAbs - NOTCH_CY, rx - cx);
  const span = (((a1 - a2) * 180) / Math.PI + 360) % 360;
  const largeArc = span > 180 ? 1 : 0;

  return [
    `M ${BAR_R} ${TOP}`,
    `H ${clamp(cx - d, BAR_R, W - BAR_R)}`,
    `A ${rf} ${rf} 0 0 1 ${lx} ${tyAbs}`,
    `A ${NOTCH_R} ${NOTCH_R} 0 ${largeArc} 0 ${rx} ${tyAbs}`,
    `A ${rf} ${rf} 0 0 1 ${clamp(cx + d, BAR_R, W - BAR_R)} ${TOP}`,
    `H ${W - BAR_R}`,
    // Fully rounded caps: true semicircular ends.
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W} ${TOP + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W - BAR_R} ${bottom}`,
    `H ${BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 0 ${TOP + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${BAR_R} ${TOP}`,
    "Z",
  ].join(" ");
}

function RowIcon({
  slot,
  x,
  cx,
  color,
}: {
  slot: (typeof SLOTS)[number];
  x: number;
  cx: MotionValue<number>;
  color: string;
}) {
  const opacity = useTransform(cx, (v) =>
    clamp((Math.abs(v - x) - FADE_HIDDEN) / (FADE_VISIBLE - FADE_HIDDEN), 0, 1),
  );
  const scale = useTransform(opacity, (o) => 0.55 + o * 0.45);
  return (
    <motion.span style={{ opacity, scale }}>
      <SlotIcon slot={slot} color={color} />
    </motion.span>
  );
}

export default function ScoopNav({
  tone = "dark",
  plainOrb = false,
}: {
  tone?: ScoopTone;
  plainOrb?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1);
  const [hovered, setHovered] = useState<number | null>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const t = TONE[tone];
  const uid = `scoop-${tone}`;
  const idx = dragging && hovered !== null ? hovered : active;

  const target = useMotionValue(SLOT_X[active]);
  const cx = useSpring(target, LEAD_SPRING);

  const velocity = useVelocity(cx);
  const speed = useTransform(velocity, (v) => clamp(Math.abs(v) / SPEED_SCALE, 0, 1));
  const travel = useSpring(speed, { stiffness: 180, damping: 28 });
  const shoulder = useTransform(travel, (v) => SHOULDER_REST + v * (SHOULDER_MAX - SHOULDER_REST));

  const d = useTransform([cx, shoulder], ([x, s]: number[]) => buildPath(x, s));
  const discLeft = useTransform(cx, (x) => x - DISC_R);
  const iconLeft = useTransform(cx, (x) => x - 16);

  const nearest = (x: number) =>
    SLOT_X.reduce((best, sx, i) => (Math.abs(sx - x) < Math.abs(SLOT_X[best] - x) ? i : best), 0);

  const xFrom = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return clamp(((e.clientX - rect.left) / rect.width) * W, MIN_X, MAX_X);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const x = xFrom(e);
    draggingRef.current = true;
    setDragging(true);
    setHovered(nearest(x));
    target.set(x);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const x = xFrom(e);
    setHovered(nearest(x));
    target.set(x);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const i = nearest(xFrom(e));
    draggingRef.current = false;
    setDragging(false);
    setHovered(null);
    setActive(i);
    target.set(SLOT_X[i]);
  };

  return (
    <div ref={ref} className="relative touch-none select-none" style={{ width: W, height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <defs>

          <linearGradient
            id={`${uid}-fill`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={TOP}
            x2={W}
            y2={TOP + BAR_H}
          >
            <stop stopColor={t.fill[0]} />
            <stop offset="1" stopColor={t.fill[1]} />
          </linearGradient>

          {/* Grey rim gradient, running with the bar's diagonal. */}
          <linearGradient
            id={`${uid}-rim`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={TOP}
            x2={W}
            y2={TOP}
          >
            <stop stopColor={t.rim[0]} />
            <stop offset="0.5" stopColor={t.rim[1]} />
            <stop offset="1" stopColor={t.rim[2]} />
          </linearGradient>

          {/*
            Film grain over the fill. feTurbulence is expensive, but it runs on
            a static rect, so it rasterises once — the animated clip below is
            what moves, and clipping is cheap.
          */}
          <filter
            id={`${uid}-noise`}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
              result="turb"
            />
            <feColorMatrix in="turb" type="saturate" values="0" />
          </filter>


          {/* Figma: 0/8/16 at 8% black, plus 0/0/4 at 4%. Built from
              SourceAlpha so the bar itself is painted only once. */}
          <filter
            id={`${uid}-shadow`}
            x="-25%"
            y="-70%"
            width="150%"
            height="300%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b1" />
            <feOffset in="b1" dy="8" result="o1" />
            <feFlood floodColor="#000000" floodOpacity="0.06" result="c1" />
            <feComposite in="c1" in2="o1" operator="in" result="s1" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b2" />
            <feFlood floodColor="#000000" floodOpacity="0.03" result="c2" />
            <feComposite in="c2" in2="b2" operator="in" result="s2" />
            <feMerge>
              <feMergeNode in="s1" />
              <feMergeNode in="s2" />
            </feMerge>
          </filter>


          {/* The shadow is a blurred copy of the whole pill, so it also paints
              under the bar's own footprint. That was invisible while the fill
              was opaque; now the fill is translucent it shows through as a
              grey cast. Knock the pill out of the shadow so only the spill
              beyond its edge survives — which also keeps it out of the notch. */}
          {/* maskUnits="userSpaceOnUse": a mask's region defaults to the
              object's bounding box inset by -10%/120%, which clips the blur
              and leaves hard horizontal cuts across the bar. */}
          <mask
            id={`${uid}-shadow-mask`}
            maskUnits="userSpaceOnUse"
            x={-160}
            y={-160}
            width={W + 320}
            height={H + 320}
          >
            <rect x={-160} y={-160} width={W + 320} height={H + 320} fill="white" />
            <path d={PILL} fill="black" />
          </mask>

          <clipPath id={`${uid}-clip`}>
            <motion.path d={d} />
          </clipPath>
        </defs>

        <g filter={`url(#${uid}-shadow)`} mask={`url(#${uid}-shadow-mask)`}>
          <path d={PILL} fill="#000000" />
        </g>
        <motion.path d={d} fill={`url(#${uid}-fill)`} />
        {/* Grain, clipped to the bar. */}
        <g
          clipPath={`url(#${uid}-clip)`}
          opacity={tone === "dark" ? 0.16 : 0.035}
          style={{ mixBlendMode: "overlay" }}
        >
          <rect
            x={0}
            y={TOP}
            width={W}
            height={BAR_H}
            fill="#000000"
            filter={`url(#${uid}-noise)`}
          />
        </g>

        {/* Inner 1px rim: stroked at 2 and clipped to the shape. */}
        <g clipPath={`url(#${uid}-clip)`}>
          <motion.path d={d} fill="none" stroke={`url(#${uid}-rim)`} strokeWidth={1.6} />
        </g>
      </svg>

      {SLOTS.map((slot, i) => (
        <button
          key={slot.id}
          type="button"
          aria-label={slot.label}
          aria-current={i === active ? "page" : undefined}
          onClick={() => {
            setActive(i);
            target.set(SLOT_X[i]);
          }}
          className="absolute flex items-center justify-center"
          style={{ left: SLOT_X[i] - 20, top: ICON_CY - 20, width: 40, height: 40 }}
        >
          <RowIcon slot={slot} x={SLOT_X[i]} cx={cx} color={t.idle} />
        </button>
      ))}

      {/* The disc, cradled by the notch — same as Orb Nav. */}
      <motion.div
        className="pointer-events-none absolute overflow-hidden rounded-full"
        style={{
          x: discLeft,
          top: NOTCH_CY - DISC_R,
          width: DISC_R * 2,
          height: DISC_R * 2,
          background: ORB_BASE,
          // Lit from the top left: a bright inner edge up there, a darker one
          // opposite, and a contact shadow under it. That trio is what turns a
          // flat circle into a ball.
          boxShadow: [
            "inset 0 3px 6px rgba(255,255,255,0.95)",
            "inset 0 -5px 10px rgba(120,110,130,0.16)",
            "inset -4px -3px 9px rgba(120,110,130,0.10)",
            "0 5px 10px -4px rgba(60,50,70,0.20)",
          ].join(", "),
        }}
      >
        <OrbDisc r={DISC_R} plain={plainOrb} />
      </motion.div>

      {/* Selected icon, riding in the disc. */}
      <motion.div
        className="pointer-events-none absolute flex items-center justify-center"
        style={{ x: iconLeft, top: NOTCH_CY - 16, width: 32, height: 32 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={SLOTS[idx].id}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
          >
            <SlotIcon slot={SLOTS[idx]} color={ORB_ICON} />
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}

/** Splits ingress, sitting beside the bar and wearing the same surface. */
export function ScoopCta({
  tone = "dark",
  label = "Splits",
  onClick,
}: {
  tone?: ScoopTone;
  label?: string;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className="flex items-center justify-center rounded-full"
      style={{
        width: CTA_SIZE,
        height: CTA_SIZE,
        background: `linear-gradient(135deg, ${t.fill[0]}, ${t.fill[1]})`,
        boxShadow: `inset 0 0 0 1px ${t.rim}, 0 8px 16px rgba(0,0,0,0.08), 0 0 4px rgba(0,0,0,0.04)`,
      }}
    >
      <img
        src="/figma/glass/splits.png"
        alt=""
        width={26}
        height={26}
        className="block max-w-none"
      />
    </motion.button>
  );
}
