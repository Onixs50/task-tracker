"use client";

const COINS = [
  { symbol: "◆", angle: 0, color: "rgb(var(--teal))" },
  { symbol: "$", angle: 120, color: "rgb(var(--gold))" },
  { symbol: "T", angle: 240, color: "rgb(var(--danger))" },
];

export function LoginScene({ phase }: { phase: "idle" | "accelerating" | "collapsed" }) {
  const orbitDuration = phase === "accelerating" ? "0.5s" : "14s";

  return (
    <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48">
      {/* wallet */}
      <div
        className={`absolute left-1/2 top-1/2 h-16 w-20 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gold/40 bg-surface shadow-lg transition-transform duration-500 ${
          phase === "collapsed" ? "scale-90" : ""
        }`}
        style={{ perspective: 400 }}
      >
        <div className="absolute inset-x-2 top-2 h-1 rounded-full bg-gold/30" />
        <div
          className={`absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/50 transition-opacity duration-500 ${
            phase === "collapsed" ? "opacity-100 bg-teal/20" : "opacity-40"
          }`}
        />
      </div>

      {/* orbiting coins */}
      {!(phase === "collapsed") &&
        COINS.map((c, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-full w-full animate-orbit"
            style={{
              animationDuration: orbitDuration,
              transform: `rotate(${c.angle}deg)`,
              marginLeft: "-50%",
              marginTop: "-50%",
            }}
          >
            <div
              className={`absolute left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border bg-surface font-mono text-xs font-semibold shadow-md animate-orbit-reverse ${
                phase === "accelerating" ? "opacity-70" : ""
              }`}
              style={{
                borderColor: c.color,
                color: c.color,
                animationDuration: orbitDuration,
                transitionDuration: "500ms",
              }}
            >
              {c.symbol}
            </div>
          </div>
        ))}
    </div>
  );
}
