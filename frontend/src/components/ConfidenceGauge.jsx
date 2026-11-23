import { useState, useEffect } from "react";

export default function ConfidenceGauge({
  confidence = 0,
  strokeClass = "stroke-amber-400",
  size = 128,
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const [drawn, setDrawn] = useState(false);

  // Normalize confidence (handles 0-1 float or 0-100 percentage)
  const normConfidence =
    confidence > 1 ? Math.min(1, confidence / 100) : Math.max(0, confidence);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg viewBox="0 0 128 128" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="7"
          className="stroke-white/10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={drawn ? circumference * (1 - normConfidence) : circumference}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
          className={strokeClass}
        />
      </svg>
      <div className="text-center z-10">
        <p className="font-mono text-2xl font-bold leading-none text-white">
          {(normConfidence * 100).toFixed(1)}
          <span className="text-sm font-normal text-white/50">%</span>
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
          confidence
        </p>
      </div>
    </div>
  );
}
