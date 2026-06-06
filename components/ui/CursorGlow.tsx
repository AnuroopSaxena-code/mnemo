"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE_TAGS = new Set(["button", "a", "input", "select", "textarea", "label"]);
const INTERACTIVE_CLASSES = ["cursor-pointer", "btn-press", "card-hover", "sidebar-card-hover", "panel-tab"];

function isInteractive(target: HTMLElement | null): boolean {
  let el = target;
  while (el && el.tagName !== "BODY") {
    const tag = el.tagName.toLowerCase();
    if (INTERACTIVE_TAGS.has(tag)) return true;
    if (el.getAttribute("role") === "button") return true;
    if (INTERACTIVE_CLASSES.some((cls) => el!.classList.contains(cls))) return true;
    // Walk up and check computed cursor
    try {
      if (window.getComputedStyle(el).cursor === "pointer") return true;
    } catch {
      // ignore
    }
    el = el.parentElement;
  }
  return false;
}

export function CursorGlow() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  // Springy follow for the cursor indicator
  const springConfig = { stiffness: 600, damping: 40, mass: 0.08 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);

  // Slower follow for ambient glow
  const glowX = useSpring(rawX, { stiffness: 80, damping: 20, mass: 1 });
  const glowY = useSpring(rawY, { stiffness: 80, damping: 20, mass: 1 });

  const hasFinePointerRef = useRef(true);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine)");
    hasFinePointerRef.current = pointerQuery.matches;
    if (!pointerQuery.matches) return; // Touch-only device — skip everything

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener("change", onMotionChange);

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      setIsHovering(isInteractive(e.target as HTMLElement));
    };

    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      motionQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shapeVariants = {
    default: {
      width: 10,
      height: 10,
      borderRadius: "0%",
      rotate: 45,
      backgroundColor: "var(--color-accent)",
      borderWidth: 0,
      borderColor: "transparent",
      opacity: 1,
    },
    hover: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      rotate: 0,
      backgroundColor: "rgba(0,0,0,0)",
      borderWidth: 1.5,
      borderColor: "var(--color-accent)",
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  };

  const shapeTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 350, damping: 28 };

  return (
    <>
      {/* Ambient background glow — fixed, behind everything */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
            x: glowX,
            y: glowY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      </motion.div>

      {/* Custom cursor dot — always rendered, visibility controlled via opacity */}
      <motion.div
        aria-hidden="true"
        animate={
          !isVisible
            ? "hidden"
            : isHovering
            ? "hover"
            : "default"
        }
        variants={shapeVariants}
        transition={shapeTransition}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9999,
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          borderStyle: "solid",
          willChange: "transform, width, height, border-radius",
        }}
      />
    </>
  );
}
