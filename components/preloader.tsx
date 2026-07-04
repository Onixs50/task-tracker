"use client";

import { useEffect, useState } from "react";

export function Preloader({ onDone }: { onDone?: () => void }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setHide(true);
      setTimeout(() => onDone?.(), 500);
    }, 1400);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05070c] transition-opacity duration-500 ${
        hide ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <svg width="96" height="96" viewBox="0 0 96 96" className="animate-logo-pulse">
        <circle cx="48" cy="48" r="40" fill="none" stroke="rgb(var(--teal))" strokeWidth="1.2" opacity="0.7" />
        <circle cx="48" cy="48" r="30" fill="none" stroke="rgb(var(--gold))" strokeWidth="1" opacity="0.5" />
        <path
          d="M48 26 L58 40 L48 70 L38 40 Z"
          fill="none"
          stroke="rgb(var(--teal))"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="48" cy="48" r="2.5" fill="rgb(var(--gold))" />
      </svg>
      <p className="mt-5 font-mono text-[11px] tracking-[0.3em] text-muted">AUTHENTICATING</p>
    </div>
  );
}
