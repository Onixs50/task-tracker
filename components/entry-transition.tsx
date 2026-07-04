"use client";

import { useEffect, useState } from "react";

const FLAG = "daily-ledger:entry-played";

export function EntryTransition() {
  const [stage, setStage] = useState<"hidden" | "layers" | "merged" | "flash" | "done">("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(FLAG)) {
      setStage("done");
      return;
    }
    sessionStorage.setItem(FLAG, "1");
    setStage("layers");
    const t1 = setTimeout(() => setStage("merged"), 500);
    const t2 = setTimeout(() => setStage("flash"), 900);
    const t3 = setTimeout(() => setStage("done"), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (stage === "done" || stage === "hidden") return null;

  const layers = [
    { d: "M60 20 L95 60 L60 100 L25 60 Z", offset: "-14px,-10px" },
    { d: "M60 20 L95 60 L60 100 L25 60 Z", offset: "14px,-6px" },
    { d: "M60 20 L95 60 L60 100 L25 60 Z", offset: "-8px,12px" },
    { d: "M60 20 L95 60 L60 100 L25 60 Z", offset: "10px,10px" },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05070c] transition-opacity duration-400"
      style={{ opacity: stage === "flash" ? 1 : 1 }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120">
        {layers.map((l, i) => (
          <path
            key={i}
            d={l.d}
            fill="none"
            stroke={i % 2 === 0 ? "rgb(var(--teal))" : "rgb(var(--gold))"}
            strokeWidth="1.5"
            opacity={stage === "layers" ? 0.55 : 1}
            style={{
              transform: stage === "layers" ? `translate(${l.offset.split(",")[0]}, ${l.offset.split(",")[1]})` : "translate(0,0)",
              transition: "transform 0.45s ease, opacity 0.45s ease",
            }}
          />
        ))}
      </svg>
      {stage === "flash" && (
        <div className="absolute inset-0 bg-white/10" style={{ animation: "fadeFlash 0.4s ease-out" }} />
      )}
    </div>
  );
}
