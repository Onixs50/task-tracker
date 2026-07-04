"use client";

import { motion } from "framer-motion";

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
  const scatter = [
    { x: -70, y: -60, rotate: -40 },
    { x: 80, y: -50, rotate: 35 },
    { x: -90, y: 40, rotate: 50 },
    { x: 90, y: 60, rotate: -45 },
    { x: 0, y: -90, rotate: 20 },
    { x: 0, y: 90, rotate: -20 },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200">
        <GemDefs />
        <g filter="url(#gemGlow)">
          {GEM_FACETS.map((f, i) => (
            <motion.polygon
              key={i}
              points={f.points}
              fill={`url(#${f.grad})`}
              initial={{ opacity: 0, scale: 0.4, x: scatter[i].x, y: scatter[i].y, rotate: scatter[i].rotate }}
              animate={{ opacity: 0.95, scale: 1, x: 0, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.09, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={i === GEM_FACETS.length - 1 ? onComplete : undefined}
            />
          ))}
        </g>
      </svg>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.9, 0] }}
        transition={{ duration: 1.1, times: [0, 0.72, 0.8, 1], delay: 0 }}
      />
    </div>
  );
}
