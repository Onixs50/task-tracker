"use client";

import { useEffect, useState } from "react";
import { GemReveal } from "./gem";

const FLAG = "daily-ledger:entry-played";

export function EntryTransition() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, "1");
    setVisible(true);
  }, []);

  if (!visible) return null;

  function handleComplete() {
    setTimeout(() => setFading(true), 250);
    setTimeout(() => setVisible(false), 750);
  }

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-[#05070c] transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <GemReveal size={200} onComplete={handleComplete} />
    </div>
  );
}
