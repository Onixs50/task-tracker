"use client";

import { useEffect, useState } from "react";
import { GemStatic } from "./gem";

export function Preloader({ onDone }: { onDone?: () => void }) {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setHide(true);
      setTimeout(() => onDone?.(), 500);
    }, 1300);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05070c] transition-opacity duration-500 ${
        hide ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <GemStatic size={80} />
      <p className="mt-5 font-mono text-[11px] tracking-[0.3em] text-muted">AUTHENTICATING</p>
    </div>
  );
}
