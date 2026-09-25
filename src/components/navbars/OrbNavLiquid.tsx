"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  BAR_H,
  BAR_R,
  BarShadow,
  ICON_OFFSET,
  MAX_X,
  MIN_X,
  ORB_GLOW,
  ORB_R,
  LEAD_SPRING,
  Orb,
  PILL_H,
  PILL_W,
  SLOTS,
  SlotIcon,
  TRAIL_SPRING,
  W,
  clamp,
  pillPath,
} from "./orb-kit";

const NOTCH_R = 31; // Ellipse 4011, centred on the bar's top line
const TOP = 31.5;
const H = TOP + BAR_H;
const ICON_CY = TOP + ICON_OFFSET;
const PILL = pillPath(TOP, W, BAR_H, BAR_R);

const ORB_RING_W = 3.5; // white collar drawn around the orb
const MAX_TAIL = 76; // how far the notch is allowed to stretch behind the orb
const SHOULDER_MAX = 14; // fillet growth while travelling

/**
 * The notch is the hull of two circles of radius NOTCH_R — one under the orb
 * (leading) and one lagging behind it (trailing) — so it stretches into a
 * capsule while moving and collapses back to a perfect circle at rest.
 * The leading end is always a true circle around the orb, which keeps the
 * white gap at exactly 6px no matter how far the tail is drawn out.
 */
function buildPath(lead: number, trail: number, rf: number) {
  const top = TOP;
  const bottom = TOP + BAR_H;
  const left = Math.min(lead, trail);
  const right = Math.max(lead, trail);

  const live = rf > 0.01;
  const sum = NOTCH_R + rf;
  const d = live ? Math.sqrt(NOTCH_R * NOTCH_R + 2 * NOTCH_R * rf) : NOTCH_R;
  const tx = live ? (d * rf) / sum : 0;
  const ty = live ? rf - (rf * rf) / sum : 0;

  const entry = clamp(left - d, BAR_R, W - BAR_R);
  const exit = clamp(right + d, BAR_R, W - BAR_R);

  return [
    `M ${BAR_R} ${top}`,
    `H ${entry}`,
    `A ${rf} ${rf} 0 0 1 ${left - d + tx} ${top + ty}`,
    `A ${NOTCH_R} ${NOTCH_R} 0 0 0 ${left} ${top + NOTCH_R}`,
    `L ${right} ${top + NOTCH_R}`,
    `A ${NOTCH_R} ${NOTCH_R} 0 0 0 ${right + d - tx} ${top + ty}`,
    `A ${rf} ${rf} 0 0 1 ${exit} ${top}`,
    `H ${W - BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W} ${top + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W - BAR_R} ${bottom}`,
    `H ${BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 0 ${top + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${BAR_R} ${top}`,
    "Z",
  ].join(" ");
}

export default function OrbNavLiquid() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const activeSlot = SLOTS.find((s) => s.id === active)!;
  const hoveredSlot = hovered ? SLOTS.find((s) => s.id === hovered) : undefined;
  const orbSlot = dragging && hoveredSlot ? hoveredSlot : activeSlot;

  const target = useMotionValue(activeSlot.cx);
  // Two springs: the orb leads, the notch follows a beat later. The gap
  // between them is the tail.
  const lead = useSpring(target, LEAD_SPRING);
  const trailRaw = useSpring(lead, TRAIL_SPRING);
  const trail = useTransform(
    [lead, trailRaw],
    ([l, t]: number[]) => l + clamp(t - l, -MAX_TAIL, MAX_TAIL),
  );

  const stretch = useTransform([lead, trail], ([l, t]: number[]) =>
    clamp(Math.abs(l - t) / MAX_TAIL, 0, 1),
  );
  const shoulder = useTransform(stretch, (v) => v * SHOULDER_MAX);
  const d = useTransform([lead, trail, shoulder], ([l, t, rf]: number[]) =>
    buildPath(l, t, rf),
  );

  // The orb stretches along its travel, in step with the notch.
  const orbLeft = useTransform(lead, (x) => x - ORB_GLOW / 2);
  const orbScaleX = useTransform(stretch, (v) => 1 + v * 0.1);
  const orbScaleY = useTransform(stretch, (v) => 1 - v * 0.07);

  const nearest = (x: number) =>
    SLOTS.reduce(
      (best, s) => (Math.abs(s.cx - x) < Math.abs(best.cx - x) ? s : best),
      SLOTS[0],
    );

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
    <div
      ref={ref}
      className="relative w-[335px] touch-none select-none"
      style={{ height: H }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          <BarShadow id="liquid-shadow" />
        </defs>
        <g filter="url(#liquid-shadow)">
          <path d={PILL} fill="#000000" />
        </g>
        <motion.path d={d} fill="#ffffff" />
        {/* Fills the notch so nothing dark frames the orb. */}
        <motion.circle cx={lead} cy={TOP} r={NOTCH_R} fill="#ffffff" />
        {/* White collar hugging the orb, on top of its own 3px rim. */}
        <motion.circle
          cx={lead}
          cy={TOP + 1}
          r={ORB_R + ORB_RING_W / 2}
          fill="none"
          stroke="#ffffff"
          strokeWidth={ORB_RING_W}
        />
      </svg>

      {SLOTS.map((slot) => {
        const isActive = slot.id === active;
        const isHovered = dragging && hovered === slot.id;
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
            <motion.span
              className="relative"
              animate={{
                scale: isHovered ? 1.22 : 1,
                opacity: isActive && !dragging ? 0 : 1,
              }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <SlotIcon slot={slot} color="#0a0a0a" />
            </motion.span>
          </button>
        );
      })}

      <motion.div
        className="pointer-events-none absolute top-0 left-0"
        style={{
          x: orbLeft,
          y: TOP + 1 - ORB_GLOW / 2,
          width: ORB_GLOW,
          height: ORB_GLOW,
          scaleX: orbScaleX,
          scaleY: orbScaleY,
        }}
      >
        <Orb theme={orbSlot.theme} skinKey={orbSlot.id}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={orbSlot.id}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
            >
              <SlotIcon slot={orbSlot} color="#ffffff" size={0.9} />
            </motion.span>
          </AnimatePresence>
        </Orb>
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
