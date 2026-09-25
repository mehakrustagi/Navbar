"use client";

import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import {
  BAR_H,
  BAR_R,
  BarShadow,
  ICON_OFFSET,
  MAX_X,
  MIN_X,
  ORB_GLOW,
  LEAD_SPRING,
  Orb,
  PILL_H,
  PILL_W,
  SLOTS,
  SlotIcon,
  W,
  clamp,
  pillPath,
} from "./orb-kit";

/* Orb-nav UI, bouncing-ball mechanics. */
const ARC = 78; // max lift
const TOP = ARC + ORB_GLOW / 2; // headroom for the arc plus the glow
const H = TOP + BAR_H;

const REST_DIP = 33; // cradle depth, leaving ~7px under the orb
const SPREAD = 46; // width of the surface deformation
const LIFT_PER_SPEED = 1 / 11;
const REST_Y = TOP + 1; // orb centre at rest, matching the orb nav

const ICON_CY = TOP + ICON_OFFSET;
const PILL = pillPath(TOP, W, BAR_H, BAR_R);

/** Top edge of the bar. `amp` > 0 dips into a cradle, < 0 bulges upward. */
function topEdge(x: number, cx: number, amp: number) {
  const k = (x - cx) / SPREAD;
  return TOP + amp * Math.exp(-k * k);
}

function buildPath(cx: number, amp: number) {
  const bottom = TOP + BAR_H;
  const start = BAR_R;
  const end = W - BAR_R;
  const step = 5;

  const pts: [number, number][] = [];
  for (let x = start; x < end; x += step) pts.push([x, topEdge(x, cx, amp)]);
  pts.push([end, topEdge(end, cx, amp)]);

  // Quadratic segments through midpoints keep the sampled curve smooth.
  let edge = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const [nx, ny] = pts[i + 1];
    edge += ` Q ${px} ${py}, ${(px + nx) / 2} ${(py + ny) / 2}`;
  }
  edge += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;

  return [
    edge,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W} ${TOP + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${W - BAR_R} ${bottom}`,
    `H ${BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 0 ${TOP + BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${BAR_R} ${topEdge(start, cx, amp)}`,
    "Z",
  ].join(" ");
}

export default function BouncingBall() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  // One spring drives everything — taps, drags and flings share the model.
  const target = useMotionValue(SLOTS.find((s) => s.id === "home")!.cx);
  const cx = useSpring(target, LEAD_SPRING);
  const vx = useVelocity(cx);

  const dragY = useMotionValue(REST_Y);
  const draggingMv = useMotionValue(0);
  const wobble = useMotionValue(0); // jelly overshoot on impact

  // Lift is a pure function of speed: fast travel throws the orb up.
  const lift = useTransform(vx, (v) =>
    clamp(Math.abs(v) * LIFT_PER_SPEED, 0, ARC),
  );
  const liftRatio = useTransform(lift, (l) => l / ARC);

  const airborne = useRef(false);
  useMotionValueEvent(lift, "change", (l) => {
    if (l > 14) airborne.current = true;
    else if (l < 2.5 && airborne.current && !draggingMv.get()) {
      airborne.current = false;
      animate(wobble, [0, -1, 0.42, -0.16, 0.05, 0], {
        duration: 0.62,
        ease: "easeOut",
      });
    }
  });

  const ballY = useTransform(
    [draggingMv, dragY, lift, wobble],
    ([d, dy, l, wv]: number[]) => (d ? dy : REST_Y - l + wv * 7),
  );

  const amp = useTransform(
    [liftRatio, wobble, draggingMv, ballY],
    ([lr, wv, d, by]: number[]) => {
      const nearness = d ? clamp(1 - (REST_Y - by) / ARC, 0, 1) : 1 - lr;
      return REST_DIP * nearness + wv * 22;
    },
  );

  const d = useTransform([cx, amp], ([x, a]: number[]) => buildPath(x, a));

  const speedRatio = useTransform(vx, (v) => clamp(Math.abs(v) / 2200, 0, 1));
  const scaleX = useTransform(
    [speedRatio, wobble],
    ([s, wv]: number[]) => 1 + s * 0.2 - wv * 0.18,
  );
  const scaleY = useTransform(
    [speedRatio, wobble],
    ([s, wv]: number[]) => 1 - s * 0.14 + wv * 0.18,
  );
  const lean = useTransform(vx, (v) => clamp(v / 260, -16, 16));

  const orbLeft = useTransform(cx, (x) => x - ORB_GLOW / 2);
  const orbTop = useTransform(ballY, (y) => y - ORB_GLOW / 2);

  // The ball previews whatever it is hopping to.
  const hoveredSlot = hovered ? SLOTS.find((s) => s.id === hovered) : undefined;
  const activeSlot = SLOTS.find((s) => s.id === active)!;
  const orbSlot = dragging && hoveredSlot ? hoveredSlot : activeSlot;

  const nearest = (x: number) =>
    SLOTS.reduce(
      (best, s) => (Math.abs(s.cx - x) < Math.abs(best.cx - x) ? s : best),
      SLOTS[0],
    );

  const pointFrom = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const scale = rect.width / W;
    return {
      x: clamp((e.clientX - rect.left) / scale, MIN_X, MAX_X),
      y: clamp((e.clientY - rect.top) / scale, REST_Y - ARC, REST_Y),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const { x, y } = pointFrom(e);
    draggingRef.current = true;
    setDragging(true);
    draggingMv.set(1);
    setHovered(nearest(x).id);
    target.set(x);
    dragY.set(y);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { x, y } = pointFrom(e);
    setHovered(nearest(x).id);
    target.set(x);
    dragY.set(y);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    draggingMv.set(0);
    setHovered(null);
    // Project the fling forward so a flick can carry past the nearest slot.
    const slot = nearest(cx.get() + vx.get() * 0.12);
    setActive(slot.id);
    target.set(slot.cx); // the ball stays where you dropped it
    animate(dragY, REST_Y, { type: "spring", stiffness: 420, damping: 26 });
    airborne.current = true;
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
          <BarShadow id="bounce-shadow" />
        </defs>
        <g filter="url(#bounce-shadow)">
          <path d={PILL} fill="#000000" />
        </g>
        <motion.path d={d} fill="#ffffff" />
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

      {/* The ball — carries the icon it is hopping to. */}
      <motion.div
        className="pointer-events-none absolute top-0 left-0"
        style={{
          x: orbLeft,
          y: orbTop,
          width: ORB_GLOW,
          height: ORB_GLOW,
          scaleX,
          scaleY,
          rotate: lean,
        }}
      >
        <Orb theme={orbSlot.theme} skinKey={orbSlot.id}>
          <SlotIcon slot={orbSlot} color="#ffffff" size={0.9} />
        </Orb>
      </motion.div>

      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
}
