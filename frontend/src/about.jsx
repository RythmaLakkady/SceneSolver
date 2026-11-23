import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Cpu,
  BrainCircuit,
  ScanLine,
  ArrowRight,
  Binary,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { cn } from "./lib/utils";

const STEPS = [
  {
    id: "ingest",
    label: "01 Frame Ingest & Hashing",
    short: "Normalize",
    detail: "Every crime scene frame is stripped of GPS/EXIF metadata, normalized to 384×384, and assigned a SHA-256 fingerprint for forensic chain-of-custody integrity.",
    metric: "≤ 15 ms",
    icon: Binary,
    tags: ["384×384", "SHA-256", "EXIF Scrub"],
  },
  {
    id: "clip",
    label: "02 CLIP Embedding",
    short: "Project",
    detail: "The vision encoder maps visual features into a shared 512-dimensional multimodal latent space. Crime descriptors are matched zero-shot without retraining biases.",
    metric: "512-d",
    icon: Layers,
    tags: ["Zero-shot", "Cosine Similarity", "Open Vocabulary"],
  },
  {
    id: "vit",
    label: "03 ViT Spatial Attention",
    short: "Attend",
    detail: "ViT-B/16 segments the scene into 197 patch tokens. Self-attention across all 12 heads isolates high-salience evidence markers (tool marks, char patterns, fluid trails).",
    metric: "197 tokens",
    icon: ScanLine,
    tags: ["ViT-B/16", "197 Patches", "12 Heads"],
  },
  {
    id: "fuse",
    label: "04 Multimodal Fusion",
    short: "Calibrate",
    detail: "Global embeddings and local patch salience weights are fused through a calibrated classification head to rank primary crime type and runner-up hypotheses.",
    metric: "6+ classes",
    icon: BrainCircuit,
    tags: ["Calibrated", "Top-3 Hypotheses", "Taxonomy"],
  },
  {
    id: "narrative",
    label: "05 Scene Dossier Generation",
    short: "Synthesize",
    detail: "Gemini multimodal reasoning synthesizes token evidence into an investigative narrative: incident assessment, evidence confidence, and prioritized next steps.",
    metric: "Evidence-weighted",
    icon: FileText,
    tags: ["Multimodal", "Structured Lead List", "PDF Export"],
  },
];

const MODELS = [
  {
    name: "OpenAI CLIP",
    role: "Zero-Shot Crime Classifier",
    icon: Layers,
    accent: "text-cyan-300",
    border: "border-cyan-400/20",
    specs: [
      ["Architecture", "Vision Transformer + Text Encoder"],
      ["Embedding Dim", "512-d Multimodal Space"],
      ["Taxonomy", "Open-vocabulary crime descriptors"],
      ["Zero-Shot Accuracy", "High-generalization across angles"],
    ],
  },
  {
    name: "ViT-B/16",
    role: "Spatial Attention & Evidence Extraction",
    icon: BrainCircuit,
    accent: "text-amber-300",
    border: "border-amber-400/20",
    specs: [
      ["Patch Tokens", "197 spatial tokens"],
      ["Attention Heads", "12 Multi-Head Attention layers"],
      ["Resolution", "384 × 384 input grid"],
      ["Salience", "Highlights physical anomalies"],
    ],
  },
];

export default function About() {
  const navigate = useNavigate();
  const [activeStepId, setActiveStepId] = useState("clip");
  const activeStep = STEPS.find((s) => s.id === activeStepId) || STEPS[0];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            <Cpu className="size-3" /> Forensic Vision Engine Architecture
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Two Vision Models. One Defensible Read.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            SceneSolver transforms forensic investigations by uniting zero-shot vision-language understanding (CLIP) with granular spatial self-attention (ViT) to interpret crime scenes before the tape comes down.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate("/upload")}
              className="flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#08080c] shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)] hover:bg-amber-300"
            >
              Analyze a Scene Now <ArrowRight className="size-4" />
            </button>
            <Link
              to="/user"
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-white/80 hover:bg-white/[0.07] hover:text-white"
            >
              Case Archive
            </Link>
          </div>
        </div>

        {/* Model Breakdown Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {MODELS.map((model) => (
            <div
              key={model.name}
              className={cn(
                "rounded-2xl border bg-[#0b0c12] p-6 shadow-xl transition-all sm:p-8",
                model.border
              )}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg border border-white/10 bg-white/[0.03]">
                  <model.icon className={cn("size-5", model.accent)} />
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Core AI Subsystem
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-white">{model.name}</h3>
              <p className={cn("font-mono text-xs uppercase tracking-[0.14em]", model.accent)}>
                {model.role}
              </p>
              <div className="mt-6 space-y-3 divide-y divide-white/[0.06]">
                {model.specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between pt-3 text-xs">
                    <span className="font-mono uppercase tracking-[0.12em] text-white/40">
                      {k}
                    </span>
                    <span className="text-white/80 font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive 5-Stage Processing Pipeline */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0c12] p-6 shadow-2xl sm:p-10">
          <div className="text-center sm:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300">
              Interactive Execution Trace
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              5-Step Investigation Pipeline
            </h2>
            <p className="mt-2 text-xs text-white/50">
              Click a step to view detailed telemetry, processing algorithms, and data structures.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {STEPS.map((s) => {
              const active = s.id === activeStep.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStepId(s.id)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all",
                    active
                      ? "border-amber-400/50 bg-amber-400/[0.08] shadow-md"
                      : "border-white/[0.06] bg-white/[0.015] hover:border-white/20"
                  )}
                >
                  <s.icon className={cn("size-4", active ? "text-amber-300" : "text-white/40")} />
                  <span className="mt-2 font-mono text-[11px] font-semibold text-white truncate w-full">
                    {s.short}
                  </span>
                  <span className="font-mono text-[9px] text-white/40">{s.metric}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Inspector */}
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#07070b] p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                  {activeStep.label}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-white/75">
                  {activeStep.detail}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeStep.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#0b0c12] p-4 font-mono text-[10px] text-white/50">
                <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-300 mb-2">
                  Telemetry Payload
                </p>
                <pre className="overflow-x-auto text-white/70 leading-relaxed">
                  {`{
  "stage": "${activeStep.id}",
  "latency": "${activeStep.metric}",
  "status": "PASS",
  "checksum": "sha256_verified"
}`}
                </pre>
                <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-[9px]">
                  <CheckCircle2 className="size-3" /> Subsystem healthy
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Flow */}
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">
            End-to-End Workflow
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            How It Works in Operation
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              { step: "01", title: "Upload", desc: "Submit batch images or video recordings from the scene." },
              { step: "02", title: "Process", desc: "Dual vision models process patches and multimodal text alignments." },
              { step: "03", title: "Analyze", desc: "Review evidence confidence percentages and spatial ViT salience." },
              { step: "04", title: "Report", desc: "Export court-ready PDF investigative dossiers instantly." },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-white/[0.07] bg-[#0b0c12] p-5 text-left"
              >
                <span className="font-mono text-xs font-bold text-amber-300">{item.step}</span>
                <h4 className="mt-2 font-semibold text-white">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
