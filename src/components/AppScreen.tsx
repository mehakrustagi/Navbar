"use client";

import type { ReactNode } from "react";

/**
 * Figma "Full landing" (294:2328), built at its own 393pt width so nothing is
 * rescaled. `children` is dropped at the bottom, which is where the nav sits.
 */
const W = 393;
const H = 852;
const A = "/figma/screen";

/** The layered agent blob. Each chip uses a different arrangement. */
function Agent({ size, variant }: { size: number; variant: 1 | 2 | 3 | 4 }) {
  const k = size / 24; // the design draws these at 24
  const px = (v: number) => v * k;
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, background: "#382762" }}
    >
      {variant === 1 && (
        <span
          className="absolute flex items-center justify-center"
          style={{ left: px(-15.01), top: px(-6.65), width: px(41.33), height: px(52.72) }}
        >
          <span
            className="relative"
            style={{ width: px(37.05), height: px(49.61), transform: "scaleY(-1) rotate(-174.88deg)", filter: `blur(${px(0.105)}px)` }}
          >
            <img src={`${A}/img527.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span
              className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(163.36deg, rgba(243,177,255,0) 34.03%, rgba(29,255,195,0.6) 55.64%)" }}
            />
          </span>
        </span>
      )}

      {variant === 2 && (
        <>
          <img src={`${A}/img528.png`} alt="" className="absolute max-w-none object-cover"
            style={{ left: px(2.09), top: px(-0.87), width: px(19.7), height: px(26.5), filter: `blur(${px(2.71)}px)` }} />
          <span className="absolute overflow-hidden"
            style={{ left: px(-9.41), top: px(-1.92), width: px(36.43), height: px(16.73), filter: `blur(${px(0.105)}px)` }}>
            <img src={`${A}/img532.png`} alt="" className="absolute max-w-none"
              style={{ left: "-16.77%", top: 0, width: "133.54%", height: "290.54%" }} />
          </span>
          <span className="absolute flex items-center justify-center"
            style={{ left: px(1.69), top: px(13.36), width: px(27.65), height: px(24.01) }}>
            <span style={{ transform: "rotate(-5.14deg)", filter: `blur(${px(0.105)}px)` }}>
              <img src={`${A}/img533.png`} alt="" className="block max-w-none object-bottom"
                style={{ width: px(25.8), height: px(21.79) }} />
            </span>
          </span>
          <span className="absolute flex items-center justify-center"
            style={{ left: px(-6.03), top: px(1.81), width: px(36.12), height: px(36.12) }}>
            <span style={{
              transform: "rotate(-2.81deg)", filter: `blur(${px(0.174)}px)`,
              width: px(34.47), height: px(34.47),
              backgroundImage: "linear-gradient(158.91deg, rgba(243,177,255,0) 20.5%, rgba(0,158,0,0.6) 65.09%)",
            }} />
          </span>
        </>
      )}

      {variant === 3 && (
        <>
          <img src={`${A}/img528.png`} alt="" className="absolute max-w-none object-cover"
            style={{ left: px(2.09), top: px(-0.87), width: px(19.7), height: px(26.5), filter: `blur(${px(2.71)}px)` }} />
          <span className="absolute"
            style={{ left: px(-53.34), top: px(-62.23), width: px(122.37), height: px(122.37), filter: `blur(${px(0.174)}px)` }}>
            <img src={`${A}/img530.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(168.95deg, rgba(243,177,255,0) 57.47%, rgba(80,199,255,0.6) 68.88%)" }} />
          </span>
        </>
      )}

      {variant === 4 && (
        <>
          <img src={`${A}/img528.png`} alt="" className="absolute max-w-none object-cover"
            style={{ left: px(3.31), top: px(-1.38), width: px(31.19), height: px(41.95), filter: `blur(${px(4.29)}px)` }} />
          <span className="absolute"
            style={{ left: px(-7.73), top: px(-0.55), width: px(47.2), height: px(47.2), filter: `blur(${px(0.276)}px)` }}>
            <img src={`${A}/img531.png`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(177.85deg, rgba(243,177,255,0) 50.44%, rgba(255,170,254,0.6) 70.93%)" }} />
          </span>
        </>
      )}

      <img
        src={`${A}/${variant === 4 ? "ring2" : "ring"}.svg`}
        alt=""
        className="absolute max-w-none"
        style={
          variant === 4
            ? { left: px(-2.1), top: px(-2.74), width: px(42.05), height: px(43.32) }
            : { left: px(-1.38), top: px(-1.73), width: px(26.56), height: px(27.36) }
        }
      />
    </span>
  );
}

