"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import {
  BAR_H,
  BAR_R,
  ICON_OFFSET,
  LEAD_SPRING,
  MAX_X,
  MIN_X,
  ORB_BASE,
  OrbDisc,
  ORB_ICON,
  ORB_R,
  PILL_H,
  PILL_W,
  SLOTS,
  SlotIcon,
  W,
  clamp,
  pillPath,
} from "./orb-kit";

/**
 * The selected state is cut out of the bar rather than floating on top of it:
 * the disc is the same fill as the bar, cradled in a notch whose shoulders
 * sweep back to the top edge. The only thing separating them is the gap, which
 * shows the screen through.
 */
const NOTCH_R = ORB_R + 6; // 6px gap between disc and bar
/** How far the cut's centre sits *below* the bar's top edge — this is what
 *  makes the notch drop lower and bite deeper into the bar. */
const NOTCH_DY = 12;
const TOP = ORB_R - NOTCH_DY + 8; // headroom above the bar's top line
const NOTCH_CY = TOP + NOTCH_DY; // centre of both the cut and the disc
const H = TOP + BAR_H;
const ICON_CY = TOP + ICON_OFFSET;
/** Static silhouette the shadow is cast from — see pillPath. */
const PILL = pillPath(TOP, W, BAR_H, BAR_R);


const BAR_FILL = "#FFFFFF";
const IDLE_ICON = "#0A0A0A";

const SHOULDER_REST = 20; // generous S-curve even when still
const SHOULDER_MAX = 30; // widens with travel speed
const SPEED_SCALE = 1500;

/* A row icon fades out as the disc closes on it. Hiding it only when it is the
   *selected* one is not enough: the disc is 50px wide but an icon sitting just
   outside that still pokes past its edge, which is the collision. Distances are
   measured centre-to-centre. */
const FADE_HIDDEN = ORB_R + 3; // fully hidden at or inside this
const FADE_VISIBLE = ORB_R + 21; // fully visible at or beyond this

/**
 * Bar outline with a circular bite of radius NOTCH_R centred on the top edge,
 * blended in by tangent-continuous fillets of radius `rf`. The gap around the
 * disc is exactly NOTCH_R - ORB_R at every position and every shoulder width.
 */
function buildPath(cx: number, rf: number) {
  const bottom = TOP + BAR_H;
  const sum = NOTCH_R + rf;
  // Fillet centre sits on y = TOP + rf, tangent to the top edge and externally
  // tangent to the cut. Solving both gives its horizontal offset D.
  const d = Math.sqrt(sum * sum - (NOTCH_DY - rf) * (NOTCH_DY - rf));
  const tx = (rf * d) / sum;
  const ty = rf + (rf * (NOTCH_DY - rf)) / sum;

  const lx = cx - d + tx;
  const rx = cx + d - tx;
  const ty_abs = TOP + ty;

  // Once the cut's centre drops below the top edge the arc can exceed a
  // semicircle, which needs the large-arc flag.
  const a1 = Math.atan2(ty_abs - NOTCH_CY, lx - cx);
  const a2 = Math.atan2(ty_abs - NOTCH_CY, rx - cx);
  const span = (((a1 - a2) * 180) / Math.PI + 360) % 360;
  const largeArc = span > 180 ? 1 : 0;

  const entry = clamp(cx - d, BAR_R, W - BAR_R);
  const exit = clamp(cx + d, BAR_R, W - BAR_R);

  return [
    `M ${BAR_R} ${TOP}`,
    `H ${entry}`,
    `A ${rf} ${rf} 0 0 1 ${lx} ${ty_abs}`,
    `A ${NOTCH_R} ${NOTCH_R} 0 ${largeArc} 0 ${rx} ${ty_abs}`,
    `A ${rf} ${rf} 0 0 1 ${exit} ${TOP}`,
    `H ${W - BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W} ${TOP + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W - BAR_R} ${bottom}`,
    `H ${BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 0 ${TOP + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${BAR_R} ${TOP}`,
    "Z",
  ].join(" ");
}

/** One row icon, faded by how close the disc is to it. */
function RowIcon({
  slot,
  cx,
  color,
}: {
  slot: (typeof SLOTS)[number];
  cx: MotionValue<number>;
  color: string;
}) {
  const opacity = useTransform(cx, (x) =>
    clamp((Math.abs(x - slot.cx) - FADE_HIDDEN) / (FADE_VISIBLE - FADE_HIDDEN), 0, 1),
  );
  const scale = useTransform(opacity, (o) => 0.55 + o * 0.45);
  return (
    <motion.span style={{ opacity, scale }}>
      <SlotIcon slot={slot} color={color} />
    </motion.span>
  );
}

