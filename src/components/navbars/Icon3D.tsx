"use client";

import { motion, type Target, type Transition } from "motion/react";

/**
 * The 3D icons ship as single flattened renders, so each was split into layers
 * offline (see scripts/segment.py) by colour and geometry. Every layer is a
 * full-canvas PNG, which means stacking them at the same box reproduces the
 * original pixel for pixel — verified to a mean diff of 0 — and each part can
 * then be animated on its own.
 */
export type IconId = "snapmap" | "home" | "docvault" | "dream";

type Spec = {
  /** Natural canvas of the render. */
  nw: number;
  nh: number;
  /** Painted back to front. */
  layers: string[];
  file: string;
};

export const ICON_SPECS: Record<IconId, Spec> = {
  snapmap: { nw: 281, nh: 320, file: "snapmap", layers: ["globe", "clouds", "pin", "bar"] },
  home: { nw: 320, nh: 320, file: "home", layers: ["house", "plants"] },
  docvault: { nw: 320, nh: 320, file: "docvault", layers: ["body", "door"] },
  dream: { nw: 320, nh: 204, file: "rainbow", layers: ["arc", "clouds"] },
};

export const sizeOf = (id: IconId, cap: number) => {
  const { nw, nh } = ICON_SPECS[id];
  const k = cap / Math.max(nw, nh);
  return { width: nw * k, height: nh * k };
};

/** Door bbox inside the 320px vault canvas, used to place the cavity behind it. */
const DOOR = { x: 77 / 320, y: 79 / 320, w: (215 - 77) / 320, h: (268 - 79) / 320 };

const SPIN = { type: "spring", stiffness: 120, damping: 15, mass: 0.7 } as const;
/** Reveals start as the spin is settling, so the two read as one gesture. */
const AFTER = 0.34;

type LayerMotion = {
  initial: Target;
  animate: Target;
  transition: Transition;
  style?: React.CSSProperties;
};

function layerMotion(id: IconId, layer: string): LayerMotion {
  switch (`${id}.${layer}`) {
    // Globe keeps turning after the stack's spin, then eases to rest.
    case "snapmap.globe":
      return {
        initial: { rotateY: 0 },
        animate: { rotateY: 360 },
        transition: { duration: 1.1, ease: [0.22, 0.61, 0.36, 1] as const },
      };
    case "snapmap.pin":
      return {
        initial: { y: "-26%", scale: 0.3, opacity: 0 },
        animate: { y: "0%", scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 420, damping: 16, delay: AFTER + 0.22 },
      };
    case "snapmap.clouds":
      return {
        initial: { scale: 0.7, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 300, damping: 22, delay: AFTER + 0.34 },
      };
    case "snapmap.bar":
      return {
        initial: { y: "18%", opacity: 0 },
        animate: { y: "0%", opacity: 1 },
        transition: { type: "spring" as const, stiffness: 380, damping: 24, delay: AFTER + 0.44 },
      };

    // Foliage grows up out of its own base.
    case "home.plants":
      return {
        initial: { scaleY: 0, scaleX: 0.7, opacity: 0 },
        animate: { scaleY: 1, scaleX: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 260, damping: 15, delay: AFTER + 0.18 },
        style: { transformOrigin: "50% 83%" },
      };

    // The gate swings on its left hinge.
    case "docvault.door":
      return {
        initial: { rotateY: 0 },
        animate: { rotateY: -108 },
        transition: { type: "spring" as const, stiffness: 140, damping: 18, delay: AFTER + 0.2 },
        style: { transformOrigin: `${DOOR.x * 100}% 50%` },
      };

    // Rainbow draws out of the left cloud towards the right.
    case "dream.arc":
      return {
        initial: { clipPath: "inset(0 100% 0 0)" },
        animate: { clipPath: "inset(0 0% 0 0)" },
        transition: { duration: 0.75, ease: [0.32, 0.72, 0.3, 1] as const, delay: AFTER + 0.12 },
      };
    case "dream.clouds":
      return {
        initial: { scale: 0.75, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 320, damping: 20, delay: AFTER },
      };

    default:
      return { initial: {}, animate: {}, transition: { duration: 0 } };
  }
}

export default function Icon3D({
  id,
  cap,
  playKey,
}: {
  id: IconId;
  cap: number;
  /** Changing this replays the whole sequence. */
  playKey: number;
}) {
  const spec = ICON_SPECS[id];
  const { width, height } = sizeOf(id, cap);

  return (
    <motion.div
      key={playKey}
      className="relative"
      style={{ width, height, transformStyle: "preserve-3d" }}
      initial={{ rotateY: -180, scale: 0.55, filter: "grayscale(1)" }}
      animate={{ rotateY: 0, scale: 1, filter: "grayscale(0)" }}
      transition={{
        rotateY: SPIN,
        scale: { type: "spring", stiffness: 380, damping: 20 },
        filter: { duration: 0.45, delay: 0.12 },
      }}
    >
      {id === "docvault" && (
        /* Cavity behind the gate — the render has no interior, so the opening
           needs something to reveal. */
        <motion.span
          className="absolute rounded-[14%]"
          style={{
            left: `${DOOR.x * 100}%`,
            top: `${DOOR.y * 100}%`,
            width: `${DOOR.w * 100}%`,
            height: `${DOOR.h * 100}%`,
            background: "radial-gradient(120% 90% at 30% 25%, #3B1E63, #170A2B 70%, #0B0417 100%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: AFTER + 0.24 }}
        />
      )}

      {spec.layers.map((layer) => {
        const m = layerMotion(id, layer);
        return (
          <motion.img
            key={layer}
            src={`/figma/3d/layers/${spec.file}_${layer}.png`}
            alt=""
            width={width}
            height={height}
            className="absolute inset-0 max-w-none"
            initial={m.initial}
            animate={m.animate}
            transition={m.transition}
            style={{ ...m.style, backfaceVisibility: "hidden" }}
          />
        );
      })}
    </motion.div>
  );
}
