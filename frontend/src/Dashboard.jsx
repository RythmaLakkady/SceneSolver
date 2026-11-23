import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ScanLine,
  Eye,
  Layers,
  Sparkles,
  LockKeyhole,
  Cpu,
  Shield,
  FileText,
  Binary,
  ArrowDownRight,
  FolderArchive,
} from "lucide-react";
import ScrambleText from "./components/ScrambleText";
import SceneArt from "./components/SceneArt";
import { cn } from "./lib/utils";

const ATTENTION_POINTS = [
  { x: 30, y: 62, size: 85, opacity: 0.5 },
  { x: 52, y: 46, size: 70, opacity: 0.4 },
  { x: 68, y: 72, size: 105, opacity: 0.35 },
  { x: 42, y: 82, size: 60, opacity: 0.3 },
];

const LOG_MESSAGES = [
  "Normalizing frame: 384×384 · SHA-256 logged",
  "CLIP zero-shot projection: 512-d embedding space",
  "ViT-B/16: 197 patch tokens computed across 12 heads",
  "Calibrating class confidence against crime taxonomy",
  "Generating evidence-weighted forensic scene summary",
];

const STATS = [
  { value: "512-d", label: "CLIP Vision-Text", icon: Layers },
  { value: "197", label: "ViT Patch Tokens", icon: ScanLine },
  { value: "6+", label: "Crime Taxonomies", icon: Shield },
];

const PIPELINE_STAGES = [
  {
    id: "ingest",
    label: "01 Frame Ingest",
    desc: "EXIF metadata scrubbing, 384×384 normalization, and sha-256 chain-of-custody fingerprint.",
    metric: "≤ 15 ms",
    icon: Binary,
  },
  {
    id: "clip",
    label: "02 CLIP Embedding",
    desc: "Projects frame into multimodal 512-d space to compare against open-vocabulary crime descriptors zero-shot.",
    metric: "512-d",
    icon: Layers,
  },
  {
    id: "vit",
    label: "03 ViT Attention",
    desc: "Vision Transformer divides frame into 197 spatial tokens and attends across 12 heads to isolate physical evidence.",
    metric: "197 tokens",
    icon: ScanLine,
  },
  {
    id: "fuse",
    label: "04 Fusion & Classify",
    desc: "Synthesizes token attention weights and cosine similarities to produce calibrated crime classification.",
    metric: "6 classes",
    icon: Cpu,
  },
  {
    id: "narrative",
    label: "05 Scene Dossier",
    desc: "Generates structured narrative summary prioritizing observed physical anomalies and investigative leads.",
    metric: "Instant",
    icon: FileText,
  },
];