export default function FigmaOrbNav({ plainOrb = false }: { plainOrb?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const activeSlot = SLOTS.find((s) => s.id === active)!;
  const hoveredSlot = hovered ? SLOTS.find((s) => s.id === hovered) : undefined;
  // The disc previews whatever it is hopping to.
  const discSlot = dragging && hoveredSlot ? hoveredSlot : activeSlot;

  const target = useMotionValue(activeSlot.cx);
  const cx = useSpring(target, LEAD_SPRING);

  // Smooth the raw velocity before it drives geometry — raw velocity jitters.
  const velocity = useVelocity(cx);
  const speed = useTransform(velocity, (v) => clamp(Math.abs(v) / SPEED_SCALE, 0, 1));
  const travel = useSpring(speed, { stiffness: 180, damping: 28 });
  const shoulder = useTransform(travel, (t) => SHOULDER_REST + t * (SHOULDER_MAX - SHOULDER_REST));

  const d = useTransform([cx, shoulder], ([x, s]: number[]) => buildPath(x, s));
  const iconX = useTransform(cx, (x) => x - PILL_W / 2);
  const discLeft = useTransform(cx, (x) => x - ORB_R);

  const nearest = (x: number) =>
    SLOTS.reduce((best, s) => (Math.abs(s.cx - x) < Math.abs(best.cx - x) ? s : best), SLOTS[0]);

  const xFrom = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return clamp(((e.clientX - rect.left) / rect.width) * W, MIN_X, MAX_X);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const x = xFrom(e);
    draggingRef.current = true;
    setDragging(true);
    setHovered(nearest(x).id);
    target.set(x);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const x = xFrom(e);
    setHovered(nearest(x).id);
    target.set(x);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const slot = nearest(xFrom(e));
    draggingRef.current = false;
    setDragging(false);
    setHovered(null);
    setActive(slot.id);
    target.set(slot.cx);
  };

  return (
    <div ref={ref} className="relative w-[335px] touch-none select-none" style={{ height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="pointer-events-none absolute inset-0 overflow-visible"
      >
        <defs>
          {/*
            Shadow-only filter. feDropShadow emits "shadow + source", which
            would paint the bar twice; building from SourceAlpha emits shadow
            alone, so each shape is drawn exactly once below.
          */}
          <filter id="bar-shadow" x="-30%" y="-80%" width="160%" height="320%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b1" />
            <feOffset in="b1" dy="2" result="o1" />
            <feFlood floodColor="#000000" floodOpacity="0.07" result="c1" />
            <feComposite in="c1" in2="o1" operator="in" result="s1" />

            <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="b2" />
            <feOffset in="b2" dy="10" result="o2" />
            <feFlood floodColor="#0B0B0F" floodOpacity="0.11" result="c2" />
            <feComposite in="c2" in2="o2" operator="in" result="s2" />

            <feMerge>
              <feMergeNode in="s2" />
              <feMergeNode in="s1" />
            </feMerge>
          </filter>

          {/* Grey rim gradient, running with the bar's diagonal. */}
          <linearGradient
            id="bar-rim"
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={TOP}
            x2={W}
            y2={TOP + BAR_H}
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#BCBCBC" />
          </linearGradient>

          <clipPath id="bar-clip">
            <motion.path d={d} />
          </clipPath>
          {/* Keep the shadow out of the notch — see ScoopNav. */}
          {/* maskUnits="userSpaceOnUse": a mask's region defaults to the
              object's bounding box inset by -10%/120%, which clips the blur
              and leaves hard horizontal cuts across the bar. */}
          <mask
            id="bar-shadow-mask"
            maskUnits="userSpaceOnUse"
            x={-160}
            y={-160}
            width={W + 320}
            height={H + 320}
          >
            <rect x={-160} y={-160} width={W + 320} height={H + 320} fill="white" />
            <motion.circle cx={cx} cy={NOTCH_CY} r={NOTCH_R} fill="black" />
          </mask>
        </defs>

        <g filter="url(#bar-shadow)" mask="url(#bar-shadow-mask)">
          <path d={PILL} fill="#000000" />
        </g>

        <motion.path d={d} fill={BAR_FILL} />
        {/* Inner 1px rim: stroked at 2 and clipped, so only the inside half shows. */}
        <g clipPath="url(#bar-clip)">
          <motion.path d={d} fill="none" stroke="url(#bar-rim)" strokeWidth={2} />
        </g>
      </svg>

      {/* Row icons. The selected one lives in the disc, so its slot sits empty
          — it comes back while dragging so the row still reads complete. */}
      {SLOTS.map((slot) => {
        const isActive = slot.id === active;
        return (
          <button
            key={slot.id}
            type="button"
            aria-label={slot.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              setActive(slot.id);
              target.set(slot.cx);
            }}
            className="absolute flex items-center justify-center"
            style={{
              left: slot.cx - PILL_W / 2,
              top: ICON_CY - PILL_H / 2,
              width: PILL_W,
              height: PILL_H,
            }}
          >
            <RowIcon slot={slot} cx={cx} color={IDLE_ICON} />
          </button>
        );
      })}

      {/* Painted after the row icons, so an icon the disc passes over is
          hidden behind it instead of colliding with it. */}
      {/* Selected disc: ellipses drifting over a white base. They multiply
          rather than screen — screen over white is just white. */}
      <motion.div
        className="pointer-events-none absolute overflow-hidden rounded-full"
        style={{
          x: discLeft,
          top: NOTCH_CY - ORB_R,
          width: ORB_R * 2,
          height: ORB_R * 2,
          background: ORB_BASE,
          boxShadow: `0 ${ORB_R * 0.2}px ${ORB_R * 0.42}px -${ORB_R * 0.22}px rgba(58,48,70,0.22)`,
        }}
      >
        <OrbDisc r={ORB_R} plain={plainOrb} />
      </motion.div>

      {/* The selected icon, riding in the notch and wearing the tab's accent. */}
      <motion.div
        className="pointer-events-none absolute top-0 left-0 flex items-center justify-center"
        style={{ x: iconX, y: NOTCH_CY - PILL_H / 2, width: PILL_W, height: PILL_H }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={discSlot.id}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
          >
            <SlotIcon slot={discSlot} color={ORB_ICON} />
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
