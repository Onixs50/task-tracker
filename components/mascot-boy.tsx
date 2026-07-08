"use client";

import type { ReactNode } from "react";

export function MascotBoy({
  message,
  size = "md",
}: {
  message?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: 64, md: 88, lg: 120 }[size];

  return (
    <div className="flex w-full items-start gap-3">
      <div className="shrink-0 animate-mascot-bob" style={{ width: dims, height: dims }}>
        <svg viewBox="0 0 120 120" width={dims} height={dims}>
          {/* ears */}
          <circle cx="26" cy="60" r="6" fill="#FFDCC4" />
          <circle cx="94" cy="60" r="6" fill="#FFDCC4" />

          {/* head */}
          <circle cx="60" cy="58" r="34" fill="#FFDCC4" />

          {/* short, side-swept hair */}
          <path
            d="M25 52 Q24 18 60 16 Q96 18 95 52 Q88 30 60 28 Q32 30 25 52 Z"
            fill="rgb(var(--teal))"
          />
          <path d="M25 50 Q30 40 38 36 Q28 42 27 54 Z" fill="rgb(var(--teal))" />
          <path d="M95 50 Q90 40 82 36 Q92 42 93 54 Z" fill="rgb(var(--teal))" />

          {/* glasses — a friendly "management" touch */}
          <g stroke="rgb(var(--gold))" strokeWidth="2.5" fill="none">
            <rect x="38" y="52" width="18" height="14" rx="5" />
            <rect x="64" y="52" width="18" height="14" rx="5" />
            <line x1="56" y1="58" x2="64" y2="58" />
          </g>

          {/* blush */}
          <ellipse cx="42" cy="70" rx="4.5" ry="2.6" fill="#FF9E9E" opacity="0.6" />
          <ellipse cx="78" cy="70" rx="4.5" ry="2.6" fill="#FF9E9E" opacity="0.6" />

          {/* eyes */}
          <g className="origin-center animate-mascot-blink" style={{ transformOrigin: "47px 59px" }}>
            <ellipse cx="47" cy="59" rx="4.2" ry="6" fill="#2B2B33" />
            <circle cx="48.4" cy="56.5" r="1.4" fill="#fff" />
          </g>
          <g className="origin-center animate-mascot-blink" style={{ transformOrigin: "73px 59px" }}>
            <ellipse cx="73" cy="59" rx="4.2" ry="6" fill="#2B2B33" />
            <circle cx="74.4" cy="56.5" r="1.4" fill="#fff" />
          </g>

          {/* confident smile */}
          <path d="M53 76 Q60 81 67 76" stroke="#B5654B" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* collared shirt body */}
          <path d="M36 92 Q60 81 84 92 L88 116 L32 116 Z" fill="rgb(var(--gold))" />
          <path d="M52 91 L60 100 L68 91 L60 96 Z" fill="rgb(var(--bg))" />

          {/* waving arm */}
          <g style={{ transformOrigin: "88px 92px" }} className="animate-mascot-wave">
            <path d="M88 92 Q102 84 100 70" stroke="#FFDCC4" strokeWidth="7" fill="none" strokeLinecap="round" />
            <circle cx="100" cy="70" r="5.5" fill="#FFDCC4" />
          </g>
        </svg>
      </div>

      {message && (
        <div className="min-w-0 flex-1 animate-fade-up pt-1 text-sm leading-relaxed text-ink">{message}</div>
      )}
    </div>
  );
}