function EvidenceCard() {
  const [revealed, setRevealed] = useState(true);
  const [attention, setAttention] = useState(false);
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLogIndex((i) => (i + 1) % LOG_MESSAGES.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgba(251,191,36,0.12),transparent)] blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c12] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            <span className="size-2 rounded-full bg-rose-400" />
            Active Evidence / 0142
          </div>
          <button
            onClick={() => setAttention((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors",
              attention
                ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-300"
                : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"
            )}
          >
            <ScanLine className="size-3" />
            ViT map: {attention ? "ON" : "OFF"}
          </button>
        </div>

        {/* Viewport Frame */}
        <div className="relative aspect-[4/3] overflow-hidden bg-black/60">
          <SceneArt
            variant="alley"
            className="transition-transform duration-700 hover:scale-[1.03]"
          />
          <div className="scanlines pointer-events-none absolute inset-0 opacity-45" />

          {attention && (
            <div className="pointer-events-none absolute inset-0 animate-flicker">
              {ATTENTION_POINTS.map((point, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: point.size,
                    height: point.size,
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, rgba(34,211,238,${point.opacity}), rgba(34,211,238,0.05) 55%, transparent 75%)`,
                    filter: "blur(6px)",
                  }}
                />
              ))}
              <div className="absolute left-3 top-3 rounded border border-cyan-400/30 bg-[#05070c]/85 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300 backdrop-blur">
                ViT attention · 197 tokens
              </div>
            </div>
          )}

          {/* Sweeping scan beam */}
          <div className="pointer-events-none absolute inset-x-0 h-24 animate-scan bg-gradient-to-b from-transparent via-amber-300/15 to-transparent">
            <div className="absolute inset-x-0 top-1/2 h-px bg-amber-300/60 shadow-[0_0_16px_2px_rgba(251,191,36,0.5)]" />
          </div>

          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
            LIVE TELEMETRY
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-white/15 bg-black/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/75 backdrop-blur">
            District 7 · Rear Breach
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[9px] tracking-[0.16em] text-white/50">
            384 × 384
          </div>
        </div>

        {/* Card Body */}
        <div className="space-y-4 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                Primary Classification
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-amber-300">
                {revealed ? (
                  <ScrambleText text="Burglary / Forced Entry" />
                ) : (
                  "••••••••••••••••"
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                Confidence
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-white/90">
                {revealed ? "94.6%" : "—.—%"}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/[0.07]" />

          {/* Dynamic Telemetry Log */}
          <div className="min-h-[22px] font-mono text-[10px] leading-relaxed text-white/50">
            <p className="truncate text-amber-200/90">
              <span className="text-amber-400">›</span> {LOG_MESSAGES[logIndex]}
            </p>
          </div>

          <button
            onClick={() => setRevealed((v) => !v)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-amber-400/40 hover:bg-white/[0.06] hover:text-white"
          >
            {revealed ? (
              <>
                <Eye className="size-3.5 text-amber-300" /> Classification Revealed
              </>
            ) : (
              <>
                <LockKeyhole className="size-3.5" /> Declassify Inference
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-20">
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-36 size-[500px] rounded-full bg-amber-500/10 blur-[130px]"
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
              <Sparkles className="size-3" />
              CLIP × ViT Forensic Engine
              <span className="ml-1 rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] text-amber-200">
                v2.4
              </span>
            </div>

            <h1 className="reveal reveal-1 mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
              The scene is
              <br />
              the <span className="text-amber-300 text-glow-amber">witness.</span>
            </h1>

            <p className="reveal reveal-2 mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
              SceneSolver analyzes what the eye misses. Upload crime scene images
              or video and let our dual-model architecture classify crime types,
              isolate key physical evidence, and draft structured investigative reports.
            </p>

            <div className="reveal reveal-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => navigate("/upload")}
                className="group flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#08080c] shadow-[0_0_36px_-8px_rgba(251,191,36,0.7)] transition-all hover:bg-amber-300 hover:scale-[1.02]"
              >
                Analyze Crime Scene Now
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate("/about")}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
              >
                <Cpu className="size-4 text-cyan-300" />
                Learn More
              </button>
            </div>

            <div className="reveal reveal-4 mt-12 grid max-w-lg grid-cols-3 divide-x divide-white/[0.08] border-y border-white/[0.08]">
              {STATS.map((stat) => (
                <div key={stat.label} className="px-3 py-4 first:pl-0 sm:px-4">
                  <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/40">
                    <stat.icon className="size-3 text-amber-300/80" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-bold text-white/90">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal reveal-2">
            <EvidenceCard />
            <div className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              <ArrowDownRight className="size-3" />
              Toggle the ViT attention map to inspect salience
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Ticker */}
      <div className="relative overflow-hidden border-y border-white/[0.07] bg-white/[0.015] py-3">
        <div className="flex w-max animate-ticker items-center gap-8 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center gap-8">
              {[
                "Zero-shot crime classification",
                "ViT-B/16 visual attention maps",
                "512-d CLIP vision embeddings",
                "Automated Gemini scene summaries",
                "Chain-of-custody PDF export",
                "197 spatial patch tokens",
              ].map((item) => (
                <span key={`${dup}-${item}`} className="flex items-center gap-8">
                  <span className="size-1.5 rounded-full bg-amber-400/70" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Core Features Matrix */}
      <section className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/70">
            Forensic Intelligence
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Key Investigation Features
          </h2>
          <p className="mt-3 text-sm text-white/50 sm:text-base">
            Engineered to process physical evidence with state-of-the-art computer vision models.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Crime Type Classification",
              desc: "Employs OpenAI's CLIP model to compute cosine similarity against forensic taxonomies zero-shot across 512-dimensional embedding space.",
              icon: Shield,
              badge: "CLIP Zero-Shot",
              border: "border-amber-400/20 hover:border-amber-400/40",
            },
            {
              title: "Evidence Extraction",
              desc: "Vision Transformer (ViT-B/16) decomposes the scene into 197 patch tokens, attending across multi-head self-attention to isolate physical evidence.",
              icon: ScanLine,
              badge: "ViT-B/16 Attention",
              border: "border-cyan-400/20 hover:border-cyan-400/40",
            },
            {
              title: "Scene Summaries & Reports",
              desc: "Generates structured narrative reports detailing incident dynamics, evidence confidence, investigative leads, and downloadable PDF dossiers.",
              icon: FileText,
              badge: "Multimodal Gemini",
              border: "border-rose-400/20 hover:border-rose-400/40",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-[#0b0c12] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                feature.border
              )}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-amber-300">
                  <feature.icon className="size-5" />
                </span>
                <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50">
                  {feature.badge}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Forensic Pipeline Steps */}
      <section className="relative border-t border-white/[0.06] bg-[#07070b] py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70">
              The Architecture
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From Raw Frame to Verified Dossier
            </h2>
            <p className="mt-3 text-sm text-white/50 sm:text-base">
              Explore the five-stage pipeline executed on every uploaded scene image and video frame.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-5">
            {PIPELINE_STAGES.map((stage, index) => {
              const isSelected = activeStep === index;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    "flex flex-col rounded-xl border p-5 text-left transition-all",
                    isSelected
                      ? "border-amber-400/40 bg-amber-400/[0.06] shadow-lg"
                      : "border-white/[0.07] bg-[#0b0c12] hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded border border-white/10 bg-white/[0.04] text-white/80">
                      <stage.icon className="size-4" />
                    </span>
                    <span className="font-mono text-[9px] text-amber-300/80">
                      {stage.metric}
                    </span>
                  </div>
                  <h4 className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    {stage.label}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    {stage.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[#0b0c12] p-8 sm:flex-row sm:p-10">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Ready to analyze active evidence?
              </h3>
              <p className="mt-1 text-sm text-white/50">
                Upload images or video frames directly to start automated inference.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/upload")}
                className="flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#08080c] hover:bg-amber-300"
              >
                Open Intake
                <ArrowRight className="size-4" />
              </button>
              <button
                onClick={() => navigate("/user")}
                className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80 hover:bg-white/[0.07] hover:text-white"
              >
                <FolderArchive className="size-4 text-cyan-300" />
                Case Archive
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
