"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "daily-ledger:clock-position";
const SIZE = 84;
const DRAG_THRESHOLD = 6;

export function MiniClock({ timezone }: { timezone: string }) {
  const t = useTranslations("clock");
  const [mode, setMode] = useState<"analog" | "digital">("analog");
  const [now, setNow] = useState<Date | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(
    null
  );

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try {
        setPos(JSON.parse(saved));
        return;
      } catch {
        // fall through to default
      }
    }
    setPos({ x: window.innerWidth - SIZE - 24, y: window.innerHeight - SIZE - 96 });
  }, []);

  function clamp(x: number, y: number) {
    const maxX = window.innerWidth - SIZE - 8;
    const maxY = window.innerHeight - SIZE - 8;
    return { x: Math.min(Math.max(8, x), Math.max(8, maxX)), y: Math.min(Math.max(8, y), Math.max(8, maxY)) };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!pos) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !pos) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      const next = clamp(dragRef.current.origX + dx, dragRef.current.origY + dy);
      setPos(next);
    }
  }

  function onPointerUp() {
    if (!dragRef.current) return;
    const moved = dragRef.current.moved;
    if (moved && pos) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } else {
      setMode((m) => (m === "analog" ? "digital" : "analog"));
    }
    dragRef.current = null;
  }

  if (!now || !pos) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")!.value);
  const m = Number(parts.find((p) => p.type === "minute")!.value);
  const s = Number(parts.find((p) => p.type === "second")!.value);

  const hourDeg = (h % 12) * 30 + m * 0.5;
  const minDeg = m * 6;
  const secDeg = s * 6;

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={mode === "analog" ? t("digital") : t("analog")}
      className="group fixed z-40 flex touch-none items-center justify-center rounded-full border border-border bg-surface shadow-lg transition hover:border-gold/60 active:cursor-grabbing"
      style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE, cursor: "grab" }}
    >
      {mode === "analog" ? (
        <svg viewBox="0 0 100 100" className="h-16 w-16">
          <circle cx="50" cy="50" r="47" fill="none" stroke="rgb(var(--border))" strokeWidth="2" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="6"
              x2="50"
              y2="12"
              stroke="rgb(var(--muted))"
              strokeWidth="2"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <line x1="50" y1="50" x2="50" y2="27" stroke="rgb(var(--ink))" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hourDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="18" stroke="rgb(var(--ink))" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="14" stroke="rgb(var(--gold))" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          <circle cx="50" cy="50" r="3" fill="rgb(var(--gold))" />
        </svg>
      ) : (
        <span className="font-mono text-sm tabular text-ink">
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
          <br />
          <span className="text-[10px] text-muted">{String(s).padStart(2, "0")}s</span>
        </span>
      )}
    </button>
  );
}
