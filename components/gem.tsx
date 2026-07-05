"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Six facets forming a vertical gem/crystal silhouette (top point, waist, bottom point).
// Each facet is a simple polygon so it can be filled with its own gradient and animated independently.
export const GEM_FACETS = [
  { points: "100,20 140,80 100,100 60,80", grad: "gemA" }, // top-left
  { points: "100,20 100,100 140,80", grad: "gemB" }, // top-right (overlap for depth)
  { points: "60,80 100,100 100,180 70,120", grad: "gemC" }, // bottom-left
  { points: "140,80 100,100 100,180 130,120", grad: "gemD" }, // bottom-right
  { points: "60,80 100,20 140,80 100,40", grad: "gemE" }, // inner top highlight
  { points: "70,120 100,180 130,120 100,150", grad: "gemF" }, // inner bottom highlight
];

export function GemDefs() {
  return (
    <defs>
      <linearGradient id="gemA" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#bfe9ff" />
        <stop offset="100%" stopColor="rgb(var(--teal))" />
      </linearGradient>
      <linearGradient id="gemB" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8f7ff" />
        <stop offset="100%" stopColor="#5fb8e0" />
      </linearGradient>
      <linearGradient id="gemC" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgb(var(--teal))" />
        <stop offset="100%" stopColor="#1c6f8c" />
      </linearGradient>
      <linearGradient id="gemD" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8fd9e8" />
        <stop offset="100%" stopColor="#215a78" />
      </linearGradient>
      <linearGradient id="gemE" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#bfe9ff" />
      </linearGradient>
      <linearGradient id="gemF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bfe9ff" />
        <stop offset="100%" stopColor="rgb(var(--teal))" />
      </linearGradient>
      <filter id="gemGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="gemGlowImpact" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="14" result="blur1" />
        <feGaussianBlur stdDeviation="4" result="blur2" />
        <feMerge>
          <feMergeNode in="blur1" />
          <feMergeNode in="blur2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Small pulsing static gem — used in the preloader and as a compact brand mark. */
export function GemStatic({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="animate-logo-pulse">
      <GemDefs />
      <g filter="url(#gemGlow)">
        {GEM_FACETS.map((f, i) => (
          <polygon key={i} points={f.points} fill={`url(#${f.grad})`} opacity={0.92} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The full layered-facet assembly: each facet flies in from a scattered
 * offset and settles into the gem silhouette, staggered. Calls onComplete
 * once the whole sequence (assembly + flash) has finished.
 */
export function GemReveal({ size = 220, onComplete }: { size?: number; onComplete?: () => void }) {
  const [impact, setImpact] = useState(false);

  // Facets fly in from further out and with a bigger spin for a punchier assembly.
  const scatter = [
    { x: -140, y: -120, rotate: -110 },
    { x: 160, y: -100, rotate: 95 },
    { x: -180, y: 80, rotate: 130 },
    { x: 180, y: 120, rotate: -125 },
    { x: 0, y: -180, rotate: 60 },
    { x: 0, y: 180, rotate: -60 },
  ];

  function handleLastFacet() {
    setImpact(true);
    onComplete?.();
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Shockwave rings burst outward the instant the gem locks together */}
      <AnimatePresence>
        {impact && (
          <>
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={ring}
                className="pointer-events-none absolute rounded-full border-2 border-teal/60"
                style={{ width: size * 0.55, height: size * 0.55 }}
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 2.6 + ring * 0.5 }}
                transition={{ duration: 0.9, delay: ring * 0.1, ease: "easeOut" }}
              />
            ))}
            <motion.div
              className="pointer-events-none absolute rounded-full"
              style={{
                width: size * 1.6,
                height: size * 1.6,
                background:
                  "radial-gradient(circle, rgb(var(--teal) / 0.55) 0%, rgb(var(--teal) / 0.15) 70%, rgb(var(--teal) / 0) 100%)",
              }}
              initial={{ opacity: 0.9, scale: 0.3 }}
              animate={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </>
        )}
      </AnimatePresence>

      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="relative"
        animate={impact ? { scale: [1, 1.16, 0.96, 1.03, 1] } : {}}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <GemDefs />
        <g filter={impact ? "url(#gemGlowImpact)" : "url(#gemGlow)"}>
          {GEM_FACETS.map((f, i) => (
            <motion.polygon
              key={i}
              points={f.points}
              fill={`url(#${f.grad})`}
              initial={{ opacity: 0, scale: 0.3, x: scatter[i].x, y: scatter[i].y, rotate: scatter[i].rotate }}
              animate={{ opacity: 0.97, scale: 1, x: 0, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={i === GEM_FACETS.length - 1 ? handleLastFacet : undefined}
            />
          ))}
        </g>
      </motion.svg>

      {/* Full-screen white flash at the moment of impact */}
      <motion.div
        className="pointer-events-none fixed inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={impact ? { opacity: [0, 0.95, 0] } : { opacity: 0 }}
        transition={{ duration: 0.5, times: [0, 0.25, 1], ease: "easeOut" }}
      />
    </div>
  );
}
