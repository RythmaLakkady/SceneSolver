import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useAuth } from "./context/AuthContext";
import axios from "axios";
import { BACKEND_URL, FLASK_URL } from "./config";
import {
  UploadCloud,
  FileImage,
  Video,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { cn, formatBytes } from "./lib/utils";

const PIPELINE_STEPS = [
  { label: "Frame Ingest & EXIF Scrubbing", detail: "Normalizing to 384×384 · SHA-256 fingerprinting" },
  { label: "CLIP Vision-Text Projection", detail: "512-d zero-shot embedding space alignment" },
  { label: "ViT Patch Token Attention", detail: "Decomposing frame across 197 tokens and 12 heads" },
  { label: "Feature Fusion & Calibrated Classify", detail: "Ranking crime taxonomy confidence scores" },
  { label: "Investigative Narrative", detail: "Generating evidence-weighted scene dossier" },
];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [caseName, setCaseName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [crimeTime, setCrimeTime] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  // Animated pipeline progress while processing
  useEffect(() => {
    let timer;
    if (processing) {
      setProgress(5);
      setCurrentStage(0);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          const next = prev + 3;
          if (next > 75) setCurrentStage(4);
          else if (next > 55) setCurrentStage(3);
          else if (next > 35) setCurrentStage(2);
          else if (next > 15) setCurrentStage(1);
          return next;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [processing]);

  const onDrop = (acceptedFiles) => {
    const videoFiles = acceptedFiles.filter((f) => f.type.startsWith("video/"));

    if (videoFiles.length > 0) {
      if (acceptedFiles.length > 1) {
        setError("Please upload only one video file at a time.");
        return;
      }
      setFiles(acceptedFiles);
      setError("");
      return;
    }

    if (acceptedFiles.length < 4) {
      setError("Please select at least 4 crime scene images.");
      setFiles([]);
      return;
    }

    if (acceptedFiles.length > 15) {
      setError("Maximum batch limit is 15 images.");
      setFiles([]);
      return;
    }

    setFiles(acceptedFiles);
    setError("");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/jpg": [],
      "video/mp4": [],
      "video/quicktime": [],
      "video/avi": [],
    },
    disabled: processing,
  });

  const removeFile = (index) => {
    if (processing) return;
    const next = [...files];
    next.splice(index, 1);
    setFiles(next);
  };

  const handleAnalyze = async () => {
    const videoFiles = files.filter((f) => f.type.startsWith("video/"));
    const isVideo = videoFiles.length > 0;

    if (!isVideo && files.length < 4) {
      setError("Please upload at least 4 images or one video file.");
      return;
    }

    if (isVideo && files.length > 1) {
      setError("Please upload only one video file at a time.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // 1. Post to Flask Inference Backend
      const inferenceForm = new FormData();
      inferenceForm.append("caseName", caseName);
      inferenceForm.append("location", location);
      inferenceForm.append("date", date);
      inferenceForm.append("crimeTime", crimeTime);
      files.forEach((file) => inferenceForm.append("files", file));
      inferenceForm.append("email", user?.email || "");

      const inferenceRes = await axios.post(`${FLASK_URL}/upload`, inferenceForm, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const caseResult = inferenceRes.data?.result || {};

      // 2. Post to Node/Express Backend to save case and generate Gemini dossier
      const finalFormData = new FormData();
      finalFormData.append("caseName", caseName);
      finalFormData.append("location", location);
      finalFormData.append("date", date);
      finalFormData.append("crimeTime", crimeTime);
      finalFormData.append("email", user?.email || "");
      finalFormData.append("caseResult", JSON.stringify(caseResult));
      files.forEach((file) => finalFormData.append("files", file));

      const uploadRes = await axios.post(`${BACKEND_URL}/api/upload`, finalFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProgress(100);

      // 3. Navigate to Case Summary with results
      navigate("/case-summary", {
        state: {
          caseData: caseResult,
          caseName,
          location,
          date,
          geminiOutput: uploadRes.data?.geminiOutput,
        },
      });
    } catch (err) {
      console.error("Analysis intake error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        "Inference failed. Check that Flask and Express services are active.";
      setError(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  const hasVideo = files.some((f) => f.type.startsWith("video/"));
  const canAnalyze =
    files.length > 0 &&
    (hasVideo || files.length >= 4) &&
    !processing;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300/80">
            Intake Terminal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Case Evidence Intake
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Secure digital chain of custody. Upload crime scene frames for automated AI triage.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em]",
              step === 1
                ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                : "border-white/10 bg-white/[0.02] text-white/40"
            )}
          >
            <span>01</span> Metadata
          </div>
          <div className="h-px w-8 bg-white/15" />
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em]",
              step === 2
                ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                : "border-white/10 bg-white/[0.02] text-white/40"
            )}
          >
            <span>02</span> Evidence Ingest
          </div>
        </div>

        {/* Step 1: Metadata Form */}
        {step === 1 && (
          <div className="reveal mt-10 rounded-2xl border border-white/10 bg-[#0b0c12] p-6 shadow-2xl sm:p-8">
            <h2 className="text-lg font-semibold text-white">
              Case Identification & Scene Context
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Enter primary incident parameters to initialize evidence metadata.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1.5">
                  Case Name / Incident Title *
                </label>
                <input
                  type="text"
                  required
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  placeholder="e.g. Case #2026-884 · 4th St Warehouse"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white placeholder-white/25 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1.5">
                  <MapPin className="inline size-3 mr-1 text-amber-300" />
                  Scene Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 742 Evergreen Terrace, Sector 4"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1.5">
                    <Calendar className="inline size-3 mr-1 text-cyan-300" />
                    Incident Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1.5">
                    <Clock className="inline size-3 mr-1 text-rose-300" />
                    Approximate Time
                  </label>
                  <input
                    type="time"
                    value={crimeTime}
                    onChange={(e) => setCrimeTime(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!caseName.trim()) {
                    setError("Please enter a case name to continue.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#08080c] shadow-[0_0_24px_-4px_rgba(251,191,36,0.5)] transition-all hover:bg-amber-300"
              >
                Proceed to Upload
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Evidence Upload & Processing */}
        {step === 2 && (
          <div className="reveal mt-10 space-y-6">
            {/* Active Case Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0b0c12] px-5 py-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                  Target Case
                </p>
                <p className="text-base font-semibold text-white">{caseName}</p>
              </div>
              <button
                onClick={() => !processing && setStep(1)}
                disabled={processing}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300/80 hover:text-amber-200 disabled:opacity-30"
              >
                Edit Metadata
              </button>
            </div>

            {/* Dropzone Area */}
            {!processing ? (
              <div
                {...getRootProps()}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all",
                  isDragActive
                    ? "border-amber-400 bg-amber-400/[0.05]"
                    : "border-white/15 bg-[#0b0c12]/80 hover:border-amber-400/40 hover:bg-[#0b0c12]"
                )}
              >
                <input {...getInputProps()} />
                <div className="pointer-events-none mx-auto flex max-w-sm flex-col items-center">
                  <span className="grid size-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_30px_-6px_rgba(251,191,36,0.3)]">
                    <UploadCloud className="size-7" />
                  </span>
                  <p className="mt-4 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-white">
                    {isDragActive ? "Drop media frames here" : "Upload Crime Scene Media"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Drag and drop <span className="text-amber-300">4 to 15 images</span> or{" "}
                    <span className="text-cyan-300">1 video file</span> (.mp4, .mov, .jpg, .png)
                  </p>
                </div>
              </div>
            ) : (
              /* Processing Pipeline View */
              <div className="rounded-2xl border border-amber-400/30 bg-[#0b0c12] p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">
                    <Loader2 className="size-4 animate-spin" />
                    Deep Inference In Progress
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300">{progress}%</span>
                </div>

                <div className="mt-6 space-y-4">
                  {PIPELINE_STEPS.map((stage, idx) => {
                    const isDone = idx < currentStage;
                    const isCurrent = idx === currentStage;
                    return (
                      <div key={stage.label} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[9px]",
                            isDone && "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
                            isCurrent && "border-amber-400 bg-amber-400/20 text-amber-300",
                            !isDone && !isCurrent && "border-white/10 text-white/20"
                          )}
                        >
                          {isDone ? <CheckCircle2 className="size-3.5" /> : idx + 1}
                        </span>
                        <div>
                          <p
                            className={cn(
                              "font-mono text-xs uppercase tracking-[0.12em]",
                              isDone || isCurrent ? "text-white" : "text-white/30"
                            )}
                          >
                            {stage.label}
                          </p>
                          <p className="font-mono text-[10px] text-white/40">{stage.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3.5 font-mono text-xs text-rose-300">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Files List Preview */}
            {files.length > 0 && !processing && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0c12] p-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                    Selected Files ({files.length})
                  </span>
                  <button
                    onClick={() => setFiles([])}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-400 hover:text-rose-300"
                  >
                    Clear All
                  </button>
                </div>

                <div className="mt-3 max-h-56 divide-y divide-white/[0.04] overflow-y-auto">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 text-xs text-white/80"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {file.type.startsWith("video/") ? (
                          <Video className="size-4 shrink-0 text-cyan-300" />
                        ) : (
                          <FileImage className="size-4 shrink-0 text-amber-300" />
                        )}
                        <span className="truncate">{file.name}</span>
                        <span className="font-mono text-[10px] text-white/35">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-white/30 hover:text-rose-400"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action */}
            {!processing && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] transition-all",
                    canAnalyze
                      ? "bg-amber-400 text-[#08080c] shadow-[0_0_30px_-6px_rgba(251,191,36,0.6)] hover:bg-amber-300 hover:scale-[1.02]"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  <ScanLine className="size-4" />
                  Execute Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
