import React, { useSyncExternalStore, useId, useState, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { useTransform, motion, useMotionValue, animate, useSpring, MotionConfig, AnimatePresence } from "motion/react";
import "./blob.css";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (onChange) => {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const snapshot = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);
const serverSnapshot = () => false;
function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

const INK = "#21102f";
const SIDES = [0, 1];
const centre = { transformBox: "fill-box", transformOrigin: "center" };
const bottom = { transformBox: "fill-box", transformOrigin: "center bottom" };

const star = (cx, cy, r) => {
  const a = (r * 2.4) / 13;
  const b = (r * 3.6) / 13;
  return `M${cx} ${cy - r} C${cx + a} ${cy - b} ${cx + b} ${cy - a} ${cx + r} ${cy} C${cx + b} ${cy + a} ${cx + a} ${cy + b} ${cx} ${cy + r} C${cx - a} ${cy + b} ${cx - b} ${cy + a} ${cx - r} ${cy} C${cx - b} ${cy - a} ${cx - a} ${cy - b} ${cx} ${cy - r} Z`;
};

const heart = (cx, cy, s) => {
  const p = (x, y) => `${(cx + x * s).toFixed(1)} ${(cy + y * s).toFixed(1)}`;
  return `M${p(0, 24)} C${p(-7, 18)} ${p(-27, 5)} ${p(-27, -8)} C${p(-27, -26)} ${p(-7, -30)} ${p(0, -15)} C${p(7, -30)} ${p(27, -26)} ${p(27, -8)} C${p(27, 5)} ${p(7, 18)} ${p(0, 24)} Z`;
};

const AT_REST = { x: 0, y: 0, scaleX: 1, scaleY: 1 };
const HMM_LOOP = { duration: 5.2, ease: "easeInOut", times: [0, 0.3, 0.45, 0.7, 1], repeat: Infinity };
const SHY_LOOP = { duration: 4.4, ease: "easeInOut", times: [0, 0.35, 0.45, 0.62, 0.72, 1], repeat: Infinity };
const HEARTBEAT = { duration: 1.3, ease: "easeInOut", times: [0, 0.1, 0.2, 0.3, 1], repeat: Infinity };
const HEARTBEAT_FRAMES = [1, 1.18, 1.04, 1.14, 1];
const HEART_BASE = "color-mix(in oklch, oklch(from var(--jelly-cheek, #f9a9d4) l calc(c * 1.8) h) 60%, #ff4fc8)";
const HEART = `var(--jelly-heart, ${HEART_BASE})`;
const HEART_LIGHT = `var(--jelly-heart-light, oklch(from ${HEART_BASE} calc(l + 0.14) calc(c * 0.7) h))`;
const HEART_DEEP = `var(--jelly-heart-deep, oklch(from ${HEART_BASE} calc(l - 0.2) calc(c * 1.05) h))`;
const HEART_FALLBACK = "var(--jelly-heart, var(--jelly-cheek-deep, #ee97c6))";
const ANGRY_LOOP = { duration: 0.42, ease: "linear", times: [0, 0.2, 0.4, 0.6, 0.8, 1], repeat: Infinity, repeatDelay: 0.75 };
const CURIOUS_LOOP = { duration: 4.8, ease: "easeInOut", times: [0, 0.32, 0.46, 0.64, 0.82, 1], repeat: Infinity };
const CURIOUS_DART = { x: [0, 0, 5, 5, 0, 0], y: [0, 0, -3, -3, 0, 0] };

const loopFor = (mood) =>
  mood === "hmm" ? HMM_LOOP : mood === "shy" ? SHY_LOOP : mood === "angry" ? ANGRY_LOOP : mood === "curious" ? CURIOUS_LOOP : void 0;

const roamFor = (mood, s) =>
  mood === "hmm"
    ? { x: [0, 0, 15, 15, 0], y: [0, -4, -5, 1, 0], scaleX: 1, scaleY: [1, 1, 0.9, 0.92, 1] }
    : mood === "shy"
    ? { x: [0, 0, -4 * s, -4 * s, 0, 0], y: [0, 0, -9, -9, 0, 0], scaleX: [1, 1, 1.12, 1.12, 1, 1], scaleY: [1, 1, 1.12, 1.12, 1, 1] }
    : mood === "angry"
    ? { x: [0, 1.4, -1.4, 1, -1, 0], y: [0, 0.6, -0.4, 0.4, 0, 0], scaleX: 1, scaleY: 1 }
    : mood === "curious"
    ? { ...CURIOUS_DART, scaleX: 1, scaleY: 1 }
    : AT_REST;

const VEIN_MARK = "M-24 -7 Q-7 -7 -7 -24 M7 -24 Q7 -7 24 -7 M24 7 Q7 7 7 24 M-7 24 Q-7 7 -24 7";

function AngerMark({ active, reduced, small = false }) {
  return (
    <g id="anger-mark" pointerEvents="none" transform={`translate(606 264) rotate(12) scale(${small ? 0.88 : 1})`}>
      <motion.g
        initial={false}
        animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.5 }}
        transition={{ duration: reduced ? 0 : 0.24, ease: "easeOut" }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <motion.g
          animate={active && !reduced ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={active && !reduced ? { duration: 0.42, repeat: Infinity, repeatDelay: 0.75, ease: "easeInOut" } : { duration: 0 }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <path d={VEIN_MARK} fill="none" stroke="var(--jelly-outline, #8a4fd9)" strokeWidth="12" strokeLinecap="round" opacity="0.2" />
          <path d={VEIN_MARK} fill="none" stroke="var(--jelly-anger, #ee626f)" strokeWidth="7.5" strokeLinecap="round" />
        </motion.g>
      </motion.g>
    </g>
  );
}

const still = (v, reduced) =>
  reduced ? Object.fromEntries(Object.entries(v).map(([k, f]) => [k, Array.isArray(f) ? f[f.length - 1] : f])) : v;

function BlobFaceEyes(props) {
  return props.eyeStyle === "v2" ? <V2Eyes {...props} /> : <V1Eyes {...props} />;
}

const pose = (p) => ({ x: 0, y: 0, scaleX: 1, scaleY: 1, ...p });
const V1_EYE_SHAPE = {
  sideEye: pose({ scaleX: 1.04, scaleY: 0.64, y: 3 }),
  password: pose({ scaleX: 0.9, scaleY: 0.38, y: 3 }),
  hmm: pose({ scaleY: 0.78, y: 2 }),
  neutral: pose({}),
  happy: pose({ scaleX: 1.05, scaleY: 1.04, y: -2 }),
  sad: pose({ scaleX: 1.1, scaleY: 1.16, y: 4 }),
  angry: pose({ scaleX: 1.1, scaleY: 0.48, y: 2 }),
  curious: pose({ y: -2 }),
  surprised: pose({ scaleX: 1.14, scaleY: 1.22, y: -3 }),
  sleepy: pose({ scaleY: 0.94, y: 4 }),
  shy: pose({ scaleX: 0.94, scaleY: 0.9, y: 5 }),
  love: pose({}),
  wave: pose({ scaleX: 1.05, scaleY: 1.04, y: -2 }),
};

const V1_EYE_SHIFT = {
  sideEye: [pose({ x: -5, y: 1 }), pose({ x: -10, y: 1 })],
  password: [pose({ x: -3 }), pose({ x: -3 })],
  hmm: [pose({ x: -9, y: 1 }), pose({ x: -9, y: 1 })],
  neutral: [pose({}), pose({})],
  happy: [pose({ y: -1 }), pose({ y: -1 })],
  sad: [pose({ x: 5, y: 5 }), pose({ x: -5, y: 5 })],
  angry: [pose({ x: 3, y: 3 }), pose({ x: -3, y: 3 })],
  curious: [pose({ x: 4, y: -4, scaleX: 1.08, scaleY: 1.12 }), pose({ x: 4, y: -3, scaleX: 1.02, scaleY: 1.05 })],
  surprised: [pose({ y: -2 }), pose({ y: -2 })],
  sleepy: [pose({}), pose({})],
  shy: [pose({ x: 4, y: 4 }), pose({ x: -4, y: 4 })],
  love: [pose({}), pose({})],
  wave: [pose({ y: -1 }), pose({ y: -1 })],
};

const lidEdge = (cx, droop) => {
  const y = 334 + droop * 74;
  return `C${cx - 14} ${y + 4} ${cx + 14} ${y + 4}`;
};
const lidClip = (cx, droop) => {
  const y = 334 + droop * 74;
  return `M${cx - 60} ${y - 2} ${lidEdge(cx, droop)} ${cx + 60} ${y - 2} L${cx + 60} 460 L${cx - 60} 460 Z`;
};
const lidLine = (cx, droop) => {
  const y = 334 + droop * 74;
  return `M${cx - 36} ${y - 1} ${lidEdge(cx, droop)} ${cx + 36} ${y - 1}`;
};

const DROOP = [0.35, 0.55, 0.6, 0.92, 1, 1, 0.35];
const DROOP_TIMES = [0, 0.12, 0.4, 0.62, 0.7, 0.88, 1];
const DROOP_LOOP = { duration: 6, ease: "easeInOut", times: DROOP_TIMES, repeat: Infinity };

function V1Eyes({ mood, blinkLeft, blinkRight, dilate, reduced, happyEyes, sparkle, stir, closedEyes = false }) {
  const uid = useId().replace(/:/g, "");
  const eyeFill = `${uid}-eyeFill`;
  const heartFill = `${uid}-heartFill`;
  const heartGlow = `${uid}-heartGlow`;

  const widenL = useTransform(blinkLeft, [0.05, 1], [1.08, 1]);
  const widenR = useTransform(blinkRight, [0.05, 1], [1.08, 1]);
  const eyeLX = useTransform(() => widenL.get() * dilate.get());
  const eyeLY = useTransform(() => blinkLeft.get() * dilate.get());
  const eyeRX = useTransform(() => widenR.get() * dilate.get());
  const eyeRY = useTransform(() => blinkRight.get() * dilate.get());

  const starEyes = mood === "happy" && happyEyes === "star";
  const love = mood === "love";
  const sleepy = mood === "sleepy";
  const hmm = mood === "hmm";
  const angry = mood === "angry";
  const raised = mood === "curious" || mood === "surprised";

  const quick = reduced ? { duration: 0 } : { duration: 0.13, ease: "easeOut" };
  const springy = reduced ? { duration: 0 } : { delay: 0.05, type: "spring", stiffness: 240, damping: 17 };
  const soft = reduced ? { duration: 0 } : { type: "spring", stiffness: 230, damping: 18 };
  const loop = loopFor(mood);
  const roamTransition = loop && !reduced ? loop : springy;

  return (
    <g id="eyes" data-eye-style="v1">
      <defs>
        <radialGradient id={eyeFill} cx="0.34" cy="0.24" r="0.8">
          <stop offset="0" stopColor="var(--jelly-eye-light, #37204b)" />
          <stop offset="0.55" stopColor="var(--jelly-eye, #170d25)" />
          <stop offset="1" stopColor="var(--jelly-eye-deep, #0d0715)" />
        </radialGradient>
        <radialGradient id={heartFill} cx="0.34" cy="0.24" r="0.8">
          <stop offset="0" stopColor="var(--jelly-heart-light, var(--jelly-cheek-light, #ffd9ec))" style={{ stopColor: HEART_LIGHT }} />
          <stop offset="0.5" stopColor={HEART_FALLBACK} style={{ stopColor: HEART }} />
          <stop offset="1" stopColor={HEART_FALLBACK} style={{ stopColor: HEART_DEEP }} />
        </radialGradient>
        <radialGradient id={heartGlow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={HEART_FALLBACK} stopOpacity="0.55" style={{ stopColor: HEART }} />
          <stop offset="0.55" stopColor={HEART_FALLBACK} stopOpacity="0.22" style={{ stopColor: HEART }} />
          <stop offset="1" stopColor={HEART_FALLBACK} stopOpacity="0" style={{ stopColor: HEART }} />
        </radialGradient>
        {SIDES.map((index) => (
          <clipPath key={index} id={`${uid}-heartClip-${index}`}>
            <path d={heart(index === 0 ? 353 : 551, 372, 1.8)} />
          </clipPath>
        ))}
        {SIDES.map((index) => {
          const cx = index === 0 ? 353 : 551;
          return (
            <clipPath key={index} id={`${uid}-lidClip-${index}`}>
              <motion.path
                key={stir}
                initial={false}
                animate={{ d: sleepy ? (reduced ? lidClip(cx, 0.6) : DROOP.map((v) => lidClip(cx, v))) : lidClip(cx, -0.6) }}
                transition={sleepy && !reduced ? DROOP_LOOP : soft}
              />
            </clipPath>
          );
        })}
      </defs>

      {SIDES.map((index) => {
        const s = index === 0 ? 1 : -1;
        const cx = index === 0 ? 353 : 551;
        const side = index === 0 ? "left" : "right";
        const arc = (mood === "happy" && happyEyes === "smile") || mood === "wave" || Boolean(closedEyes) || mood === "password";
        const openVisible = !arc && !love && !angry && mood !== "password" && mood !== "sideEye" && !closedEyes;

        return (
          <motion.g key={side} id={`${side}-eye`} initial={false} animate={V1_EYE_SHIFT[mood][index]} transition={springy} style={centre}>
            <motion.g initial={false} animate={still(roamFor(mood, s), reduced)} transition={roamTransition} style={centre}>
              <motion.g initial={false} animate={{ opacity: openVisible ? 1 : 0 }} transition={quick}>
                <motion.g initial={false} animate={V1_EYE_SHAPE[mood]} transition={springy} style={centre}>
                  <motion.g clipPath={`url(#${uid}-lidClip-${index})`} style={{ ...centre, scaleX: index === 0 ? eyeLX : eyeRX, scaleY: index === 0 ? eyeLY : eyeRY }}>
                    <motion.circle
                      id={`${side}-eye-sleepy-glint`}
                      cx={cx + 9 * s}
                      cy="392"
                      r="6"
                      fill="#ffffff"
                      initial={false}
                      animate={{ opacity: sleepy ? 0.85 : 0 }}
                      transition={quick}
                    />
                    <ellipse id={`${side}-eye-base`} cx={cx} cy="371" rx="32" ry="39" fill={`url(#${eyeFill})`} />
                    <ellipse id={`${side}-eye-lower-shade`} cx={cx} cy="393" rx="23" ry="12" fill="var(--jelly-eye-light, #2a1640)" opacity="0.3" />
                    <motion.circle
                      id={`${side}-eye-main-highlight`}
                      cx={cx + 11 * s}
                      cy="353"
                      r="10.5"
                      fill="#ffffff"
                      initial={false}
                      animate={{ opacity: starEyes ? 0 : 0.96 }}
                      transition={{ duration: reduced ? 0 : 0.16 }}
                    />
                    <motion.path
                      id={`${side}-eye-star`}
                      d={star(cx + 11 * s, 353, 13)}
                      fill="#ffffff"
                      initial={false}
                      animate={{ opacity: starEyes ? 1 : 0, scale: starEyes ? 1 : 0.5 }}
                      transition={reduced ? { duration: 0 } : { delay: mood === "happy" ? 0.12 : 0, type: "spring", stiffness: 300, damping: 16 }}
                      style={centre}
                    />
                    <circle id={`${side}-eye-secondary-highlight`} cx={cx + 6 * s} cy="347" r="3.2" fill="#ffffff" opacity="0.58" />
                    <circle id={`${side}-eye-violet-sparkle`} cx={cx - 14 * s} cy="391" r="5.8" fill="var(--jelly-eye-sparkle, #bb7bf0)" opacity="0.62" />
                    <motion.path
                      id={`${side}-eye-want-twinkle`}
                      d={star(cx - 15 * s, 387, 7.5)}
                      fill="#ffffff"
                      initial={false}
                      animate={
                        sparkle
                          ? { opacity: 0.92, scale: reduced ? 1 : [0.85, 1.12, 0.85], rotate: reduced ? 0 : [-6 * s, 8 * s, -6 * s] }
                          : { opacity: 0, scale: 0.5, rotate: 0 }
                      }
                      transition={
                        sparkle && !reduced
                          ? {
                              opacity: { duration: 0.2 },
                              scale: { duration: 1.5 + index * 0.2, repeat: Infinity, ease: "easeInOut" },
                              rotate: { duration: 1.5 + index * 0.2, repeat: Infinity, ease: "easeInOut" },
                            }
                          : { duration: reduced ? 0 : 0.16 }
                      }
                      style={centre}
                    />
                  </motion.g>
                  <motion.path
                    key={stir}
                    id={`${side}-eye-sleepy-lid`}
                    fill="none"
                    stroke={INK}
                    strokeWidth="9"
                    strokeLinecap="round"
                    initial={false}
                    animate={{
                      d: sleepy ? (reduced ? lidLine(cx, 0.6) : DROOP.map((v) => lidLine(cx, v))) : lidLine(cx, -0.6),
                      opacity: sleepy ? 0.92 : 0,
                    }}
                    transition={sleepy && !reduced ? { d: DROOP_LOOP, opacity: quick } : { d: soft, opacity: quick }}
                  />
                </motion.g>
              </motion.g>

              <motion.path
                id={`${side}-hmm-lid`}
                d={index === 0 ? "M324 345 C342 336 365 337 383 345" : "M521 345 C541 336 564 337 581 345"}
                fill="none"
                stroke={INK}
                strokeWidth="6.5"
                strokeLinecap="round"
                initial={false}
                animate={{ opacity: hmm ? 0.32 : 0, x: hmm ? 7 : 9, y: 1 }}
                transition={soft}
                style={centre}
              />

              <motion.g initial={false} animate={{ opacity: angry ? 1 : 0 }} transition={quick}>
                <g transform={`translate(${cx} 371) scale(${s} 1)`}>
                  <path d="M-27 -18 Q0 -14 27 -1 C28 16 17 29 0 29 C-19 29 -30 12 -27 -18 Z" fill={INK} />
                  <ellipse cx="-11" cy="2" rx="5" ry="6" fill="#fff" opacity="0.88" />
                  <ellipse cx="8" cy="18" rx="6" ry="3" fill="var(--jelly-eye-sparkle, #bb7bf0)" opacity="0.35" />
                </g>
              </motion.g>

              <motion.path
                id={`${side}-angry-brow`}
                d={index === 0 ? "M327 334 Q349 337 376 350" : "M577 334 Q555 337 528 350"}
                fill="none"
                stroke={INK}
                strokeWidth="7"
                strokeLinecap="round"
                initial={false}
                animate={angry ? { opacity: 0.95, y: reduced ? 0 : [0, 2.5, 1, 2.5, 0.5, 0] } : { opacity: 0, y: -12 }}
                transition={
                  angry && !reduced
                    ? { opacity: quick, y: ANGRY_LOOP }
                    : reduced
                    ? { duration: 0 }
                    : { opacity: quick, y: { type: "spring", stiffness: 420, damping: 15 } }
                }
                style={centre}
              />
            </motion.g>

            <motion.path
              id={`${side}-eye-happy-arc`}
              d={`M${cx - 28} 380 C${cx - 12} 330 ${cx + 12} 330 ${cx + 28} 380`}
              fill="none"
              stroke={`url(#${eyeFill})`}
              strokeWidth="11"
              strokeLinecap="round"
              initial={false}
              animate={{ opacity: arc ? 1 : 0, scaleY: arc ? 1 : 0.4 }}
              transition={reduced ? { duration: 0 } : { delay: arc ? 0.1 : 0, type: "spring", stiffness: 260, damping: 18 }}
              style={bottom}
            />

            <motion.g
              id={`${side}-eye-heart`}
              initial={false}
              animate={{ opacity: love ? 1 : 0, scale: love ? 1 : 0.2, rotate: love ? -9 * s : 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : love
                  ? {
                      opacity: { duration: 0.12 },
                      scale: { type: "spring", stiffness: 260, damping: 11, delay: index * 0.07 },
                      rotate: { type: "spring", stiffness: 260, damping: 14 },
                    }
                  : { duration: 0.16 }
              }
              style={centre}
            >
              <motion.g
                initial={false}
                animate={{ scale: love && !reduced ? HEARTBEAT_FRAMES : 1 }}
                transition={love && !reduced ? { ...HEARTBEAT, delay: 0.5 + index * 0.08 } : { duration: 0 }}
                style={centre}
              >
                <ellipse cx={cx} cy="368" rx="68" ry="62" fill={`url(#${heartGlow})`} />
                <path d={heart(cx, 372, 1.8)} fill={`url(#${heartFill})`} />
                <g clipPath={`url(#${uid}-heartClip-${index})`}>
                  <g transform={`rotate(-28 ${cx} 372)`}>
                    <motion.rect
                      y="290"
                      width="26"
                      height="165"
                      fill="#ffffff"
                      opacity="0.38"
                      initial={false}
                      animate={{ attrX: love && !reduced ? [cx - 110, cx + 90] : cx - 110 }}
                      transition={
                        love && !reduced
                          ? { duration: 1.05, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.55, delay: 0.95 + index * 0.08 }
                          : { duration: 0 }
                      }
                    />
                  </g>
                </g>
                <ellipse cx={cx + 19 * s} cy="341" rx="9.5" ry="6" fill="#ffffff" opacity="0.9" transform={`rotate(${-32 * s} ${cx + 19 * s} 341)`} />
              </motion.g>

              <motion.path
                d={star(cx + 46 * s, 322, 9)}
                fill="#ffffff"
                initial={false}
                animate={love && !reduced ? { opacity: [0, 1, 0], scale: [0.2, 1, 0.2], rotate: [0, 40 * s, 80 * s] } : { opacity: 0, scale: 0.2, rotate: 0 }}
                transition={
                  love && !reduced
                    ? { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.1, delay: 0.7 + index * 0.4 }
                    : { duration: 0 }
                }
                style={centre}
              />
              <motion.path
                d={star(cx - 42 * s, 404, 6.5)}
                fill="#ffffff"
                initial={false}
                animate={love && !reduced ? { opacity: [0, 0.95, 0], scale: [0.2, 1, 0.2], rotate: [0, -40 * s, -80 * s] } : { opacity: 0, scale: 0.2, rotate: 0 }}
                transition={
                  love && !reduced
                    ? { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.1, delay: 1.6 + index * 0.4 }
                    : { duration: 0 }
                }
                style={centre}
              />
            </motion.g>
          </motion.g>
        );
      })}

      <motion.g
        id="password-face"
        pointerEvents="none"
        initial={false}
        animate={{ opacity: mood === "password" ? 1 : 0, y: mood === "password" && !reduced ? [0, -1.5, 0] : 0 }}
        transition={mood === "password" && !reduced ? { opacity: quick, y: { duration: 2.8, ease: "easeInOut", repeat: Infinity } } : quick}
        style={centre}
      >
        <path id="left-password-eye" d="M314 353 C331 365 355 365 372 353" fill="none" stroke={INK} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
        <path id="right-password-eye" d="M520 353 C537 365 561 365 578 353" fill="none" stroke={INK} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
      </motion.g>

      <motion.g
        id="side-eye-eyes"
        pointerEvents="none"
        initial={false}
        animate={{ opacity: mood === "sideEye" ? 1 : 0, x: mood === "sideEye" ? -4 : 0, y: mood === "sideEye" ? 1 : 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 230, damping: 18, opacity: { duration: 0.13, ease: "easeOut" } }}
        style={centre}
      >
        <path id="left-side-eye" d="M314 357 C331 337 353 336 372 351" fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" opacity="0.92" />
        <ellipse id="left-side-eye-blob" cx="373" cy="360" rx="10.5" ry="13.5" fill={INK} opacity="0.92" transform="rotate(-16 373 360)" />
        <path id="right-side-eye" d="M520 357 C537 337 559 336 578 351" fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" opacity="0.92" />
        <ellipse id="right-side-eye-blob" cx="579" cy="360" rx="10.5" ry="13.5" fill={INK} opacity="0.92" transform="rotate(-16 579 360)" />
      </motion.g>

      <motion.g
        id="sad-brows"
        pointerEvents="none"
        initial={false}
        animate={{ opacity: mood === "sad" ? 1 : 0, y: mood === "sad" ? 0 : -2 }}
        transition={reduced ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
        style={centre}
      >
        <path id="left-sad-brow" d="M318 342 C342 328 370 324 392 331" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" opacity="0.58" />
        <path id="right-sad-brow" d="M512 331 C534 324 562 328 586 342" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" opacity="0.58" />
      </motion.g>

      <motion.g
        id="raised-brows"
        pointerEvents="none"
        initial={false}
        animate={{ opacity: raised ? 0.6 : 0, y: raised ? 0 : 6 }}
        transition={soft}
        style={centre}
      >
        <motion.path
          id="left-raised-brow"
          initial={false}
          animate={{
            d: mood === "surprised" ? "M316 314 C338 298 366 298 390 306" : "M316 316 C338 296 368 294 392 304",
            y: mood === "curious" && !reduced ? [0, 0, -4, -4, 0, 0] : 0,
          }}
          transition={mood === "curious" && !reduced ? { d: soft, y: CURIOUS_LOOP } : soft}
          fill="none"
          stroke={INK}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <motion.path
          id="right-raised-brow"
          initial={false}
          animate={{ opacity: mood === "surprised" ? 1 : 0 }}
          d="M514 306 C538 298 566 298 588 314"
          transition={soft}
          fill="none"
          stroke={INK}
          strokeWidth="7"
          strokeLinecap="round"
        />
      </motion.g>

      <AngerMark active={angry} reduced={reduced} />
    </g>
  );
}

const BEAN = "M0 -20 C9 -20 15 -11 15 0 C15 12 9 20 0 20 C-9 20 -15 12 -15 0 C-15 -11 -9 -20 0 -20 Z";
const HALF_BEAN = "M-14.5 -3 L14.5 -3 C14.5 9 9 20 0 20 C-9 20 -14.5 9 -14.5 -3 Z";
const HALF_LID = "M-19 -4 C-8 -7 8 -7 19 -4";
const ANGRY_BEAN = "M-14 -13 L15 -3 C15 10 9 20 0 20 C-9 20 -14.5 9 -14 -13 Z";
const ANGRY_LID = "M-19 -17 L17 -6";
const ANGRY_BROW = "M-20 -33 L12 -23";
const ARC = "M-19 6 C-10 -14 10 -14 19 6";
const CLOSED = "M-20 -5 C-12 6 12 6 20 -5";
const SQUINT = "M-14 -1 L14 -1";
const RAISED_BROW = "M-18 -36 Q-2 -44 16 -34";
const SAD_BROW = "M-20 -29 Q-5 -30 14 -43";
const bean = (x = 0, y = 0, scale = 1, scaleY = scale) => ({ x, y, scaleX: scale, scaleY });
const V2_BEANS = {
  happy: [bean(0, -1, 1.12), bean(0, -1, 1.12)],
  curious: [bean(4, -4, 1.12), bean(4, -3, 1.04)],
  shy: [bean(6, 8, 0.72), bean(-6, 8, 0.72)],
  sad: [bean(7, 5, 1.13, 1.05), bean(-7, 5, 1.13, 1.05)],
  hmm: [bean(-6, 1), bean(-6, 1)],
  wave: [bean(0, -1, 1.06), bean(0, -1, 1.06)],
};
const REST = [bean(), bean()];

function V2Eyes({ mood, blinkLeft, blinkRight, gazeX, gazeY, reduced, happyEyes, sparkle, stir, closedEyes = false }) {
  const driftX = useTransform(gazeX, (v) => v * 0.5);
  const driftY = useTransform(gazeY, (v) => v * 0.5);
  const starEyes = mood === "happy" && happyEyes === "star";
  const quick = reduced ? { duration: 0 } : { duration: 0.13, ease: "easeOut" };
  const springy = reduced ? { duration: 0 } : { delay: 0.05, type: "spring", stiffness: 240, damping: 17 };
  const soft = reduced ? { duration: 0 } : { type: "spring", stiffness: 230, damping: 18 };
  const beans = V2_BEANS[mood] ?? REST;
  const loop = loopFor(mood);
  const roamTransition = loop && !reduced ? loop : springy;

  return (
    <motion.g id="eyes" data-eye-style="v2" style={{ x: driftX, y: driftY }}>
      {SIDES.map((index) => {
        const s = index === 0 ? 1 : -1;
        const cx = index === 0 ? 345 : 559;
        const side = index === 0 ? "left" : "right";
        const mirror = index === 0 ? void 0 : "scale(-1 1)";
        const blink = index === 0 ? blinkLeft : blinkRight;
        const arc = (mood === "happy" && happyEyes === "smile") || mood === "wave";
        const squint = mood === "hmm" && index === 1;
        const closed = mood === "password" || Boolean(closedEyes);
        const half = (mood === "sleepy" || mood === "sideEye") && !closed;
        const angry = mood === "angry";
        const ring = mood === "surprised";
        const love = mood === "love";
        const open = !arc && !squint && !half && !angry && !ring && !love && !closed;
        const fade = (on) => ({ opacity: on ? 1 : 0 });

        return (
          <g key={side} id={`${side}-eye`} transform={`translate(${cx} 377) scale(1.12)`}>
            <motion.g initial={false} animate={still(roamFor(mood, s), reduced)} transition={roamTransition} style={centre}>
              <motion.g style={{ scaleY: blink, originX: 0.5, originY: 0.5 }}>
                <motion.g id={`${side}-bean`} initial={false} animate={{ ...beans[index], ...fade(open) }} transition={springy} style={centre}>
                  <path d={BEAN} fill="var(--jelly-face-ink, #170d25)" />
                  <motion.circle cx="-4.5" cy="-8" r="3.6" fill="#ffffff" initial={false} animate={{ opacity: starEyes ? 0 : 0.95 }} transition={quick} />
                  <motion.path
                    d={star(-3, -6, 7)}
                    fill="#ffffff"
                    initial={false}
                    animate={{ opacity: starEyes ? 1 : 0, scale: starEyes ? 1 : 0.5 }}
                    transition={reduced ? { duration: 0 } : { delay: starEyes ? 0.12 : 0, type: "spring", stiffness: 300, damping: 16 }}
                    style={centre}
                  />
                  <motion.path
                    d={star(6, 9, 4.5)}
                    fill="#ffffff"
                    initial={false}
                    animate={sparkle ? { opacity: 0.95, scale: reduced ? 1 : [0.85, 1.15, 0.85] } : { opacity: 0, scale: 0.5 }}
                    transition={
                      sparkle && !reduced
                        ? { opacity: { duration: 0.2 }, scale: { duration: 1.5 + index * 0.2, repeat: Infinity, ease: "easeInOut" } }
                        : { duration: reduced ? 0 : 0.16 }
                    }
                    style={centre}
                  />
                </motion.g>

                <motion.g
                  id={`${side}-half-bean`}
                  initial={false}
                  animate={{ ...fade(half), x: mood === "sideEye" ? 9 : 0, y: mood === "sleepy" ? 4 : 0, rotate: mood === "sleepy" ? (index === 0 ? -4 : 4) : 0 }}
                  transition={soft}
                  style={centre}
                >
                  <motion.g key={stir} initial={stir && half && !reduced ? { y: -6 } : false} animate={{ y: 0 }} transition={soft} style={centre}>
                    <path d={HALF_BEAN} fill="var(--jelly-face-ink, #170d25)" />
                    <path d={HALF_LID} fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
                    <circle cx="5" cy="6" r="2.6" fill="#ffffff" opacity="0.8" />
                  </motion.g>
                </motion.g>

                <motion.g id={`${side}-angry-bean`} initial={false} animate={{ ...fade(angry), y: angry ? 2 : -3 }} transition={soft} style={centre}>
                  <g transform={mirror}>
                    <path d={ANGRY_BEAN} fill="var(--jelly-face-ink, #170d25)" />
                    <path d={ANGRY_LID} fill="none" stroke={INK} strokeWidth="6.5" strokeLinecap="round" />
                    <path d={ANGRY_BROW} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" opacity="0.9" />
                    <circle cx="4" cy="6" r="2.8" fill="#ffffff" opacity="0.85" />
                  </g>
                </motion.g>

                <motion.g id={`${side}-ring`} initial={false} animate={{ ...fade(ring), scale: ring ? 1.18 : 0.7 }} transition={soft} style={centre}>
                  <ellipse rx="17" ry="20" fill="var(--jelly-face-ink, #170d25)" />
                  <ellipse cx="-5" cy="-7" rx="4.5" ry="5" fill="#fff" opacity="0.95" />
                </motion.g>

                <motion.g
                  id={`${side}-heart`}
                  initial={false}
                  animate={{ opacity: love ? 1 : 0, scale: love ? 1 : 0.2, rotate: love ? -9 * s : 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : love
                      ? {
                          opacity: { duration: 0.12 },
                          scale: { type: "spring", stiffness: 260, damping: 11, delay: index * 0.07 },
                          rotate: { type: "spring", stiffness: 260, damping: 14 },
                        }
                      : { duration: 0.16 }
                  }
                  style={centre}
                >
                  <motion.g
                    initial={false}
                    animate={{ scale: love && !reduced ? HEARTBEAT_FRAMES : 1 }}
                    transition={love && !reduced ? { ...HEARTBEAT, delay: 0.5 + index * 0.08 } : { duration: 0 }}
                    style={centre}
                  >
                    <path d={heart(0, 0, 1.25)} fill={HEART_FALLBACK} style={{ fill: HEART }} />
                    <ellipse cx="-13" cy="-21" rx="6" ry="4" fill="#ffffff" opacity="0.92" transform="rotate(-32 -13 -21)" />
                  </motion.g>

                  <motion.path
                    d={star(30 * s, -30, 6)}
                    fill="#ffffff"
                    initial={false}
                    animate={love && !reduced ? { opacity: [0, 1, 0], scale: [0.2, 1, 0.2], rotate: [0, 40 * s, 80 * s] } : { opacity: 0, scale: 0.2, rotate: 0 }}
                    transition={
                      love && !reduced
                        ? { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.1, delay: 0.7 + index * 0.4 }
                        : { duration: 0 }
                    }
                    style={centre}
                  />
                  <motion.path
                    d={star(-27 * s, 24, 4.5)}
                    fill="#ffffff"
                    initial={false}
                    animate={love && !reduced ? { opacity: [0, 0.95, 0], scale: [0.2, 1, 0.2], rotate: [0, -40 * s, -80 * s] } : { opacity: 0, scale: 0.2, rotate: 0 }}
                    transition={
                      love && !reduced
                        ? { duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.1, delay: 1.6 + index * 0.4 }
                        : { duration: 0 }
                    }
                    style={centre}
                  />
                </motion.g>
              </motion.g>

              <motion.path
                id={`${side}-squint`}
                d={SQUINT}
                fill="none"
                stroke={INK}
                strokeWidth="7"
                strokeLinecap="round"
                initial={false}
                animate={{ ...fade(squint), x: squint ? -6 : 0 }}
                transition={soft}
              />
            </motion.g>

            <motion.path
              id={`${side}-arc`}
              d={ARC}
              fill="none"
              stroke={INK}
              strokeWidth="9"
              strokeLinecap="round"
              initial={false}
              animate={{ ...fade(arc), scaleY: arc ? 1 : 0.4 }}
              transition={reduced ? { duration: 0 } : { delay: arc ? 0.1 : 0, type: "spring", stiffness: 260, damping: 18 }}
              style={bottom}
            />

            <motion.path
              id={`${side}-closed`}
              d={CLOSED}
              fill="none"
              stroke={INK}
              strokeWidth="9"
              strokeLinecap="round"
              initial={false}
              animate={fade(closed)}
              transition={quick}
            />

            <g transform={mirror}>
              <motion.path
                id={`${side}-brow`}
                fill="none"
                stroke={INK}
                strokeWidth="6"
                strokeLinecap="round"
                initial={false}
                animate={{
                  d: mood === "sad" ? SAD_BROW : RAISED_BROW,
                  opacity: mood === "sad" ? 0.7 : mood === "surprised" || ((mood === "curious" || mood === "hmm") && index === 0) ? 0.75 : 0,
                  y: mood === "surprised" ? -6 : mood === "sad" ? 0 : mood === "curious" || mood === "hmm" ? -2 : 6,
                }}
                transition={soft}
              />
            </g>
          </g>
        );
      })}

      <AngerMark active={mood === "angry"} reduced={reduced} small={true} />
    </motion.g>
  );
}

const EXTRA_MOODS = ["curious", "surprised", "sleepy", "shy", "love", "wave"];
const BODY_SHAPE =
  "M450 135 C520 137 580 158 618 200 C652 240 672 290 680 345 C686 390 688 425 686 462 C684 505 676 530 658 552 C641 569 627 580 602 583 C578 585 561 578 536 577 C510 576 482 585 450 585 C418 585 390 576 364 577 C339 578 323 585 298 583 C273 580 259 569 242 552 C224 530 216 505 214 462 C212 425 214 390 220 345 C228 290 248 240 282 200 C320 158 380 137 450 135 Z";
const SAD_SHAPE =
  "M450 168 C516 169 568 188 604 222 C640 258 662 308 672 364 C678 408 682 444 680 482 C678 522 668 548 646 566 C628 582 606 590 580 590 C554 590 530 582 504 583 C482 584 467 593 450 593 C433 593 418 584 396 583 C370 582 346 590 320 590 C294 590 272 582 254 566 C232 548 222 522 220 482 C218 444 222 408 228 364 C238 308 260 258 296 222 C332 188 384 169 450 168 Z";

const BODY_PATHS = {
  curious: BODY_SHAPE,
  surprised: BODY_SHAPE,
  sleepy: BODY_SHAPE,
  shy: BODY_SHAPE,
  love: BODY_SHAPE,
  wave: BODY_SHAPE,
  sideEye: BODY_SHAPE,
  password: BODY_SHAPE,
  hmm: BODY_SHAPE,
  neutral: BODY_SHAPE,
  happy: BODY_SHAPE,
  sad: SAD_SHAPE,
  angry: BODY_SHAPE,
};

const NEUTRAL_TOP = "M450 135 C520 137 580 158 618 200 C652 240 672 290 680 345 C686 390 688 425 686 462";
const NEUTRAL_BOTTOM = [
  [684, 505], [676, 530], [658, 552], [641, 569], [627, 580], [602, 583],
  [578, 585], [561, 578], [536, 577], [510, 576], [482, 585], [450, 585],
  [418, 585], [390, 576], [364, 577], [339, 578], [323, 585], [298, 583],
  [273, 580], [259, 569], [242, 552], [224, 530], [216, 505], [214, 462],
  [212, 425], [214, 390], [220, 345], [228, 290], [248, 240], [282, 200],
  [320, 158], [380, 137], [450, 135],
];

const RIPPLE_AMP = 10;
const SLOSH_AMP = 4;
const WOBBLE_K = 0.016;
const lowness = (y) => Math.max(0, Math.min(1, (y - 440) / 145));
const legBias = (x) => 0.3 + 0.7 * Math.min(1, Math.abs(x - 450) / 150);

function bottomWave(phase, amt = 1) {
  let d = NEUTRAL_TOP;
  for (let i = 0; i < NEUTRAL_BOTTOM.length; i += 3) {
    const seg = NEUTRAL_BOTTOM.slice(i, i + 3).map(([x, y]) => {
      const w = lowness(y) * legBias(x) * amt;
      const px = x + w * (SLOSH_AMP * Math.sin(phase) + RIPPLE_AMP * 0.22 * Math.cos(WOBBLE_K * x + phase));
      const py = y + w * RIPPLE_AMP * Math.sin(WOBBLE_K * x + phase);
      return `${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(" ");
    d += ` C${seg}`;
  }
  return `${d} Z`;
}

function lerpPath(a, b, t) {
  if (t <= 1e-4) return a;
  if (t >= 0.9999) return b;
  const nb = b.match(/-?\d+(?:\.\d+)?/g) ?? [];
  let i = 0;
  return a.replace(/-?\d+(?:\.\d+)?/g, (na) => (parseFloat(na) + (parseFloat(nb[i++] ?? na) - parseFloat(na)) * t).toFixed(1));
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const IDLE_MOODS = new Set(["neutral", "hmm", "sideEye", "password"]);

const BODY_TRANSFORMS = {
  sideEye: { x: -4, y: 1, rotate: -1.2, scaleX: 1, scaleY: 1, skewX: 0, transition: { type: "spring", stiffness: 190, damping: 18 } },
  password: { x: 0, y: [0, -2, 0], rotate: 0, scaleX: [1, 0.996, 1], scaleY: [1, 1.008, 1], skewX: 0, transition: { duration: 3.8, ease: "easeInOut", repeat: Infinity } },
  hmm: { y: 0, scaleX: 1, scaleY: 1, skewX: 2.5, transition: { type: "spring", stiffness: 200, damping: 18 } },
  neutral: { y: [0, -3, 0], scaleX: [1, 0.992, 1], scaleY: [1, 1.012, 1], transition: { duration: 4.2, ease: "easeInOut", repeat: Infinity } },
  happy: { y: [0, -22, -6, -10], scaleX: [1, 1, 1.05, 1], scaleY: [1, 1.06, 0.96, 1], transition: { type: "spring", stiffness: 220, damping: 9, mass: 0.7 } },
  happyStill: { y: 0, scaleX: 1, scaleY: 1, skewX: 0, transition: { type: "spring", stiffness: 240, damping: 16 } },
  sad: { y: 0, scaleX: 1, scaleY: 1, transition: { type: "spring", stiffness: 130, damping: 20, mass: 1.05 } },
  angry: { y: 5, scaleX: 1, scaleY: 0.95, transition: { type: "spring", stiffness: 260, damping: 8, mass: 0.7 } },
};

const FACE_TRANSFORMS = {
  sideEye: { x: -7, y: 2, scaleX: 1, scaleY: 0.98, rotate: -2, transition: { delay: 0.05, type: "spring", stiffness: 210, damping: 18 } },
  password: { x: -4, y: 3, scale: 1, rotate: -3, transition: { delay: 0.04, type: "spring", stiffness: 210, damping: 17 } },
  hmm: { y: 0, scale: 1, transition: { delay: 0.05, type: "spring", stiffness: 200, damping: 18 } },
  neutral: { y: [0, -3, 0], scaleX: [1, 0.992, 1], scale: 1, transition: { duration: 4.2, ease: "easeInOut", repeat: Infinity } },
  happy: { y: [0, -22, -6, -10], scale: 1, transition: { delay: 0.05, type: "spring", stiffness: 220, damping: 9, mass: 0.7 } },
  happyStill: { y: 0, scale: 1, transition: { type: "spring", stiffness: 240, damping: 16 } },
  sad: { y: 12, scaleX: 1, scaleY: 1, transition: { delay: 0.04, type: "spring", stiffness: 145, damping: 18, mass: 0.95 } },
  angry: { y: 7, scaleX: 1, scaleY: 0.96, transition: { delay: 0.05, type: "spring", stiffness: 260, damping: 9, mass: 0.7 } },
};

const LEFT_ARM_TRANSFORMS = {
  sideEye: { y: 0, rotate: 0, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  password: { y: 0, rotate: -2, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  hmm: { y: 0, rotate: 0, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  neutral: { y: 0, rotate: 0, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  happy: { y: [0, -19, -5, -9], rotate: -8, transition: { delay: 0.1, type: "spring", stiffness: 210, damping: 11, mass: 0.8 } },
  happyStill: { y: 0, rotate: -8, transition: { delay: 0.05, type: "spring", stiffness: 220, damping: 13 } },
  sad: { y: 13, rotate: 12, scaleX: 0.96, scaleY: 0.96, transition: { delay: 0.1, type: "spring", stiffness: 135, damping: 18, mass: 0.95 } },
  angry: { y: 2, rotate: -3, transition: { delay: 0.08, type: "spring", stiffness: 250, damping: 10, mass: 0.8 } },
};

const RIGHT_ARM_TRANSFORMS = {
  sideEye: { y: 0, rotate: 0, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  password: { y: 0, rotate: 2, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  hmm: { y: 0, rotate: 0, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  neutral: { y: 0, rotate: 0, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 16 } },
  happy: { y: [0, -19, -5, -9], rotate: 8, transition: { delay: 0.12, type: "spring", stiffness: 210, damping: 11, mass: 0.8 } },
  happyStill: { y: 0, rotate: 8, transition: { delay: 0.05, type: "spring", stiffness: 220, damping: 13 } },
  sad: { y: 13, rotate: -12, scaleX: 0.96, scaleY: 0.96, transition: { delay: 0.1, type: "spring", stiffness: 135, damping: 18, mass: 0.95 } },
  angry: { y: 2, rotate: 3, transition: { delay: 0.08, type: "spring", stiffness: 250, damping: 10, mass: 0.8 } },
};

const ARM_REST_POSES = [
  { l: { dx: -2, dy: 3, rot: -5 }, r: { dx: 2, dy: -2, rot: 3 } },
  { l: { dx: 1, dy: -3, rot: 5 }, r: { dx: -2, dy: 4, rot: -6 } },
  { l: { dx: -3, dy: 4, rot: -4 }, r: { dx: 1, dy: 1, rot: 6 } },
  { l: { dx: 3, dy: -1, rot: 6 }, r: { dx: -3, dy: 2, rot: -3 } },
  { l: { dx: -1, dy: 2, rot: -6 }, r: { dx: 2, dy: -3, rot: 4 } },
  { l: { dx: 2, dy: 5, rot: 3 }, r: { dx: -2, dy: -2, rot: -5 } },
];
const LEFT_ARM_PIVOT = "229 407";
const RIGHT_ARM_PIVOT = "671 407";

const HIGHLIGHT_TRANSFORMS = {
  sideEye: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  password: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  hmm: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  neutral: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  happy: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 220, damping: 12 } },
  sad: { x: 0, y: 20, scaleX: 1.02, scaleY: 0.98, transition: { type: "spring", stiffness: 150, damping: 20, mass: 0.85 } },
  angry: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 240, damping: 12 } },
};

const HEAD_HIGHLIGHT_TRANSFORMS = {
  sideEye: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  password: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  hmm: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  neutral: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  happy: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 220, damping: 12 } },
  sad: { x: 0, y: 22, scaleX: 0.96, scaleY: 0.96, opacity: 0.9, transition: { type: "spring", stiffness: 150, damping: 20, mass: 0.85 } },
  angry: { x: 0, y: 0, scale: 1, transition: { type: "spring", stiffness: 240, damping: 12 } },
};

const CHEEK_TRANSFORMS = {
  sideEye: { x: -3, y: 3, scaleX: 0.9, scaleY: 0.82, opacity: 0.48 },
  password: { x: 0, y: 2, scaleX: 0.86, scaleY: 0.76, opacity: 0.38 },
  hmm: { scale: 1, opacity: 0.7 },
  neutral: { scale: 1, opacity: 0.76 },
  happy: { y: -1, scale: 1.1, opacity: 0.88 },
  sad: { y: 8, scaleX: 1.04, scaleY: 0.8, opacity: 0.72 },
  angry: { y: 2, scaleX: 1.08, scaleY: 0.94, opacity: 0.9 },
};

const BOOP_KEYS = [1, 0.86, 1.08, 0.97, 1];
const BOOP_TIMES = [0, 0.2, 0.5, 0.78, 1];
const POKE_LIMIT = 6;
const POKE_WINDOW = 2500;
const WAKE_POKES = 3;
const WAKE_HOLD = 1400;

const GLOSS_MOOD = {
  sideEye: { x: 0, y: 0, scale: 1, opacity: 0.86, transition: { type: "spring", stiffness: 200, damping: 20 } },
  password: { x: 0, y: 0, scale: 1, opacity: 0.88, transition: { type: "spring", stiffness: 200, damping: 20 } },
  hmm: { x: 0, y: 0, scale: 1, opacity: 0.9, transition: { type: "spring", stiffness: 200, damping: 20 } },
  neutral: { x: 0, y: 0, scale: 1, opacity: 0.92, transition: { type: "spring", stiffness: 200, damping: 20 } },
  happy: { x: 0, y: 0, scale: 1, opacity: 0.95, transition: { type: "spring", stiffness: 220, damping: 12 } },
  sad: { x: 0, y: 0, scale: 1, opacity: 0.82, transition: { type: "spring", stiffness: 140, damping: 18, mass: 0.9 } },
  angry: { x: 0, y: 0, scale: 1, opacity: 0.86, transition: { type: "spring", stiffness: 240, damping: 12 } },
};

const MOUTH_PATHS = {
  curious: "M439 417 C447 422 460 422 468 413",
  surprised: "M431 409 C437 429 466 429 473 409",
  sleepy: "M443 424 C448 427 456 427 461 424",
  shy: "M441 423 C446 430 459 430 464 421",
  love: "M429 411 C439 437 467 437 477 411",
  wave: "M426 406 C438 434 467 434 479 406",
  sideEye: "M432 418 C445 418 461 415 474 409",
  password: "M452 416 C452 416 452 416 452 416",
  hmm: "M431 418 C443 420 461 414 473 411",
  neutral: "M431 409 C437 429 466 429 473 409",
  happy: "M420 402 C435 448 470 448 485 402",
  sad: "M431 424 C440 414 464 414 473 424",
  angry: "M430 429 C442 416 462 416 474 429",
};

const TALK_MOUTH_PATHS = {
  open: [
    "M441 410 C447 405 457 405 463 410 C466 417 462 424 452 424 C442 424 438 417 441 410 Z",
    "M436 408 C443 400 462 400 469 408 C474 421 466 434 452 434 C438 434 431 421 436 408 Z",
    "M439 413 C445 408 461 408 467 413 C469 423 463 430 452 430 C441 430 435 423 439 413 Z",
    "M434 411 C441 404 464 404 471 411 C474 422 466 432 452 432 C438 432 431 422 434 411 Z",
    "M441 410 C447 405 457 405 463 410 C466 417 462 424 452 424 C442 424 438 417 441 410 Z",
  ],
  wide: [
    "M438 410 C445 404 460 404 467 410 C472 421 465 432 452 432 C439 432 433 421 438 410 Z",
    "M431 407 C440 398 465 398 474 407 C481 424 469 439 452 439 C435 439 424 424 431 407 Z",
    "M428 413 C438 404 467 404 477 413 C479 426 468 435 452 435 C436 435 426 426 428 413 Z",
    "M434 409 C442 401 463 401 471 409 C477 423 467 437 452 437 C437 437 428 423 434 409 Z",
    "M438 410 C445 404 460 404 467 410 C472 421 465 432 452 432 C439 432 433 421 438 410 Z",
  ],
};

const EFFECT_TRANSFORMS = {
  sideEye: { opacity: 0, scale: 0.9 },
  password: { opacity: 0, scale: 0.9 },
  hmm: { opacity: 0, scale: 0.9 },
  neutral: { opacity: 0, scale: 0.9 },
  happy: { opacity: 1, scale: 1, y: 0, transition: { delay: 0.12, duration: 0.24 } },
  sad: { opacity: 1, scale: 1, y: 12, transition: { delay: 0.12, duration: 0.28 } },
  angry: { opacity: 1, scale: 1, y: 0, transition: { delay: 0.08, duration: 0.2 } },
};

const GESTURE_POSES = {
  rest: { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, transition: { type: "spring", stiffness: 190, damping: 19 } },
  curious: { rotate: [0, -2, 5, 4], y: [0, 2, -5, -3], scaleX: 0.99, scaleY: 1.02, transition: { duration: 1.1, times: [0, 0.2, 0.65, 1], ease: "easeInOut" } },
  surprised: { y: [0, 8, -27, 0], scaleX: [1, 1.06, 0.92, 1], scaleY: [1, 0.94, 1.1, 1], transition: { duration: 0.75, times: [0, 0.18, 0.48, 1], ease: "easeInOut" } },
  sleepy: { rotate: [0, -3, -3, 0], scaleX: [1.025, 1.04, 1.025, 1.025], scaleY: [0.965, 0.95, 0.965, 0.965], transition: { duration: 5.6, repeat: Infinity, ease: "easeInOut" } },
  shy: { rotate: -4, scaleX: 1.025, scaleY: 0.965, transition: { type: "spring", stiffness: 140, damping: 18 } },
  love: { rotate: [-4, 4, -4], y: [0, -9, 0], scaleX: [1, 1.03, 1], scaleY: [1, 0.985, 1], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
  wave: { rotate: [0, -3, 1, 0], y: [0, -4, -2, 0], transition: { duration: 1.8, ease: "easeInOut" } },
};

for (const state of EXTRA_MOODS) {
  BODY_TRANSFORMS[state] = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, skewX: 0 };
  FACE_TRANSFORMS[state] = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1 };
  LEFT_ARM_TRANSFORMS[state] = { y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
  RIGHT_ARM_TRANSFORMS[state] = { y: 0, rotate: 0, scaleX: 1, scaleY: 1 };
  HIGHLIGHT_TRANSFORMS[state] = HIGHLIGHT_TRANSFORMS.neutral;
  HEAD_HIGHLIGHT_TRANSFORMS[state] = HEAD_HIGHLIGHT_TRANSFORMS.neutral;
  GLOSS_MOOD[state] = GLOSS_MOOD.neutral;
  CHEEK_TRANSFORMS[state] = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 0.8 };
  EFFECT_TRANSFORMS[state] = { opacity: 0, scale: 1, y: 0 };
}
CHEEK_TRANSFORMS.shy = CHEEK_TRANSFORMS.love = { x: 0, y: 3, scaleX: 1.2, scaleY: 1.15, opacity: 1 };
RIGHT_ARM_TRANSFORMS.wave = { y: 0, rotate: 0 };
LEFT_ARM_TRANSFORMS.shy = { y: 5, rotate: 15 };
RIGHT_ARM_TRANSFORMS.shy = { y: 5, rotate: -15 };
const RIGHT_HAND_REST = "M684 380 C705 380 720 396 720 416 C720 438 705 452 684 452 C663 452 650 438 650 416 C650 396 663 380 684 380 Z";

const POSE_CACHE = new WeakMap();
function poseVariants(variants, reduced) {
  const cached = POSE_CACHE.get(variants)?.get(reduced);
  if (cached) return cached;
  const result = Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      if (typeof value === "function") return [key, value];
      const pose2 = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, scaleY: 1, skewX: 0, opacity: 1, ...value };
      if (!reduced && value.transition?.repeat === Infinity) {
        pose2.transition = {
          ...value.transition,
          repeat: 0,
          ...Object.fromEntries(
            Object.entries(pose2)
              .filter(([property]) => property !== "transition")
              .map(([property, target]) => [property, Array.isArray(target) ? value.transition : { duration: 0.24, ease: "easeOut" }])
          ),
        };
      }
      if (!reduced) return [key, pose2];
      return [
        key,
        {
          ...Object.fromEntries(
            Object.entries(pose2).map(([property, target]) => [property, Array.isArray(target) ? target[target.length - 1] : target])
          ),
          transition: { duration: 0 },
        },
      ];
    })
  );
  const cache = POSE_CACHE.get(variants) ?? new Map();
  cache.set(reduced, result);
  POSE_CACHE.set(variants, cache);
  return result;
}

const svgMotionStyle = { transformBox: "fill-box", transformOrigin: "center bottom" };
const centerMotionStyle = { transformBox: "fill-box", transformOrigin: "center" };
const nodMotionStyle = { transformBox: "fill-box", transformOrigin: "center 78%" };
const leftArmStyle = { transformBox: "fill-box", transformOrigin: "70% 38%" };
const rightArmStyle = { transformBox: "fill-box", transformOrigin: "30% 38%" };

const BURST_STAR = "M0 -11 C1.6 -3.5 4.5 -0.9 11 0 C4.5 0.9 1.6 3.5 0 11 C-1.6 3.5 -4.5 0.9 -11 0 C-4.5 -0.9 -1.6 -3.5 0 -11 Z";
const BURST_HEART = "M0 -3.5 C-2.6 -8 -9 -6.5 -9 -0.5 C-9 4.5 -3.5 7.8 0 11 C3.5 7.8 9 4.5 9 -0.5 C9 -6.5 2.6 -8 0 -3.5 Z";
const BURST_BITS = [
  { k: "star", dx: -95, dy: -78, s: 1.5, d: 0, r0: -20, r1: 15 },
  { k: "star", dx: 108, dy: -62, s: 1.9, d: 0.05, r0: 10, r1: -18 },
  { k: "heart", dx: -128, dy: -18, s: 1.3, d: 0.1, r0: -8, r1: -14 },
  { k: "star", dx: 62, dy: -108, s: 1.1, d: 0.12, r0: 0, r1: 24 },
  { k: "heart", dx: 128, dy: -6, s: 1.05, d: 0.16, r0: 8, r1: 16 },
  { k: "dot", dx: -52, dy: -116, s: 1, d: 0.2, r0: 0, r1: 0 },
];

export function JellyBlobMascot({
  mood: moodProp = "neutral",
  className,
  onOverpoke,
  onPoke,
  onWake,
  happyEyes = "smile",
  eyeStyle = "v1",
  gaze = { x: 0, y: 0 },
  mouth,
  nod = false,
  sparkle = false,
  blink = 0,
  stillBody = false,
  celebrate = 0,
  closedEyes = false,
}) {
  const reduce = useReducedMotionPreference();
  const [awake, setAwake] = useState(false);
  const [stir, setStir] = useState(0);
  const sleepPokes = useRef(0);
  const wakeTimer = useRef(0);
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  const mood = awake ? "surprised" : moodProp;
  useEffect(() => {
    if (moodProp !== "sleepy") sleepPokes.current = 0;
  }, [moodProp]);
  useEffect(() => () => window.clearTimeout(wakeTimer.current), []);

  const gesture = EXTRA_MOODS.includes(mood) ? mood : "rest";
  const moodLabel = stillBody && mood === "happy" ? "happyStill" : mood;
  const uid = useId().replace(/:/g, "");
  const bodyFill = `${uid}-bodyFill`;
  const bodyEdge = `${uid}-bodyEdge`;
  const armFill = `${uid}-armFill`;
  const cheekFill = `${uid}-cheekFill`;
  const shadowFill = `${uid}-shadowFill`;
  const bellyGlow = `${uid}-bellyGlow`;
  const bodyClip = `${uid}-bodyClip`;
  const shadowBlur = `${uid}-shadowBlur`;
  const softBlur = `${uid}-softBlur`;
  const wideSoftBlur = `${uid}-wideSoftBlur`;
  const goo = `${uid}-goo`;

  const blinkL = useMotionValue(1);
  const blinkR = useMotionValue(1);
  useEffect(() => {
    if (reduce) {
      blinkL.set(1);
      blinkR.set(1);
      return;
    }
    let cancelled = false;
    let timer = 0;
    const dip = (mv, dur = 0.2, then) => animate(mv, [1, 0.04, 1], { duration: dur, ease: ["easeIn", "easeOut"], times: [0, 0.42, 1], onComplete: then });
    const both = (dur, then) => {
      dip(blinkL, dur);
      dip(blinkR, dur, then);
    };
    const fire = () => {
      if (cancelled) return;
      const r = Math.random();
      if (r < 0.1) dip(Math.random() < 0.5 ? blinkL : blinkR, 0.22, schedule);
      else if (r < 0.32) both(0.15, () => !cancelled && both(0.15, schedule));
      else if (r < 0.42) both(0.46, schedule);
      else both(0.2, schedule);
    };
    const schedule = () => {
      if (!cancelled) timer = window.setTimeout(fire, 2000 + Math.random() * 3000);
    };
    timer = window.setTimeout(fire, 900 + Math.random() * 1400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      blinkL.set(1);
      blinkR.set(1);
    };
  }, [reduce, blinkL, blinkR]);

  useEffect(() => {
    if (!blink || reduce) return;
    const K = [1, 0.06, 1, 1, 0.06, 1];
    const T = [0, 0.16, 0.34, 0.52, 0.68, 1];
    animate(blinkL, K, { duration: 0.5, times: T, ease: "easeInOut" });
    animate(blinkR, K, { duration: 0.5, times: T, ease: "easeInOut" });
  }, [blink, reduce, blinkL, blinkR]);

  const boop = useMotionValue(1);
  const boopX = useTransform(boop, (b) => 1 + (1 - b) * 0.9);
  const shake = useMotionValue(0);
  const pokes = useRef(0);
  const tallyTimer = useRef(0);
  const onOverpokeRef = useRef(onOverpoke);
  onOverpokeRef.current = onOverpoke;

  const onBoop = () => {
    if (moodProp === "sleepy" && !awake) {
      sleepPokes.current += 1;
      if (sleepPokes.current >= WAKE_POKES) {
        sleepPokes.current = 0;
        setAwake(true);
        window.clearTimeout(wakeTimer.current);
        wakeTimer.current = window.setTimeout(() => setAwake(false), WAKE_HOLD);
        onWakeRef.current?.();
      } else {
        setStir((n) => n + 1);
      }
      if (!reduce) animate(boop, BOOP_KEYS, { duration: 0.5, ease: "easeOut", times: BOOP_TIMES });
      onPoke?.();
      return;
    }
    if (reduce) return;
    animate(boop, BOOP_KEYS, { duration: 0.5, ease: "easeOut", times: BOOP_TIMES });
    onPoke?.();
    pokes.current += 1;
    window.clearTimeout(tallyTimer.current);
    tallyTimer.current = window.setTimeout(() => {
      pokes.current = 0;
    }, POKE_WINDOW);
    if (pokes.current >= POKE_LIMIT) {
      pokes.current = 0;
      animate(shake, [0, -6, 6, -5, 5, -3, 3, 0], { duration: 0.8, ease: "easeInOut" });
      onOverpokeRef.current?.();
    }
  };

  useEffect(() => () => clearTimeout(tallyTimer.current), []);

  const larmRot = useMotionValue(0);
  const larmY = useMotionValue(0);
  const rarmRot = useMotionValue(0);
  const rarmY = useMotionValue(0);

  useEffect(() => {
    const settle = { type: "spring", stiffness: 170, damping: 18 };
    if (reduce || !IDLE_MOODS.has(mood)) {
      animate(larmRot, 0, settle);
      animate(larmY, 0, settle);
      animate(rarmRot, 0, settle);
      animate(rarmY, 0, settle);
      return;
    }
    let cancelled = false;
    const fidget = (rot, lift) => {
      let timer = 0;
      const step = () => {
        if (cancelled) return;
        const dur = 1.1 + Math.random() * 1.7;
        animate(rot, (Math.random() - 0.5) * 9, { duration: dur, ease: "easeInOut" });
        animate(lift, (Math.random() - 0.5) * 4, { duration: dur, ease: "easeInOut", onComplete: step });
      };
      timer = window.setTimeout(step, Math.random() * 900);
      return () => window.clearTimeout(timer);
    };
    const stopL = fidget(larmRot, larmY);
    const stopR = fidget(rarmRot, rarmY);
    return () => {
      cancelled = true;
      stopL();
      stopR();
    };
  }, [mood, reduce, larmRot, larmY, rarmRot, rarmY]);

  const armRest = useRef(null);
  if (!armRest.current) {
    const p = ARM_REST_POSES[Math.floor(Math.random() * ARM_REST_POSES.length)];
    armRest.current = {
      left: `translate(${p.l.dx} ${p.l.dy}) rotate(${p.l.rot} ${LEFT_ARM_PIVOT})`,
      right: `translate(${p.r.dx} ${p.r.dy}) rotate(${p.r.rot} ${RIGHT_ARM_PIVOT})`,
    };
  }

  const gazeTargetX = useMotionValue(0);
  const gazeTargetY = useMotionValue(0);
  const smoothGazeX = useSpring(gazeTargetX, { stiffness: 115, damping: 24, mass: 0.8 });
  const smoothGazeY = useSpring(gazeTargetY, { stiffness: 115, damping: 24, mass: 0.8 });
  const faceGazeX = useTransform(smoothGazeX, (value) => value);
  const faceGazeY = useTransform(smoothGazeY, (value) => value);

  const dilate = useTransform(() => {
    const amount = Math.hypot(smoothGazeX.get() / 11, smoothGazeY.get() / 7);
    return 1 + 0.085 * Math.max(0, Math.min(1, (amount - 0.4) / 0.6));
  });

  useEffect(() => {
    const intensity = Math.max(0, Math.min(1, gaze.intensity ?? 1));
    const weight = reduce ? 0 : mood === "angry" || mood === "hmm" ? 0.4 : 1;
    const connect = (source, target, spring, range) => {
      const update = (value) => {
        const next = weight * intensity * range * Math.tanh((Number.isFinite(value) ? value : 0) / 20);
        target.set(next);
        if (reduce) spring.jump(0);
      };
      update(typeof source === "number" ? source : source.get());
      return typeof source === "number" ? void 0 : source.on("change", update);
    };
    const stopX = connect(gaze.x, gazeTargetX, smoothGazeX, 11);
    const stopY = connect(gaze.y, gazeTargetY, smoothGazeY, 7);
    return () => {
      stopX?.();
      stopY?.();
    };
  }, [gaze.x, gaze.y, gaze.intensity, mood, reduce, gazeTargetX, gazeTargetY, smoothGazeX, smoothGazeY]);

  const nodPose =
    !reduce && nod
      ? {
          x: [0, 2.2, -1.8, 1.3, -0.8, 0],
          y: [0, 3.2, -1.2, 2, -0.5, 0],
          rotate: [0, -1.6, 1.35, -0.75, 0.45, 0],
          scaleX: [1, 1.024, 0.987, 1.014, 0.996, 1],
          scaleY: [1, 0.984, 1.012, 0.992, 1.005, 1],
        }
      : { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };

  const nodTransition =
    !reduce && nod
      ? {
          duration: 1.18,
          times: [0, 0.22, 0.48, 0.7, 0.88, 1],
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 0.02,
        }
      : { type: "spring", stiffness: 260, damping: 20 };

  const bodyDMV = useMotionValue(reduce ? BODY_PATHS[mood] : IDLE_MOODS.has(mood) ? bottomWave(0) : BODY_PATHS[mood]);
  const moodRef = useRef(mood);
  const fromRef = useRef(bodyDMV.get());
  const morphRef = useRef(1);
  const phaseRef = useRef(0);
  const amtRef = useRef(IDLE_MOODS.has(mood) ? 1 : 0);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    fromRef.current = bodyDMV.get();
    morphRef.current = 0;
    moodRef.current = mood;
  }, [mood, bodyDMV]);

  useEffect(() => {
    if (reduce) {
      bodyDMV.set(BODY_PATHS[mood]);
      return;
    }
    let raf = 0;
    let last = 0;
    const PHASE_SPEED = 0.7;
    const MORPH_RATE = 2.4;
    const AMT_RATE = 2.2;
    const tick = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const idle = IDLE_MOODS.has(moodRef.current);
      phaseRef.current += dt * PHASE_SPEED;
      amtRef.current += ((idle ? 1 : 0) - amtRef.current) * Math.min(1, dt * AMT_RATE);
      const rest = idle ? bottomWave(phaseRef.current, amtRef.current) : BODY_PATHS[moodRef.current];
      morphRef.current = Math.min(1, morphRef.current + dt * MORPH_RATE);
      bodyDMV.set(morphRef.current >= 1 ? rest : lerpPath(fromRef.current, rest, easeInOut(morphRef.current)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, mood, bodyDMV]);

  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <svg
        className={className}
        viewBox="0 0 900 720"
        role="img"
        aria-label={`Jelly blob mascot, ${mood}`}
        onPointerDown={onBoop}
        style={{ display: "block", overflow: "visible", cursor: reduce ? void 0 : "pointer" }}
      >
        <defs>
          <radialGradient id={`${uid}-angerHeat`} cx="0.5" cy="0.22" r="0.75">
            <stop offset="0" stopColor="#ff725f" stopOpacity="0.94" />
            <stop offset="0.4" stopColor="#f24a65" stopOpacity="0.7" />
            <stop offset="0.78" stopColor="#e94d87" stopOpacity="0.12" />
            <stop offset="1" stopColor="#e94d87" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={bodyFill} cx="345" cy="192" r="520" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--jelly-body-top, #f2c9ff)" />
            <stop offset="0.32" stopColor="var(--jelly-body-mid, #cb84f5)" />
            <stop offset="0.67" stopColor="var(--jelly-body-deep, #9f5ce6)" />
            <stop offset="1" stopColor="var(--jelly-body-rim, #dd9dff)" />
          </radialGradient>
          <linearGradient id={bodyEdge} x1="215" y1="150" x2="735" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--jelly-outline-light, #b66af0)" />
            <stop offset="0.55" stopColor="var(--jelly-outline, #8d52de)" />
            <stop offset="1" stopColor="var(--jelly-outline-light, #ad62ea)" />
          </linearGradient>
          <radialGradient id={armFill} cx="0.45" cy="0.25" r="0.8">
            <stop offset="0" stopColor="var(--jelly-arm-light, #e6b1ff)" />
            <stop offset="0.55" stopColor="var(--jelly-arm-mid, #c07eef)" />
            <stop offset="1" stopColor="var(--jelly-arm-deep, #9758e0)" />
          </radialGradient>
          <radialGradient id={cheekFill} cx="0.34" cy="0.28" r="0.78">
            <stop offset="0" stopColor="var(--jelly-cheek-light, #ffd9ec)" />
            <stop offset="0.6" stopColor="var(--jelly-cheek, #f9a9d4)" />
            <stop offset="1" stopColor="var(--jelly-cheek-deep, #ee97c6)" />
          </radialGradient>
          <radialGradient id={shadowFill} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--jelly-shadow, var(--jelly-outline, #9e57df))" stopOpacity="0.18" />
            <stop offset="0.58" stopColor="var(--jelly-shadow-light, var(--jelly-outline-light, #b46df0))" stopOpacity="0.07" />
            <stop offset="1" stopColor="var(--jelly-shadow-light, var(--jelly-outline-light, #b46df0))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={bellyGlow} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--jelly-belly-glow, #ffbfe3)" stopOpacity="0.5" />
            <stop offset="0.7" stopColor="var(--jelly-belly-glow, #ffbfe3)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--jelly-belly-glow, #ffbfe3)" stopOpacity="0" />
          </radialGradient>
          <clipPath id={bodyClip} clipPathUnits="userSpaceOnUse">
            <motion.path initial={false} d={BODY_PATHS[mood]} animate={{ d: BODY_PATHS[mood] }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18, mass: 0.9 }} />
          </clipPath>
          <filter id={shadowBlur} x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id={softBlur} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={wideSoftBlur} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={goo} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>

        <motion.g id="bottom-shadow-glow">
          {reduce ? (
            <Fragment>
              <ellipse cx="450" cy="600" rx={mood === "sad" ? 248 : 212} ry="31" opacity="0.46" fill={`url(#${shadowFill})`} filter={`url(#${shadowBlur})`} />
              <ellipse cx="450" cy="593" rx={mood === "sad" ? 158 : 137} ry="15" opacity="0.14" fill="var(--jelly-shadow, var(--jelly-outline, #9855dd))" filter={`url(#${softBlur})`} />
            </Fragment>
          ) : (
            <Fragment>
              <motion.ellipse
                initial={false}
                cx="450"
                cy="600"
                rx="236"
                ry="43"
                opacity="0.5"
                fill={`url(#${shadowFill})`}
                filter={`url(#${shadowBlur})`}
                animate={
                  mood === "neutral"
                    ? { rx: 212, ry: 31, opacity: reduce ? 0.46 : [0.46, 0.36, 0.46] }
                    : mood === "happy"
                    ? { rx: 152, ry: 22, opacity: 0.28 }
                    : mood === "sad"
                    ? { rx: 248, ry: 36, opacity: 0.52 }
                    : mood === "hmm"
                    ? { rx: 218, ry: 31, opacity: 0.42 }
                    : mood === "sideEye"
                    ? { rx: 216, ry: 31, opacity: 0.4 }
                    : { rx: 238, ry: 34, opacity: 0.5 }
                }
                transition={reduce ? { duration: 0 } : mood === "neutral" ? { duration: 3.2, ease: "easeInOut", repeat: Infinity } : { type: "spring", stiffness: 260, damping: 20 }}
              />
              <motion.ellipse
                initial={false}
                cx="450"
                cy="593"
                rx="156"
                ry="20"
                opacity="0.12"
                fill="var(--jelly-shadow, var(--jelly-outline, #9855dd))"
                filter={`url(#${softBlur})`}
                animate={
                  mood === "neutral"
                    ? { rx: 137, ry: 15, opacity: reduce ? 0.14 : [0.14, 0.1, 0.14] }
                    : mood === "happy"
                    ? { rx: 104, ry: 12, opacity: 0.08 }
                    : mood === "hmm"
                    ? { rx: 136, ry: 15, opacity: 0.12 }
                    : mood === "sideEye"
                    ? { rx: 134, ry: 15, opacity: 0.12 }
                    : mood === "sad"
                    ? { rx: 158, ry: 18, opacity: 0.16 }
                    : { rx: 156, ry: 18, opacity: 0.15 }
                }
                transition={reduce ? { duration: 0 } : mood === "neutral" ? { duration: 3.2, ease: "easeInOut", repeat: Infinity } : { type: "spring", stiffness: 260, damping: 20 }}
              />
            </Fragment>
          )}
        </motion.g>

        <motion.g
          initial={false}
          style={{ scaleX: boopX, scaleY: boop, rotate: shake, transformBox: "fill-box", transformOrigin: "center bottom" }}
        >
          <motion.g id="typing-nod" initial={false} animate={nodPose} transition={nodTransition} style={nodMotionStyle}>
            <motion.g id="expression-gesture" initial={false} animate={stillBody ? "rest" : gesture} variants={poseVariants(GESTURE_POSES, !!reduce)} style={{ transformBox: "view-box", transformOrigin: "450px 585px" }}>
              <motion.g id="arms" initial={false} animate={moodLabel}>
                <g transform={armRest.current.left}>
                  <motion.g id="left-arm" variants={poseVariants(LEFT_ARM_TRANSFORMS, !!reduce)} style={leftArmStyle}>
                    <motion.g style={{ rotate: larmRot, y: larmY, transformBox: "fill-box", transformOrigin: "70% 38%" }}>
                      <path
                        id="left-arm-base"
                        d="M216 380 C195 380 180 396 180 416 C180 438 195 452 216 452 C237 452 250 438 250 416 C250 396 237 380 216 380 Z"
                        fill={`url(#${armFill})`}
                        stroke="var(--jelly-arm-deep, #9c5de2)"
                        strokeWidth="5.5"
                        strokeLinejoin="round"
                      />
                      <path id="left-arm-inner-shadow" d="M234 396 C214 402 208 428 220 446" fill="none" stroke="var(--jelly-arm-deep, #8d54db)" strokeWidth="9" strokeLinecap="round" opacity="0.14" filter={`url(#${softBlur})`} />
                      <ellipse id="left-arm-small-highlight" cx="196" cy="405" rx="5.6" ry="9" fill="#ffffff" opacity="0.6" transform="rotate(24 196 405)" />
                    </motion.g>
                  </motion.g>
                </g>
                <g transform={armRest.current.right}>
                  <g id="wave-hand-swing" transform={mood === "wave" && reduce ? "translate(0 -22)" : void 0}>
                    {mood === "wave" && !reduce && (
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values="0 0;4 -30;0 -7;4 -30;0 -7;0 0;0 0"
                        keyTimes="0;0.18;0.34;0.5;0.66;0.84;1"
                        dur="2s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                      />
                    )}
                    <motion.g id="right-arm" variants={poseVariants(RIGHT_ARM_TRANSFORMS, !!reduce)} style={rightArmStyle}>
                      <motion.g style={{ rotate: rarmRot, y: rarmY, transformBox: "fill-box", transformOrigin: "30% 38%" }}>
                        <motion.path
                          id="right-arm-base"
                          d={RIGHT_HAND_REST}
                          initial={false}
                          fill={`url(#${armFill})`}
                          stroke="var(--jelly-arm-deep, #9c5de2)"
                          strokeWidth="5.5"
                          strokeLinejoin="round"
                        />
                        <path id="right-arm-inner-shadow" d="M666 396 C686 402 692 428 680 446" fill="none" stroke="var(--jelly-arm-deep, #8d54db)" strokeWidth="9" strokeLinecap="round" opacity="0.14" filter={`url(#${softBlur})`} />
                        <ellipse id="right-arm-small-highlight" cx="704" cy="405" rx="5.6" ry="9" fill="#ffffff" opacity="0.6" />
                      </motion.g>
                    </motion.g>
                  </g>
                </g>
              </motion.g>

              <motion.g id="body" initial={false} animate={moodLabel} variants={poseVariants(BODY_TRANSFORMS, !!reduce)} style={svgMotionStyle}>
                <motion.path
                  initial={false}
                  id="body-main-shape"
                  d={bodyDMV}
                  fill={`url(#${bodyFill})`}
                  stroke={`url(#${bodyEdge})`}
                  strokeWidth="5.8"
                  strokeLinejoin="round"
                />
                <g id="body-shading-clipped" clipPath={`url(#${bodyClip})`}>
                  <motion.path
                    id="anger-heat"
                    d={bodyDMV}
                    fill={`url(#${uid}-angerHeat)`}
                    pointerEvents="none"
                    initial={false}
                    animate={{ opacity: mood === "angry" ? 0.82 : 0 }}
                    transition={{ duration: reduce ? 0 : mood === "angry" ? 4.5 : 1.1, ease: "easeInOut" }}
                  />
                  <path d="M479 151 C564 158 626 221 647 292" fill="none" stroke="var(--jelly-body-top, #f2c9ff)" strokeWidth="5" strokeLinecap="round" opacity="0.48" />
                  <path id="left-inner-shine" d="M300 210C262 300 258 430 286 512" fill="none" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" opacity="0.13" filter={`url(#${wideSoftBlur})`} />
                  <path id="right-inner-shade" d="M672 270C698 360 684 500 616 548" fill="none" stroke="var(--jelly-outline, #7e47cf)" strokeWidth="24" strokeLinecap="round" opacity="0.14" filter={`url(#${wideSoftBlur})`} />
                  <ellipse id="top-soft-sheen" cx="470" cy="175" rx="92" ry="27" fill="#ffffff" opacity="0.14" transform="rotate(1 470 175)" filter={`url(#${softBlur})`} />
                  <ellipse id="right-body-shine" cx="592" cy="252" rx="16" ry="36" fill="#ffffff" opacity="0.14" transform="rotate(-26 592 252)" filter={`url(#${softBlur})`} />
                </g>
                <motion.g id="lower-jelly-belly" animate={mood} variants={poseVariants(HIGHLIGHT_TRANSFORMS, !!reduce)} style={centerMotionStyle}>
                  <ellipse id="bottom-belly-glow" cx="450" cy="504" rx="240" ry="62" fill={`url(#${bellyGlow})`} opacity="0.22" />
                </motion.g>
                <g>
                  <motion.g id="highlights" animate={mood} variants={poseVariants(HEAD_HIGHLIGHT_TRANSFORMS, !!reduce)} style={centerMotionStyle}>
                    <motion.g id="head-gloss" animate={mood} variants={poseVariants(GLOSS_MOOD, !!reduce)} style={centerMotionStyle}>
                      <g id="head-gloss-gaze">
                        <ellipse id="large-highlight" cx="372" cy="212" rx="32" ry="18" fill="#ffffff" opacity="0.48" transform="rotate(-36 372 212)" />
                        <g id="small-highlights">
                          <circle id="small-head-highlight" cx="320" cy="268" r="8" fill="#ffffff" opacity="0.4" />
                          <motion.circle id="top-dot-highlight" cx="424" cy="172" r="10" fill="#ffffff" initial={false} animate={{ opacity: mood === "sad" ? 0 : 0.4 }} transition={{ duration: 0.2 }} />
                        </g>
                      </g>
                    </motion.g>
                    <ellipse id="left-side-faint-gloss" cx="252" cy="470" rx="17" ry="56" fill="#ffffff" opacity="0.09" transform="rotate(-6 252 470)" filter={`url(#${softBlur})`} />
                    <ellipse id="right-side-faint-gloss" cx="648" cy="470" rx="17" ry="56" fill="#ffffff" opacity="0.09" transform="rotate(8 648 470)" filter={`url(#${softBlur})`} />
                  </motion.g>
                </g>
              </motion.g>

              <motion.g id="face" initial={false} animate={moodLabel} variants={poseVariants(FACE_TRANSFORMS, !!reduce)} style={centerMotionStyle}>
                <motion.g id="face-attention" style={{ x: faceGazeX, y: faceGazeY }}>
                  <motion.g id="left-cheek" variants={poseVariants(CHEEK_TRANSFORMS, !!reduce)} style={centerMotionStyle}>
                    <ellipse id="left-cheek-base" cx="309" cy="430" rx="35" ry="23" fill={`url(#${cheekFill})`} opacity="0.6" filter={`url(#${softBlur})`} />
                    <ellipse id="left-cheek-highlight-large" cx="294" cy="421" rx="6.2" ry="4.2" fill="#ffffff" opacity="0.3" transform="rotate(-20 294 421)" />
                    <ellipse id="left-cheek-highlight-small" cx="319" cy="420" rx="5.8" ry="4" fill="#ffffff" opacity="0.22" transform="rotate(22 319 420)" />
                  </motion.g>
                  <motion.g id="right-cheek" variants={poseVariants(CHEEK_TRANSFORMS, !!reduce)} style={centerMotionStyle}>
                    <ellipse id="right-cheek-base" cx="617" cy="430" rx="35" ry="23" fill={`url(#${cheekFill})`} opacity="0.6" filter={`url(#${softBlur})`} />
                    <ellipse id="right-cheek-highlight-large" cx="602" cy="421" rx="6.2" ry="4.2" fill="#ffffff" opacity="0.3" transform="rotate(-20 602 421)" />
                    <ellipse id="right-cheek-highlight-small" cx="627" cy="420" rx="5.8" ry="4" fill="#ffffff" opacity="0.22" transform="rotate(22 627 420)" />
                  </motion.g>

                  <BlobFaceEyes mood={mood} eyeStyle={eyeStyle} blinkLeft={blinkL} blinkRight={blinkR} gazeX={smoothGazeX} gazeY={smoothGazeY} dilate={dilate} reduced={reduce} happyEyes={happyEyes} sparkle={sparkle} stir={stir} closedEyes={closedEyes} />

                  <motion.ellipse id="password-dot-mouth" cx="452" cy="418" rx="9" ry="6" fill="var(--jelly-eye, #21182b)" initial={false} animate={{ opacity: mood === "password" && !mouth ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.18 }} />
                  <motion.g id="shy-blush" initial={false} animate={{ opacity: mood === "shy" ? 0.7 : 0 }} transition={{ duration: reduce ? 0 : 0.3 }}>
                    <path d="M291 429 l-4 12 M305 430 l-4 12 M319 431 l-4 12 M603 431 l-4 12 M617 430 l-4 12 M631 429 l-4 12" fill="none" stroke="var(--jelly-cheek-deep, #ee97c6)" strokeWidth="5" strokeLinecap="round" />
                  </motion.g>
                  <motion.ellipse id="surprised-mouth" cx="452" cy="424" rx="15" ry="21" fill="var(--jelly-eye, #170d25)" initial={false} animate={{ rx: mood === "curious" ? 8 : 15, ry: mood === "curious" ? 11 : 21, opacity: (mood === "surprised" || mood === "curious") && !mouth ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.18 }} />
                  <motion.path
                    id="love-mouth"
                    d="M431 409 C437 427 448 428 452 416 C456 428 467 427 473 409"
                    fill="none"
                    stroke="#21102f"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ opacity: mood === "love" && !mouth ? 1 : 0, scaleY: mood === "love" ? 1 : 0.5 }}
                    transition={reduce ? { duration: 0 } : { delay: mood === "love" ? 0.08 : 0, type: "spring", stiffness: 260, damping: 16 }}
                    style={svgMotionStyle}
                  />

                  <motion.g id="happy-open-mouth" initial={false} animate={{ opacity: mood === "happy" && !mouth ? 1 : 0 }} transition={{ delay: mood === "happy" ? 0.1 : 0, duration: 0.18 }} style={centerMotionStyle}>
                    <path id="open-mouth-fill" d="M420 402 C440 384 465 384 485 402 C470 446 435 446 420 402 Z" fill="#3a0f24" stroke="none" />
                    <path id="open-mouth-tongue" d="M438 424 C440 442 465 442 467 424 C462 418 444 418 438 424 Z" fill="var(--jelly-cheek, #ff8fc0)" stroke="none" />
                    <ellipse id="open-mouth-tongue-shine" cx="452" cy="427" rx="9" ry="3.4" fill="#ffc2dc" opacity="0.7" />
                  </motion.g>

                  <motion.path
                    initial={false}
                    id="mouth"
                    d={MOUTH_PATHS[mood]}
                    animate={{
                      d: MOUTH_PATHS[mood],
                      opacity: mouth || mood === "password" || mood === "surprised" || mood === "curious" || mood === "love" ? 0 : 1,
                      x: mood === "sad" && !reduce ? [0, 1.6, -1.4, 1.1, -0.7, 0.4, 0] : 0,
                    }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            d: { delay: 0.05, type: "spring", stiffness: 240, damping: 16 },
                            opacity: { delay: 0.05, type: "spring", stiffness: 240, damping: 16 },
                            x: mood === "sad" ? { duration: 0.5, ease: "linear", repeat: Infinity, repeatDelay: 1.15, delay: 0.35 } : { duration: 0.2 },
                          }
                    }
                    fill="none"
                    stroke="#21102f"
                    strokeWidth={mood === "sad" ? 9 : 8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={centerMotionStyle}
                  />

                  <motion.path
                    id="mouth-oh"
                    d={TALK_MOUTH_PATHS.open[0]}
                    fill="#21102f"
                    initial={false}
                    animate={
                      mouth && !reduce
                        ? {
                            opacity: 1,
                            d: mouth === "wide" ? TALK_MOUTH_PATHS.wide : TALK_MOUTH_PATHS.open,
                            y: [0, -0.5, 0.35, -0.2, 0],
                            scaleX: [1, 1.03, 0.96, 1.04, 1],
                            scaleY: [0.94, 1.04, 0.98, 1.02, 0.94],
                          }
                        : { opacity: mouth ? 1 : 0, d: TALK_MOUTH_PATHS[mouth ?? "open"][0], y: 0, scaleX: mouth ? 1 : 0.72, scaleY: mouth ? 1 : 0.35 }
                    }
                    transition={
                      mouth && !reduce
                        ? {
                            d: { duration: 0.56, ease: "easeInOut", repeat: Infinity },
                            y: { duration: 0.56, ease: "easeInOut", repeat: Infinity },
                            scaleX: { duration: 0.56, ease: "easeInOut", repeat: Infinity },
                            scaleY: { duration: 0.56, ease: "easeInOut", repeat: Infinity },
                            opacity: { duration: 0.1 },
                          }
                        : { type: "spring", stiffness: 320, damping: 26 }
                    }
                    style={centerMotionStyle}
                  />
                </motion.g>
              </motion.g>

              <AnimatePresence>
                {(mood === "sleepy" || mood === "love" || mood === "surprised" || mood === "curious") && (
                  <motion.g pointerEvents="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}>
                    {mood === "sleepy" &&
                      [0, 1, 2].map((i) => (
                        <motion.path
                          key={i}
                          d={`M${637 + i * 30} ${228 - i * 37} h${15 + i * 3} l${-15 - i * 3} ${17 + i * 3} h${15 + i * 3}`}
                          fill="none"
                          stroke="var(--jelly-body-rim, #dd9dff)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          animate={reduce ? { opacity: 0.75 } : { y: [5, -10, -15], opacity: [0, 0.85, 0] }}
                          transition={{ duration: 3.6, delay: i * 0.65, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ))}
                    {mood === "love" &&
                      [-1, 1].map((side) => (
                        <g key={side} transform={`translate(${450 + side * 230} 240)`}>
                          <motion.path
                            d={BURST_HEART}
                            fill="var(--jelly-cheek, #f9a9d4)"
                            animate={reduce ? { scale: 1.6, opacity: 0.8 } : { y: [10, -20, -40], scale: [1, 1.8, 1.4], opacity: [0, 0.9, 0] }}
                            transition={{ duration: 2.8, delay: side === 1 ? 0.7 : 0, repeat: Infinity, ease: "easeOut" }}
                          />
                        </g>
                      ))}
                    {mood === "surprised" && <path d="M260 197 l-17 -24 M286 175 l-7 -29 M631 194 l18 -24" fill="none" stroke="var(--jelly-arm-light, #e6b1ff)" strokeWidth="8" strokeLinecap="round" />}
                    {mood === "curious" && <path d="M656 205 C650 185 686 179 686 199 C686 213 670 211 670 224 M670 240 v1" fill="none" stroke="var(--jelly-body-rim, #dd9dff)" strokeWidth="7" strokeLinecap="round" />}
                  </motion.g>
                )}
              </AnimatePresence>

              <motion.g id="emotion-fx" initial={false} animate={mood} variants={poseVariants(EFFECT_TRANSFORMS, !!reduce)} style={centerMotionStyle} filter={mood === "happy" || mood === "sad" || mood === "angry" ? `url(#${goo})` : void 0}>
                <motion.g id="sad-tears" initial={false} animate={{ opacity: mood === "sad" ? 1 : 0 }} transition={{ duration: mood === "sad" ? 0.25 : 0.1 }}>
                  <motion.path
                    d="M332 391 C342 398 353 399 362 395"
                    fill="none"
                    stroke="#bfeeff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={false}
                    animate={mood === "sad" && !reduce ? { opacity: [0.15, 0.5, 0.28, 0.5] } : { opacity: mood === "sad" ? 0.35 : 0 }}
                    transition={mood === "sad" && !reduce ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  />
                  <motion.path
                    d="M545 391 C555 399 566 399 575 394"
                    fill="none"
                    stroke="#bfeeff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={false}
                    animate={mood === "sad" && !reduce ? { opacity: [0.22, 0.55, 0.32, 0.55] } : { opacity: mood === "sad" ? 0.4 : 0 }}
                    transition={mood === "sad" && !reduce ? { duration: 2.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  />
                  {mood === "sad" && !reduce && (
                    <motion.g
                      initial={{ y: 0, scale: 0, opacity: 0 }}
                      animate={{ y: [0, 0, 3, 34, 46], scale: [0.25, 0.9, 1.06, 1, 0.9], opacity: [0, 0.95, 0.95, 0.9, 0] }}
                      transition={{ duration: 2.3, times: [0, 0.28, 0.45, 0.85, 1], ease: ["easeOut", "easeInOut", "easeIn", "easeIn"], repeat: Infinity, repeatDelay: 1.1, delay: 0.1 }}
                      style={{ transformBox: "fill-box", transformOrigin: "50% 18%" }}
                    >
                      <path d="M570 393 C560 409 562 423 573 429 C585 423 583 408 570 393 Z" fill="#9de8ff" opacity="0.9" />
                      <ellipse cx="570" cy="412" rx="3" ry="5.4" fill="#ffffff" opacity="0.5" transform="rotate(16 570 412)" />
                    </motion.g>
                  )}
                  {mood === "sad" && !reduce && (
                    <motion.g
                      initial={{ y: 0, scale: 0, opacity: 0 }}
                      animate={{ y: [0, 0, 2, 28, 38], scale: [0.2, 0.7, 0.86, 0.8, 0.7], opacity: [0, 0.9, 0.9, 0.85, 0] }}
                      transition={{ duration: 2.4, times: [0, 0.3, 0.48, 0.86, 1], ease: ["easeOut", "easeInOut", "easeIn", "easeIn"], repeat: Infinity, repeatDelay: 1.5, delay: 1.35 }}
                      style={{ transformBox: "fill-box", transformOrigin: "50% 18%" }}
                    >
                      <path d="M334 395 C325 409 327 421 336 426 C346 421 345 408 334 395 Z" fill="#9de8ff" opacity="0.85" />
                      <ellipse cx="335" cy="410" rx="2.6" ry="4.6" fill="#ffffff" opacity="0.45" transform="rotate(16 335 410)" />
                    </motion.g>
                  )}
                </motion.g>
              </motion.g>

              <motion.g id="happy-decor" style={centerMotionStyle}>
                {celebrate > 0 && !reduce && (
                  <g key={celebrate} transform="translate(450 168)">
                    {BURST_BITS.map((b, i) => (
                      <motion.g
                        key={i}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: b.r0 }}
                        animate={{ x: b.dx, y: b.dy, scale: [0, 1.2, 1, 0.85], opacity: [0, 1, 1, 0], rotate: b.r1 }}
                        transition={{ duration: 0.9, delay: b.d, times: [0, 0.3, 0.7, 1], ease: [0.16, 0.72, 0.28, 1] }}
                      >
                        {b.k === "star" ? (
                          <path d={BURST_STAR} fill="#ffe07a" transform={`scale(${b.s})`} />
                        ) : b.k === "heart" ? (
                          <path d={BURST_HEART} fill="var(--jelly-cheek, #ff8fc6)" transform={`scale(${b.s})`} />
                        ) : (
                          <circle r={5 * b.s} fill="#fff2a8" />
                        )}
                      </motion.g>
                    ))}
                  </g>
                )}
                <motion.path
                  id="happy-twinkle"
                  d="M636 302 C638 314 641 317 652 319 C641 321 638 324 636 336 C634 324 631 321 620 319 C631 317 634 314 636 302 Z"
                  fill="#ffe07a"
                  initial={false}
                  animate={
                    mood === "happy"
                      ? reduce
                        ? { opacity: 0.7, scale: 1 }
                        : { opacity: [0, 0.85, 0.35, 0.85], scale: [0.9, 1.08, 0.95, 1.08] }
                      : { opacity: 0, scale: 0.8 }
                  }
                  transition={mood === "happy" && !reduce ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.15 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </svg>
    </MotionConfig>
  );
}

export default JellyBlobMascot;
