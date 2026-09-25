"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import type { NavbarProps } from "@/lib/nav-items";

const BAR_H = 64;
const CIRCLE_R = 24;
const GAP = 6; // white space between circle and bar
const NOTCH_R = CIRCLE_R + GAP;
const TOP = CIRCLE_R + 8; // headroom above the bar's top line
const CORNER = 18;
const PAD = 16; // keeps the outermost notch clear of the rounded corners

const SHOULDER = 14; // resting fillet radius
const SHOULDER_STRETCH = 14; // extra fillet while travelling

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * The notch is a true circular arc of radius NOTCH_R centred on the circle,
 * blended into the top edge by tangent fillets — so the white gap around the
 * circle is exactly GAP everywhere, at every position. `shoulder` widens the
 * fillets while the notch travels, which is the only thing that flexes.
 */
function buildPath(w: number, cx: number, shoulder: number) {
  const bottom = TOP + BAR_H;
  const rf = shoulder;
  const sum = NOTCH_R + rf;
  const d = Math.sqrt(NOTCH_R * NOTCH_R + 2 * NOTCH_R * rf); // fillet centre offset

  // Tangent point where fillet meets the notch arc.
  const tx = (d * rf) / sum;
  const ty = rf - (rf * rf) / sum;

  const lx = clamp(cx - d, CORNER, w - CORNER); // left fillet start
  const rx = clamp(cx + d, CORNER, w - CORNER); // right fillet end

  return [
    `M ${CORNER} ${TOP}`,
    `H ${lx}`,
    `A ${rf} ${rf} 0 0 1 ${cx - d + tx} ${TOP + ty}`,
    `A ${NOTCH_R} ${NOTCH_R} 0 0 0 ${cx + d - tx} ${TOP + ty}`,
    `A ${rf} ${rf} 0 0 1 ${rx} ${TOP}`,
    `H ${w - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${w} ${TOP + CORNER}`,
    `V ${bottom - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${w - CORNER} ${bottom}`,
    `H ${CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 0 ${bottom - CORNER}`,
    `V ${TOP + CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${CORNER} ${TOP}`,
    "Z",
  ].join(" ");
}

export type LiquidNotchProps = NavbarProps & {
  color?: string;
  accent?: string;
};

export default function LiquidNotch({
  items = [],
  active,
  onChange,
  color = "#0a0a0a",
  accent = "#ffffff",
}: LiquidNotchProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const index = Math.max(
    0,
    items.findIndex((i) => i.id === active),
  );
  const slot = (width - PAD * 2) / Math.max(1, items.length);
  const centerOf = (i: number) => PAD + slot * (i + 0.5);

  const target = useMotionValue(0);
  const cx = useSpring(target, { stiffness: 300, damping: 30, mass: 0.9 });

  // Smooth the raw velocity before it drives geometry — raw velocity jitters.
  const velocity = useVelocity(cx);
  const speed = useTransform(velocity, (v) => clamp(Math.abs(v) / 1800, 0, 1));
  const travel = useSpring(speed, { stiffness: 220, damping: 28 });

  const measured = useRef(false);
  useEffect(() => {
    if (!width) return;
    const to = centerOf(index);
    if (!measured.current) {
      measured.current = true;
      target.jump(to);
      cx.jump(to);
      return;
    }
    target.set(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, width]);

  const shoulder = useTransform(travel, (t) => SHOULDER + t * SHOULDER_STRETCH);
  const d = useTransform([cx, shoulder], ([x, s]: number[]) =>
    buildPath(width, x, s),
  );
  const iconX = useTransform(cx, (x) => x - CIRCLE_R);

  const ActiveIcon = items[index]?.icon;

  return (
    <div
      ref={ref}
      className="relative w-full select-none"
      style={{ height: TOP + BAR_H }}
    >
      {width > 0 && (
        <svg
          width={width}
          height={TOP + BAR_H}
          viewBox={`0 0 ${width} ${TOP + BAR_H}`}
          className="absolute inset-0"
        >
          <motion.path d={d} fill={color} />
          <motion.circle cx={cx} cy={TOP} r={CIRCLE_R} fill={color} />
        </svg>
      )}

      {/* Icon riding the notch. */}
      <motion.div
        className="pointer-events-none absolute top-0 left-0 flex items-center justify-center"
        style={{
          x: iconX,
          y: TOP - CIRCLE_R,
          width: CIRCLE_R * 2,
          height: CIRCLE_R * 2,
        }}
      >
        {ActiveIcon && (
          <motion.span
            key={items[index].id}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 24,
              delay: 0.06,
            }}
            style={{ color: accent }}
          >
            <ActiveIcon size={21} strokeWidth={2.2} />
          </motion.span>
        )}
      </motion.div>

      {/* Tap targets — full slot height, so it behaves like a real nav bar. */}
      <div
        className="absolute inset-x-0 flex"
        style={{ top: TOP, height: BAR_H, paddingLeft: PAD, paddingRight: PAD }}
      >
        {items.map((item, i) => {
          const isActive = i === index;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
              className="flex flex-1 items-center justify-center rounded-2xl"
            >
              <motion.span
                animate={{
                  opacity: isActive ? 0 : 0.65,
                  scale: isActive ? 0.5 : 1,
                }}
                transition={{ duration: 0.16 }}
                style={{ color: accent }}
              >
                <item.icon size={21} strokeWidth={2.1} />
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
