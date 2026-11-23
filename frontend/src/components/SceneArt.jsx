import { cn } from "../lib/utils";

const PALETTES = {
  alley: {
    sky: ["#0b1220", "#1b2436"],
    mid: "#141b2b",
    far: "#1e293b",
    near: "#0a0e18",
    glow: "#fcd34d",
  },
  warehouse: {
    sky: ["#0c1414", "#152322"],
    mid: "#152420",
    far: "#1c332d",
    near: "#080f0e",
    glow: "#fde68a",
  },
  room: {
    sky: ["#160f14", "#241722"],
    mid: "#241822",
    far: "#33202c",
    near: "#100a0e",
    glow: "#fbbf24",
  },
  garage: {
    sky: ["#0a1018", "#131d2c"],
    mid: "#121a27",
    far: "#1b2637",
    near: "#070b12",
    glow: "#bae6fd",
  },
};

export default function SceneArt({ variant = "alley", className = "" }) {
  const p = PALETTES[variant] || PALETTES.alley;
  const gid = `sky-${variant}`;
  const glowId = `glow-${variant}`;
  const vigId = `vig-${variant}`;

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={`Stylized forensic ${variant} frame`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} />
          <stop offset="100%" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="60%" stopColor={p.glow} stopOpacity="0.12" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={vigId} cx="0.5" cy="0.45" r="0.75">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.62" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${gid})`} />

      {variant === "alley" && (
        <>
          <rect x="0" y="0" width="132" height="300" fill={p.far} />
          <rect x="268" y="0" width="132" height="300" fill={p.mid} />
          <path d="M132 0 L152 300 L248 300 L268 0 Z" fill={p.near} opacity="0.55" />
          {[34, 70, 106, 142].map((y, i) => (
            <g key={y}>
              <rect x="22" y={y} width="26" height="18" fill="#0a0f1a" />
              <rect x="22" y={y} width="26" height="18" fill={p.glow} opacity={i === 2 ? 0.28 : 0.08} />
              <rect x="300" y={y + 10} width="24" height="16" fill="#0a0f1a" />
              <rect x="300" y={y + 10} width="24" height="16" fill={p.glow} opacity={i === 1 ? 0.22 : 0.07} />
            </g>
          ))}
          <ellipse cx="200" cy="60" rx="120" ry="90" fill={`url(#${glowId})`} />
          <rect x="190" y="0" width="4" height="72" fill="#0d1420" />
          <ellipse cx="192" cy="74" rx="10" ry="6" fill={p.glow} opacity="0.85" />
          <path d="M192 80 L150 300 L250 300 Z" fill={p.glow} opacity="0.06" />
          <ellipse cx="200" cy="258" rx="86" ry="18" fill="#05080e" opacity="0.85" />
          <ellipse cx="200" cy="256" rx="52" ry="9" fill={p.glow} opacity="0.12" />
          <rect x="58" y="228" width="34" height="52" rx="3" fill="#0b111c" />
          <rect x="58" y="224" width="34" height="7" rx="2" fill="#1c283a" />
        </>
      )}

      {variant === "warehouse" && (
        <>
          <rect x="0" y="0" width="400" height="300" fill={p.sky[0]} />
          <rect x="0" y="150" width="400" height="150" fill={p.near} />
          <path d="M0 150 L400 150 L400 142 L0 142 Z" fill={p.far} />
          <circle cx="120" cy="30" r="70" fill={`url(#${glowId})`} />
          <circle cx="300" cy="22" r="80" fill={`url(#${glowId})`} opacity="0.7" />
          <rect x="36" y="214" width="88" height="62" rx="3" fill="#0d1614" />
          <rect x="150" y="236" width="66" height="40" rx="2" fill="#101a17" />
          <rect x="300" y="196" width="74" height="80" rx="3" fill="#0c1513" />
        </>
      )}

      {variant === "room" && (
        <>
          <rect x="0" y="0" width="400" height="300" fill={p.sky[0]} />
          <rect x="0" y="0" width="400" height="300" fill={p.mid} opacity="0.5" />
          <rect x="238" y="34" width="118" height="126" fill="#0b070c" />
          <rect x="246" y="42" width="102" height="110" fill={p.glow} opacity="0.22" />
          <rect x="40" y="188" width="150" height="58" rx="12" fill="#170f16" />
          <rect x="52" y="172" width="126" height="26" rx="9" fill="#22151f" />
        </>
      )}

      {variant === "garage" && (
        <>
          <rect x="0" y="0" width="400" height="300" fill={p.sky[0]} />
          <rect x="0" y="96" width="400" height="204" fill={p.near} />
          <rect x="142" y="8" width="120" height="150" fill={`url(#${glowId})`} opacity="0.5" />
          <circle cx="146" cy="232" r="15" fill="#05080d" />
          <circle cx="260" cy="232" r="15" fill="#05080d" />
        </>
      )}

      <rect width="400" height="300" fill={`url(#${vigId})`} />
      <g opacity="0.4" stroke="#ffffff" strokeWidth="1">
        <path d="M14 14 L14 32 M14 14 L32 14" />
        <path d="M386 14 L386 32 M386 14 L368 14" />
        <path d="M14 286 L14 268 M14 286 L32 286" />
        <path d="M386 286 L386 268 M386 286 L368 286" />
      </g>
    </svg>
  );
}
