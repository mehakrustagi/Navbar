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
  ORB_BASE,
  ORB_ELLIPSES,
  ORB_R,
  ORB_SHEEN,
  PILL_H,
  PILL_W,
  W,
  clamp,
  pillPath,
} from "./orb-kit";
import Icon3D, { type IconId, sizeOf } from "./Icon3D";

/* Replica of the Orb Nav geometry and motion — the original is untouched.
   Only the icons differ: 3D renders that spin and colour up when selected. */
const NOTCH_R = ORB_R + 6;
const NOTCH_DY = 12;
const TOP = ORB_R - NOTCH_DY + 8;
const NOTCH_CY = TOP + NOTCH_DY;
const H = TOP + BAR_H;
const ICON_CY = TOP + ICON_OFFSET;
const PILL = pillPath(TOP, W, BAR_H, BAR_R);

const BAR_FILL = "#FFFFFF";
const SHOULDER_REST = 20;
const SHOULDER_MAX = 30;
const SPEED_SCALE = 1500;

/* A row icon fades out as the disc closes on it. Hiding it only when it is the
   *selected* one is not enough: the disc is 50px wide but an icon sitting just
   outside that still pokes past its edge, which is the collision. */
const FADE_HIDDEN = ORB_R + 3;
const FADE_VISIBLE = ORB_R + 21;

type Icon3DSlot = { id: IconId; label: string; cx: number; flat: string };

const CAP = 30; // idle icon size
const CAP_SELECTED = 38;

const ICONS: Icon3DSlot[] = [
  { id: "snapmap", label: "Snapmap", cx: 79, flat: "/figma/3d/snapmap.png" },
  { id: "home", label: "Home", cx: 138, flat: "/figma/3d/home.png" },
  { id: "docvault", label: "Doc Vault", cx: 197, flat: "/figma/3d/docvault.png" },
  { id: "dream", label: "Dream Tab", cx: 256, flat: "/figma/3d/rainbow.png" },
];

const MIN_X = ICONS[0].cx;
const MAX_X = ICONS[ICONS.length - 1].cx;

function buildPath(cx: number, rf: number) {
  const bottom = TOP + BAR_H;
  const sum = NOTCH_R + rf;
  const d = Math.sqrt(sum * sum - (NOTCH_DY - rf) * (NOTCH_DY - rf));
  const tx = (rf * d) / sum;
  const ty = rf + (rf * (NOTCH_DY - rf)) / sum;

  const lx = cx - d + tx;
  const rx = cx + d - tx;
  const ty_abs = TOP + ty;

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
function RowIcon({ icon, cx }: { icon: Icon3DSlot; cx: MotionValue<number> }) {
  const { width, height } = sizeOf(icon.id, CAP);
  const opacity = useTransform(cx, (x) =>
    clamp((Math.abs(x - icon.cx) - FADE_HIDDEN) / (FADE_VISIBLE - FADE_HIDDEN), 0, 1),
  );
  const scale = useTransform(opacity, (o) => 0.55 + o * 0.45);
  return (
    <motion.img
      src={icon.flat}
      alt=""
      width={width}
      height={height}
      className="max-w-none"
      style={{ opacity, scale, filter: "grayscale(1) brightness(0.72) contrast(1.05)" }}
    />
  );
}

export default function OrbNav3D({ plainOrb = false }: { plainOrb?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  /** Bumped on every selection so the spin replays even for the same tab. */
  const [spinKey, setSpinKey] = useState(0);

  const activeIcon = ICONS.find((i) => i.id === active)!;
  const hoveredIcon = hovered ? ICONS.find((i) => i.id === hovered) : undefined;
  const discIcon = dragging && hoveredIcon ? hoveredIcon : activeIcon;

  const target = useMotionValue(activeIcon.cx);
  const cx = useSpring(target, LEAD_SPRING);

  const velocity = useVelocity(cx);
  const speed = useTransform(velocity, (v) => clamp(Math.abs(v) / SPEED_SCALE, 0, 1));
  const travel = useSpring(speed, { stiffness: 180, damping: 28 });
  const shoulder = useTransform(travel, (t) => SHOULDER_REST + t * (SHOULDER_MAX - SHOULDER_REST));

  const d = useTransform([cx, shoulder], ([x, s]: number[]) => buildPath(x, s));
  const iconX = useTransform(cx, (x) => x - PILL_W / 2);
  const discLeft = useTransform(cx, (x) => x - ORB_R);

  const nearest = (x: number) =>
    ICONS.reduce((best, s) => (Math.abs(s.cx - x) < Math.abs(best.cx - x) ? s : best), ICONS[0]);

  const xFrom = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return clamp(((e.clientX - rect.left) / rect.width) * W, MIN_X, MAX_X);
  };

  const select = (icon: Icon3DSlot) => {
    setActive(icon.id);
    target.set(icon.cx);
    setSpinKey((k) => k + 1);
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
    const icon = nearest(xFrom(e));
    draggingRef.current = false;
    setDragging(false);
    setHovered(null);
    select(icon);
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
          <filter id="bar3d-shadow" x="-30%" y="-80%" width="160%" height="320%">
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
          {/* Keep the shadow out of the notch — see ScoopNav. */}
          <mask id="bar3d-shadow-mask">
            <rect x={-60} y={-60} width={W + 120} height={H + 120} fill="white" />
            <motion.circle cx={cx} cy={NOTCH_CY} r={NOTCH_R} fill="black" />
          </mask>
        </defs>

        <g filter="url(#bar3d-shadow)" mask="url(#bar3d-shadow-mask)">
          <path d={PILL} fill="#000000" />
        </g>

        <motion.path d={d} fill={BAR_FILL} />
      </svg>

      {/* Idle icons: desaturated and dimmed, so colour reads as "selected". */}
      {ICONS.map((icon) => {
        const isActive = icon.id === active;
        return (
          <button
            key={icon.id}
            type="button"
            aria-label={icon.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => select(icon)}
            className="absolute flex items-center justify-center"
            style={{
              left: icon.cx - PILL_W / 2,
              top: ICON_CY - PILL_H / 2,
              width: PILL_W,
              height: PILL_H,
            }}
          >
            <RowIcon icon={icon} cx={cx} />
          </button>
        );
      })}

      {/* Painted after the row icons, so an icon the disc passes over is
          hidden behind it instead of colliding with it. */}
      {/* The disc, identical to the original. */}
      <motion.div
        className="pointer-events-none absolute overflow-hidden rounded-full"
        style={{
          x: discLeft,
          top: NOTCH_CY - ORB_R,
          width: ORB_R * 2,
          height: ORB_R * 2,
          background: ORB_BASE,
        }}
      >
        {!plainOrb &&
          ORB_ELLIPSES.map((color, i) => (
            <span
              key={color}
              className={`orb-ellipse orb-e${i + 1}`}
              style={{ background: `radial-gradient(circle, ${color}, transparent 68%)` }}
            />
          ))}
        <span className="absolute inset-0 rounded-full" style={{ background: ORB_SHEEN }} />
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 59%, rgba(255,255,255,0.74) 100%)",
          }}
        />
      </motion.div>

      {/* Selected icon: spins once on a Y axis and colours up as it lands. */}
      <motion.div
        className="pointer-events-none absolute top-0 left-0 flex items-center justify-center"
        style={{
          x: iconX,
          y: NOTCH_CY - PILL_H / 2,
          width: PILL_W,
          height: PILL_H,
          perspective: 260,
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${discIcon.id}-${spinKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.16 }}
          >
            <Icon3D id={discIcon.id} cap={CAP_SELECTED} playKey={spinKey} />
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
