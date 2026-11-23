import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import {
  Download,
  Clipboard,
  Check,
  ArrowLeft,
  Fingerprint,
  Shield,
  FileText,
  MapPin,
  Calendar,
} from "lucide-react";
import ConfidenceGauge from "./components/ConfidenceGauge";
import Typewriter from "./components/Typewriter";
import { cn, parseGeminiSections } from "./lib/utils";

const ACCENT_STYLES = {
  arson: { text: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10", stroke: "stroke-amber-400", bar: "bg-amber-400" },
  burglary: { text: "text-cyan-400", border: "border-cyan-400/30", bg: "bg-cyan-400/10", stroke: "stroke-cyan-400", bar: "bg-cyan-400" },
  homicide: { text: "text-rose-400", border: "border-rose-400/30", bg: "bg-rose-400/10", stroke: "stroke-rose-400", bar: "bg-rose-400" },
  vehicle: { text: "text-sky-400", border: "border-sky-400/30", bg: "bg-sky-400/10", stroke: "stroke-sky-400", bar: "bg-sky-400" },
  vandalism: { text: "text-violet-400", border: "border-violet-400/30", bg: "bg-violet-400/10", stroke: "stroke-violet-400", bar: "bg-violet-400" },
  narcotics: { text: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10", stroke: "stroke-emerald-400", bar: "bg-emerald-400" },
  default: { text: "text-amber-300", border: "border-amber-400/30", bg: "bg-amber-400/10", stroke: "stroke-amber-400", bar: "bg-amber-400" },
};

function getAccent(className = "") {
  const lower = className.toLowerCase();
  for (const key of Object.keys(ACCENT_STYLES)) {
    if (lower.includes(key)) return ACCENT_STYLES[key];
  }
  return ACCENT_STYLES.default;
}

export default function CaseSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const {
    caseData = {},
    caseName = "Untitled Case",
    location: crimeLocation,
    date,
    geminiOutput,
  } = location.state || {};

  const predictedClass = caseData?.predicted_class || "Undetermined";
  const confidenceRaw = caseData?.crime_confidence || 0.85;
  const numConfidence =
    typeof confidenceRaw === "string"
      ? parseFloat(confidenceRaw.replace("%", "")) / (confidenceRaw.includes("%") ? 100 : 1)
      : confidenceRaw;
  const evidenceList = caseData?.extracted_evidence || [];
  const geminiText =
    geminiOutput?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No multimodal summary was provided.";
  const structuredSections = parseGeminiSections(geminiText);
  const accent = getAccent(predictedClass);

  const handleCopyReport = async () => {
    const textToCopy = [
      `SCENESOLVER FORENSIC DOSSIER`,
      `Case: ${caseName}`,
      `Location: ${crimeLocation || "N/A"} | Date: ${date || "N/A"}`,
      `Classification: ${predictedClass} (${(numConfidence * 100).toFixed(1)}%)`,
      `Extracted Evidence:`,
      ...evidenceList.map((e) => `• ${e.label} (${(e.confidence * 100).toFixed(0)}%)`),
      "",
      `AI INVESTIGATION SUMMARY:`,
      geminiText,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const handleDownloadPDF = () => {
    const tempContainer = document.createElement("div");
    tempContainer.style.background = "#ffffff";
    tempContainer.style.color = "#111827";
    tempContainer.style.padding = "40px";
    tempContainer.style.fontFamily = "Arial, sans-serif";

    tempContainer.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #08080c; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="color: #d97706; font-size: 24px; text-transform: uppercase; margin: 0;">SceneSolver Forensic Intelligence Report</h1>
          <p style="color: #6b7280; font-size: 11px; margin-top: 4px;">CHAIN OF CUSTODY VERIFIED · AUTOMATED MULTIMODAL INFERENCE</p>
        </div>

        <div style="margin-bottom: 24px; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <h2 style="font-size: 18px; margin: 0 0 10px 0; color: #111;">${caseName}</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>Location:</strong> ${crimeLocation || "Not specified"}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>Date:</strong> ${date || "Not specified"}</p>
        </div>

        <div style="margin-bottom: 24px; padding: 16px; border-left: 4px solid #d97706; background: #fffbeb;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #92400e;">PRIMARY CLASSIFICATION</h3>
          <p style="font-size: 20px; font-weight: bold; margin: 0; color: #111;">${predictedClass}</p>
          <p style="font-size: 13px; color: #78350f; margin-top: 4px;">Confidence: ${(numConfidence * 100).toFixed(1)}% (CLIP 512-d)</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">EXTRACTED PHYSICAL EVIDENCE</h3>
          <div style="margin-top: 10px;">
            ${evidenceList
        .map(
          (e) => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e5e7eb; font-size: 13px;">
                <span>• ${e.label}</span>
                <span style="font-weight: 600;">${(e.confidence * 100).toFixed(0)}%</span>
              </div>
            `
        )
        .join("")}
          </div>
        </div>

        <div>
          <h3 style="font-size: 14px; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">INVESTIGATIVE SCENE SUMMARY</h3>
          <div style="font-size: 12px; line-height: 1.6; color: #374151; white-space: pre-wrap; margin-top: 10px;">
            ${geminiText}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(tempContainer);

    const opt = {
      margin: [0.5, 0.5],
      filename: `${caseName.replace(/\s+/g, "_")}_forensic_report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf()
      .set(opt)
      .from(tempContainer)
      .save()
      .then(() => {
        document.body.removeChild(tempContainer);
      });
  };

  const exportJSON = () => {
    const payload = {
      caseName,
      location: crimeLocation,
      date,
      classification: predictedClass,
      confidence: numConfidence,
      extractedEvidence: evidenceList,
      summary: geminiText,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseName.replace(/\s+/g, "_")}_dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate("/upload")}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-white/50 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            New Intake
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0b0c12] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 hover:border-white/20 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Clipboard className="size-3.5" /> Copy Dossier
                </>
              )}
            </button>
            <button
              onClick={exportJSON}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0b0c12] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 hover:border-white/20 hover:text-white"
            >
              <Download className="size-3.5" /> JSON
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#08080c] shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)] hover:bg-amber-300"
            >
              <Download className="size-3.5" /> Export PDF
            </button>
          </div>
        </div>

        {/* Dossier Primary Card */}
        <div
          className={cn(
            "reveal relative overflow-hidden rounded-2xl border bg-[#0b0c12] p-6 shadow-2xl sm:p-8",
            accent.border
          )}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className={cn(
              "pointer-events-none absolute -right-24 -top-24 size-72 rounded-full blur-3xl opacity-30",
              accent.bg
            )}
          />

          {/* Dossier Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
              <Fingerprint className={cn("size-4", accent.text)} />
              Forensic Case Dossier
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300">
              <Shield className="size-3" /> Triage Complete
            </span>
          </div>

          {/* Case Metadata & Primary Classification */}
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto]">
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                  Case Identifier
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {caseName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/50">
                  {crimeLocation && (
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="size-3.5 text-amber-400" />
                      {crimeLocation}
                    </span>
                  )}
                  {date && (
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="size-3.5 text-cyan-400" />
                      {date}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                  Primary Classification
                </p>
                <p className={cn("mt-1 text-3xl font-extrabold tracking-tight", accent.text)}>
                  {predictedClass}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                    CLIP · 512-d Embedding
                  </span>
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                    ViT-B/16 · 197 Patches
                  </span>
                </div>
              </div>

              {/* Key Visual Evidence */}
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                    Extracted Physical Evidence
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                    Confidence Weight
                  </span>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {evidenceList.length > 0 ? (
                    evidenceList.map((item, idx) => {
                      const numConf =
                        typeof item.confidence === "string"
                          ? parseFloat(item.confidence)
                          : item.confidence;
                      const confPct = Math.round(numConf * 100);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/80"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="truncate font-medium">{item.label}</p>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className={cn("h-full rounded-full", accent.bar)}
                                style={{ width: `${confPct}%` }}
                              />
                            </div>
                          </div>
                          <span className={cn("font-mono text-xs font-semibold", accent.text)}>
                            {confPct}%
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-xs text-white/40 font-mono">
                      No discrete evidence markers flagged.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confidence Gauge Ring */}
            <div className="flex flex-col items-center justify-center border-t border-white/[0.07] pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <ConfidenceGauge
                confidence={numConfidence}
                strokeClass={accent.stroke}
                size={144}
              />
              <div className="mt-4 space-y-1.5 font-mono text-[10px] text-white/45 text-center">
                <p>Telemetry: Calibrated</p>
                <p>Taxonomy: Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Multimodal Investigation Narrative */}
        <div className="reveal reveal-1 rounded-2xl border border-white/[0.08] bg-[#0b0c12] p-6 shadow-xl sm:p-8">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50">
              <FileText className="size-4 text-amber-300" />
              Investigative Scene Narrative
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
              Evidence-Weighted
            </span>
          </div>

          <div className="mt-6 space-y-6">
            {structuredSections.length > 0 ? (
              structuredSections.map((sec, i) => (
                <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                    {sec.header}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
                    {sec.lines.map((line, lIdx) => {
                      if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2">
                            <span className="mt-1 text-amber-400">•</span>
                            <span>{line.replace(/^[-*•]\s*/, "")}</span>
                          </div>
                        );
                      }
                      return <p key={lIdx}>{line}</p>;
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                <Typewriter text={geminiText} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
