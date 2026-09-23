import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { cn } from "../../../lib/utils";

const HINGE = "3px 6px";
const LID_OPEN = -35;
const WALL_TOP = 6;
const WALL_TOP_OPEN = 13.5;
const WALL_BASE = 20;

const TILE = 42;
const PANEL = 80;
const HOLD = { deleted: 1400, kept: 600 };

const EASE = [0.32, 0.72, 0, 1];
const EASE_LID = [0.34, 1.1, 0.64, 1];

const WIDTH = { duration: 0.62, ease: EASE };
const LID = { duration: 0.6, ease: EASE_LID };
const WALL = { duration: 0.56, ease: EASE };
const IN = { duration: 0.44, ease: EASE, delay: 0.14 };
const OUT = { duration: 0.3, ease: EASE };
const TAP = { duration: 0.2, ease: EASE };
const SWAP = { duration: 0.22, ease: EASE };
const SETTLE = { duration: 0.45, ease: EASE };
const PRESS = {
  type: "spring",
  stiffness: 520,
  damping: 18,
  mass: 0.5,
};
const INSTANT = { duration: 0 };

const SURFACE = "bg-zinc-100 dark:bg-[#1a1b1e]";
const RECESS = "bg-zinc-200 dark:bg-[#141517]";
const GLYPH = "text-zinc-500 dark:text-zinc-400";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-red-400";
const ACCENT = "#ef4444"; // red-500

const LIFT =
  "shadow-xs border border-zinc-200/80 dark:border-white/10";

const CIRCLE = `grid h-7 w-7 place-items-center rounded-full transition-colors duration-200 hover:bg-white dark:hover:bg-[#25262b] cursor-pointer ${FOCUS} ${SURFACE} ${LIFT}`;

const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const panelMotion = {
  hidden: { opacity: 0, x: -6, transition: OUT },
  shown: { opacity: 1, x: 0, transition: { ...IN, staggerChildren: 0.07 } },
};

const circleMotion = {
  hidden: { opacity: 0, scale: 0.9, transition: OUT },
  shown: { opacity: 1, scale: 1, transition: IN },
};

function Circle({ label, onClick, children }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div className="flex" variants={reduced ? undefined : circleMotion}>
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        whileHover={reduced ? undefined : { scale: 1.05 }}
        whileTap={reduced ? undefined : { scale: 0.88 }}
        transition={PRESS}
        className={CIRCLE}
      >
        <svg
          {...ICON}
          width="13"
          height="13"
          stroke="currentColor"
          strokeWidth="3"
        >
          {children}
        </svg>
      </motion.button>
    </motion.div>
  );
}

export function DeleteButton({ className, onConfirm, onCancel, ...props }) {
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const trigger = useRef(null);
  const timing = (transition) => (reduced ? INSTANT : transition);

  const top = useMotionValue(WALL_TOP);
  const wall = useTransform(top, (y) => WALL_BASE - y);
  const bin = useMotionTemplate`M19 ${top}v${wall}a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V${top}`;
  const settle = useMotionValue(1);

  useEffect(() => {
    const walls = animate(
      top,
      open ? WALL_TOP_OPEN : WALL_TOP,
      reduced ? INSTANT : WALL,
    );
    return () => walls.stop();
  }, [open, reduced, top]);

  useEffect(() => {
    if (status === "idle") return;
    const nudge =
      status === "kept" && !reduced
        ? animate(settle, [1, 0.86, 1], SETTLE)
        : null;
    const done = setTimeout(() => setStatus("idle"), HOLD[status]);
    return () => {
      nudge?.stop();
      clearTimeout(done);
    };
  }, [status, reduced, settle]);

  const resolve = (next) => {
    setOpen(false);
    setStatus(next);
    trigger.current?.focus();
    (next === "deleted" ? onConfirm : onCancel)?.();
  };

  return (
    <motion.div
      data-slot="delete-button"
      data-state={open ? "open" : "closed"}
      data-status={status}
      className={cn("relative h-10 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-white/10", SURFACE, GLYPH, className)}
      animate={{ width: open ? TILE + PANEL : TILE }}
      transition={timing(WIDTH)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) resolve("kept");
      }}
      {...props}
    >
      <motion.button
        ref={trigger}
        type="button"
        aria-label="Delete"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          if (open) return resolve("kept");
          setStatus("idle");
          setOpen(true);
        }}
        whileTap={reduced ? undefined : { scale: 0.94 }}
        transition={TAP}
        className={cn(
          "relative z-10 grid h-10 w-10 place-items-center rounded-xl cursor-pointer hover:text-red-500 transition-colors",
          FOCUS,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === "deleted" ? (
            <motion.svg
              key="done"
              {...ICON}
              width="18"
              height="18"
              stroke={ACCENT}
              strokeWidth="2.5"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={timing(SWAP)}
            >
              <motion.path
                d="M4 12.5 9.5 18 20 7"
                initial={reduced ? undefined : { pathLength: 0 }}
                animate={reduced ? undefined : { pathLength: 1 }}
                transition={SETTLE}
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="bin"
              {...ICON}
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              className="overflow-visible"
              style={{ scale: settle }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={timing(SWAP)}
            >
              <motion.path d={bin} />
              <motion.g
                style={{ transformBox: "view-box", transformOrigin: HINGE }}
                animate={{ rotate: open ? LID_OPEN : 0 }}
                transition={timing(LID)}
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </motion.g>
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      <span role="status" aria-live="polite" className="sr-only">
        {status === "deleted" ? "Deleted" : status === "kept" ? "Kept" : ""}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            style={{ width: PANEL }}
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-center gap-2 rounded-xl px-1",
              RECESS,
            )}
            variants={reduced ? undefined : panelMotion}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <Circle label="Confirm delete" onClick={() => resolve("deleted")}>
              <path d="M4 12.5 9.5 18 20 7" stroke={ACCENT} />
            </Circle>
            <Circle label="Cancel" onClick={() => resolve("kept")}>
              <path d="M6 6 18 18M18 6 6 18" />
            </Circle>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DeleteButton;
