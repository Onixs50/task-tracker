"use client";

const SHAPES = [
  { top: "8%", left: "6%", size: 46, delay: "0s", kind: "coin" },
  { top: "18%", left: "88%", size: 34, delay: "1.2s", kind: "coin" },
  { top: "70%", left: "10%", size: 30, delay: "2.1s", kind: "coin" },
  { top: "80%", left: "82%", size: 50, delay: "0.6s", kind: "coin" },
  { top: "40%", left: "3%", size: 60, delay: "1.6s", kind: "candles" },
  { top: "55%", left: "90%", size: 60, delay: "0.3s", kind: "candles" },
] as const;

function Coin({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgb(var(--gold))" strokeWidth="2" opacity="0.4" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="rgb(var(--gold))" strokeWidth="1.5" opacity="0.3" />
      <text x="20" y="25" textAnchor="middle" fontSize="14" fill="rgb(var(--gold))" opacity="0.4">₿</text>
    </svg>
  );
}

function Candles({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <line x1="8" y1="4" x2="8" y2="36" stroke="rgb(var(--teal))" strokeWidth="1" opacity="0.35" />
      <rect x="4" y="14" width="8" height="14" fill="rgb(var(--teal))" opacity="0.35" />
      <line x1="20" y1="8" x2="20" y2="32" stroke="rgb(var(--danger))" strokeWidth="1" opacity="0.3" />
      <rect x="16" y="12" width="8" height="10" fill="rgb(var(--danger))" opacity="0.3" />
      <line x1="32" y1="2" x2="32" y2="30" stroke="rgb(var(--gold))" strokeWidth="1" opacity="0.35" />
      <rect x="28" y="10" width="8" height="16" fill="rgb(var(--gold))" opacity="0.35" />
    </svg>
  );
}

export function LoginDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className="absolute animate-float-slow"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          {s.kind === "coin" ? <Coin size={s.size} /> : <Candles size={s.size} />}
        </div>
      ))}
    </div>
  );
}