function Chip({ label, variant, glow }: { label: string; variant: 1 | 2 | 3; glow: string }) {
  return (
    <div
      className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-[100px] border-2 border-white bg-[#fffffe] py-2 pr-4 pl-2"
      style={{ boxShadow: "0px 3.84px 28.8px -1.92px rgba(0,0,0,0.05)" }}
    >
      <div className="relative flex shrink-0 items-center gap-1.5">
        <Agent size={24} variant={variant} />
        <p className="text-[14px] font-medium tracking-[-0.28px] whitespace-nowrap text-black">
          {label}
        </p>
      </div>
      {/* the coloured wash that bleeds under each chip */}
      <img
        src={`${A}/${glow}`}
        alt=""
        className="pointer-events-none absolute max-w-none"
        style={{ left: -26.17, top: 3.33, width: 220.34, height: 97.22 }}
      />
    </div>
  );
}

export default function AppScreen({ children }: { children?: ReactNode }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[40px] bg-white ring-1 ring-black/10"
      style={{ width: W, height: H }}
    >
      {/* mesh gradient — 1130.689 box at (-369,-147) holding a 1530.69 SVG
          inset -17.69% for its blur padding */}
      <img
        src={`${A}/bg.svg`}
        alt=""
        className="pointer-events-none absolute max-w-none"
        style={{ left: -569, top: -347, width: 1530.69, height: 1530.69 }}
      />

      {/* top bar */}
      <div className="absolute top-0 right-0 flex h-[137px] w-[393px] flex-col items-start">
        <div
          className="absolute top-0 left-0 h-[137px] w-[393px] pt-3"
          style={{
            backdropFilter: "blur(0.5px)",
            background: "linear-gradient(to top, rgba(255,255,255,0), #fff)",
          }}
        />
        <div className="relative h-[59px] w-full shrink-0">
          <div className="absolute top-[11px] left-[134px] h-[37px] w-[125px] rounded-[20px] bg-[#1a1a1a]" />
          <div className="absolute top-[18px] left-1/2 h-6 w-[345px] -translate-x-1/2">
            <p className="absolute top-1 left-[3.33%] text-[16px] font-semibold tracking-[0.016px] text-black">
              12:30
            </p>
            <div className="absolute top-1/4 right-[3.33%] bottom-1/4 flex items-start gap-1.5">
              <img src={`${A}/cellular.svg`} alt="" width={18} height={12} />
              <img src={`${A}/wifi.svg`} alt="" width={16} height={12} />
              <img src={`${A}/battery.svg`} alt="" width={24} height={12} />
            </div>
          </div>
        </div>
        <div className="relative flex w-full shrink-0 items-center justify-between px-5 py-2">
          <div
            className="relative size-12 shrink-0 overflow-hidden rounded-[28.8px] border border-[#e8e8e8] bg-white/20"
            style={{ boxShadow: "0px 3.84px 28.8px -1.92px rgba(0,0,0,0.05)" }}
          >
            <img
              src={`${A}/menu.svg`}
              alt=""
              className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        </div>
      </div>

      {/* greeting */}
      <div className="absolute top-[264px] left-0 flex w-[393px] flex-col items-center justify-center px-5 py-2">
        <div className="relative flex w-full shrink-0 flex-col items-center justify-center gap-3">
          <Agent size={38} variant={4} />
          <p className="w-full text-center text-[24px] leading-7 font-medium tracking-[-0.96px] text-black">
            Afternoon, Mohak
          </p>
        </div>
      </div>

      {/* actions + input */}
      <div className="absolute top-[376px] left-[26px] flex w-[340px] flex-col items-center justify-center gap-3 overflow-hidden">
        <div className="relative flex w-[338px] shrink-0 items-start gap-3">
          <Chip label="Order for me" variant={1} glow="glow1.svg" />
          <Chip label="Negotiate for me" variant={2} glow="glow2.svg" />
          <Chip label="Action suggestion" variant={3} glow="glow3.svg" />
        </div>

        <div
          className="relative h-14 w-full shrink-0 overflow-hidden rounded-[30px] border border-[#e8e8e8] bg-white/40"
          style={{ boxShadow: "0px 3.84px 28.8px -1.92px rgba(0,0,0,0.05)" }}
        >
          <div className="absolute top-[11px] left-[11px] flex items-center gap-2.5">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-black/5">
              <img
                src={`${A}/dialpad.svg`}
                alt=""
                className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full border-[0.78px] border-[#f2f2f2] bg-white">
              <img
                src={`${A}/ai2.png`}
                alt=""
                className="absolute inset-0 h-full w-full rounded-full object-cover opacity-30"
              />
              <img
                src={`${A}/dialpad.svg`}
                alt=""
                className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            <p className="text-[16px] tracking-[-0.64px] whitespace-nowrap text-[#ccc]">
              Apply for a visa
            </p>
          </div>
          <div className="absolute top-[11px] right-[11px] flex items-center gap-2.5">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-black/5">
              <img src={`${A}/mic.svg`} alt="" className="absolute top-[7.2px] left-[7.2px] size-[17.6px]" />
            </div>
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-black">
              <span className="absolute top-1/2 left-1/2 flex size-[18px] -translate-x-1/2 -translate-y-1/2 rotate-90 items-center justify-center">
                <img src={`${A}/arrow.svg`} alt="" className="size-[18px]" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* the nav under test */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-6">{children}</div>
    </div>
  );
}
