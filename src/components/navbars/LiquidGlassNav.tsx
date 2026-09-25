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
  GLASS_BLUR,
  GLASS_BOTTOM,
  GLASS_RIM,
  GLASS_TOP,
  IDLE_ICON,
  LEAD_SPRING,
  SLOTS,
  SlotIcon,
  W,
  clamp,
} from "./orb-kit";

/* Our glass bar, wearing the liquid-glass lens. Styling comes from orb-kit so
   it stays in step with the other variants; only the motion is new. */
const GLASS_BG = `linear-gradient(180deg, ${GLASS_TOP}, ${GLASS_BOTTOM})`;

const BAR_H = 56;
const BAR_R = BAR_H / 2; // pill
const LENS_R = 46; // lens overhangs the bar, top and bottom
const PAD = LENS_R - BAR_H / 2;
const H = BAR_H + PAD * 2;
const CY = PAD + BAR_H / 2; // bar centre line

const MAGNIFY = 1.34; // how much the lens enlarges what sits under it
/** Vertical placement of the magnified bar inside the lens. */
const MAG_TOP = (PAD - CY) * MAGNIFY + LENS_R;

/* Evenly spread for this layout — the lens needs room either side. */
const SLOT_X = SLOTS.map((_, i) => (W * (i + 0.5)) / SLOTS.length);
const MIN_X = SLOT_X[0];
const MAX_X = SLOT_X[SLOT_X.length - 1];

export default function LiquidGlassNav() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(SLOTS[0].id);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const indexOf = (id: string) => SLOTS.findIndex((s) => s.id === id);
  const activeIdx = Math.max(0, indexOf(active));
  const hoveredIdx = hovered ? indexOf(hovered) : -1;
  const lensIdx = dragging && hoveredIdx >= 0 ? hoveredIdx : activeIdx;
  const lensSlot = SLOTS[lensIdx];

  const target = useMotionValue(SLOT_X[activeIdx]);
  const lx = useSpring(target, LEAD_SPRING);

  const lensLeft = useTransform(lx, (x) => x - LENS_R);
  // The magnified bar, expressed in the lens's own coordinates.
  const magLeft = useTransform(lx, (x) => x * (1 - MAGNIFY) - (x - LENS_R));

  const nearestIdx = (x: number) =>
    SLOT_X.reduce(
      (best, sx, i) =>
        Math.abs(sx - x) < Math.abs(SLOT_X[best] - x) ? i : best,
      0,
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
    setHovered(SLOTS[nearestIdx(x)].id);
    target.set(x);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const x = xFrom(e);
    setHovered(SLOTS[nearestIdx(x)].id);
    target.set(x);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const i = nearestIdx(xFrom(e));
    draggingRef.current = false;
    setDragging(false);
    setHovered(null);
    setActive(SLOTS[i].id);
    target.set(SLOT_X[i]);
  };

  const accent = lensSlot.theme.accent;

  return (
    <div
      ref={ref}
      className="relative w-[335px] touch-none select-none"
      style={{ height: H }}
    >
      {/* The bar — our frosted glass pill. */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: 0,
          top: PAD,
          width: W,
          height: BAR_H,
          borderRadius: BAR_R,
          background: GLASS_BG,
          backdropFilter: GLASS_BLUR,
          WebkitBackdropFilter: GLASS_BLUR,
          boxShadow: `inset 0 0 0 1px ${GLASS_RIM}, 0 12px 28px rgba(11,11,15,0.20)`,
        }}
      />

      {/* Idle icons, sitting on the bar. */}
      {SLOTS.map((slot, i) => (
        <button
          key={slot.id}
          type="button"
          aria-label={slot.label}
          aria-current={slot.id === active ? "page" : undefined}
          onClick={() => {
            setActive(slot.id);
            target.set(SLOT_X[i]);
          }}
          className="absolute flex items-center justify-center"
          style={{ left: SLOT_X[i] - 26, top: CY - 22, width: 52, height: 44 }}
        >
          <SlotIcon slot={slot} color={IDLE_ICON} />
        </button>
      ))}

      {/* The lens: frosts and brightens whatever sits behind it, which is what
          produces the pale crescents above and below the bar. */}
      <motion.div
        className="pointer-events-none absolute overflow-hidden rounded-full"
        style={{
          x: lensLeft,
          top: CY - LENS_R,
          width: LENS_R * 2,
          height: LENS_R * 2,
          backdropFilter: "blur(3px) brightness(1.45) saturate(1.15)",
          WebkitBackdropFilter: "blur(3px) brightness(1.45) saturate(1.15)",
        }}
      >
        {/* The magnified bar, redrawn inside the lens with the same glass. */}
        <motion.div
          className="absolute"
          style={{
            x: magLeft,
            top: MAG_TOP,
            width: W * MAGNIFY,
            height: BAR_H * MAGNIFY,
            borderRadius: BAR_R * MAGNIFY,
            background: GLASS_BG,
            boxShadow: `inset 0 0 0 ${MAGNIFY}px ${GLASS_RIM}`,
          }}
        />

        {/* Glass body: a soft top-left highlight across the whole lens. */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(120% 90% at 32% 12%, rgba(255,255,255,0.22), rgba(255,255,255,0) 58%)",
          }}
        />
      </motion.div>

      {/* Rim. The accent fringe sits where a real lens bends light hardest —
          top and bottom — and takes the selected tab's colour. */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          x: lensLeft,
          top: CY - LENS_R,
          width: LENS_R * 2,
          height: LENS_R * 2,
        }}
      >
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: `0 0 10px 1px ${accent}55` }}
          transition={{ duration: 0.3 }}
          style={{
            background: `linear-gradient(180deg, ${accent} 0%, transparent 26%, transparent 74%, ${accent} 100%)`,
            padding: 1.5,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            filter: "blur(0.6px)",
          }}
        />
        <span
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75)" }}
        />
      </motion.div>

      {/* Selected icon + label, inside the lens. */}
      <motion.div
        className="pointer-events-none absolute flex flex-col items-center justify-center gap-1"
        style={{
          x: lensLeft,
          top: CY - LENS_R,
          width: LENS_R * 2,
          height: LENS_R * 2,
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={lensSlot.id}
            className="flex flex-col items-center gap-1"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
          >
            <SlotIcon slot={lensSlot} color={accent} size={1.3} />
          </motion.div>
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
