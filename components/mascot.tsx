"use client";

import type { ReactNode } from "react";

export function Mascot({
  message,
  size = "md",
}: {
  message?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: 64, md: 88, lg: 120 }[size];

  return (
    <div className="flex items-end gap-3">
      <div className="animate-mascot-bob" style={{ width: dims, height: dims }}>
        <svg viewBox="0 0 120 120" width={dims} height={dims}>
          {/* twin-tail hair, back layer */}
          <path d="M20 55 Q4 70 14 100 Q22 88 28 72 Z" fill="rgb(var(--gold))" />
          <path d="M100 55 Q116 70 106 100 Q98 88 92 72 Z" fill="rgb(var(--gold))" />

          {/* head */}
          <circle cx="60" cy="58" r="34" fill="#FFDCC4" />

          {/* hair, front layer */}
          <path
            d="M26 50 Q30 16 60 16 Q90 16 94 50 Q80 34 60 34 Q40 34 26 50 Z"
            fill="rgb(var(--gold))"
          />
          <path d="M26 48 Q22 40 30 34 Q26 44 32 50 Z" fill="rgb(var(--gold))" />
          <path d="M94 48 Q98 40 90 34 Q94 44 88 50 Z" fill="rgb(var(--gold))" />

          {/* blush */}
          <ellipse cx="42" cy="66" rx="5" ry="3" fill="#FF9E9E" opacity="0.7" />
          <ellipse cx="78" cy="66" rx="5" ry="3" fill="#FF9E9E" opacity="0.7" />

          {/* eyes */}
          <g className="origin-center animate-mascot-blink" style={{ transformOrigin: "48px 58px" }}>
            <ellipse cx="48" cy="58" rx="5" ry="7" fill="#2B2B33" />
            <circle cx="49.5" cy="55" r="1.6" fill="#fff" />
          </g>
          <g className="origin-center animate-mascot-blink" style={{ transformOrigin: "72px 58px" }}>
            <ellipse cx="72" cy="58" rx="5" ry="7" fill="#2B2B33" />
            <circle cx="73.5" cy="55" r="1.6" fill="#fff" />
          </g>

          {/* mouth */}
          <path d="M55 74 Q60 78 65 74" stroke="#B5654B" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* body */}
          <path d="M38 92 Q60 82 82 92 L86 116 L34 116 Z" fill="rgb(var(--teal))" />

          {/* waving arm */}
          <g style={{ transformOrigin: "88px 92px" }} className="animate-mascot-wave">
            <path d="M88 92 Q102 84 100 70" stroke="#FFDCC4" strokeWidth="7" fill="none" strokeLinecap="round" />
            <circle cx="100" cy="70" r="5.5" fill="#FFDCC4" />
          </g>
        </svg>
      </div>

      {message && (
        <div className="relative mb-3 max-w-[220px] animate-fade-up rounded-2xl rounded-bl-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm">
          {message}
        </div>
      )}
    </div>
  );
}
