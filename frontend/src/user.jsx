import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "./config";
import { useAuth } from "./context/AuthContext";
import html2pdf from "html2pdf.js";
import {
  FolderArchive,
  Download,
  X,
  Shield,
  Fingerprint,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  Maximize2,
  FileText,
} from "lucide-react";
import ConfidenceGauge from "./components/ConfidenceGauge";
import { cn, parseGeminiSections } from "./lib/utils";

export default function User() {
  const { user } = useAuth();
  const email = user?.email;

  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState([]);
  const [caseResult, setCaseResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCases, setFetchingCases] = useState(true);

  // New files upload to existing case
  const [newFiles, setNewFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Image zoom modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    if (email) {
      fetchUserCases();
    }
  }, [email]);

  const fetchUserCases = async () => {
    setFetchingCases(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/upload/user?email=${email}`);
      const filtered = (res.data || []).filter(
        (item) => item && item.metadata && item.metadata.caseName
      );

      const uniqueCases = [
        ...new Map(filtered.map((item) => [item.metadata.caseName, item])).values(),
      ].map((item) => item.metadata.caseName);

      setCases(uniqueCases);
      if (uniqueCases.length > 0 && !selectedCase) {
        handleCaseClick(uniqueCases[0]);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setFetchingCases(false);
    }
  };

  const handleCaseClick = async (caseName) => {
    setLoading(true);
    setSelectedCase(caseName);

    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/upload/user/case?email=${email}&caseName=${caseName}`
      );
      setCaseDetails(res.data || []);

      const resultData =
        res.data && res.data[0]?.metadata?.caseResult
          ? res.data[0].metadata.caseResult
          : {};
      setCaseResult(resultData);
    } catch (err) {
      console.error("Error fetching case details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (caseNameParam, summary) => {
    const tempContainer = document.createElement("div");
    tempContainer.style.background = "white";
    tempContainer.style.padding = "40px";
    tempContainer.style.color = "#111827";
    tempContainer.style.fontFamily = "Arial, sans-serif";

    const resObj = caseResult || {};
    const metadata = caseDetails[0]?.metadata || {};

    const content = `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #08080c; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #d97706; font-size: 22px; text-transform: uppercase; margin: 0;">SceneSolver Forensic Intelligence Report</h1>
          <p style="color: #6b7280; font-size: 11px; margin-top: 4px;">CHAIN OF CUSTODY VERIFIED ARCHIVE RECORD</p>
        </div>

        <div style="margin-bottom: 20px; background: #f9fafb; padding: 16px; border-radius: 8px;">
          <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #111;">${caseNameParam}</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>Location:</strong> ${metadata.location || "Not specified"}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>Date:</strong> ${metadata.date || "Not specified"}</p>
        </div>

        <div style="margin-bottom: 20px; padding: 14px; border-left: 4px solid #d97706; background: #fffbeb;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #92400e;">CRIME SCENE CLASSIFICATION</h3>
          <p style="font-size: 18px; font-weight: bold; margin: 0; color: #111;">${resObj.predicted_class || "Undetermined"}</p>
          <p style="font-size: 12px; color: #78350f; margin-top: 2px;">Confidence: ${resObj.crime_confidence || "N/A"}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 13px; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">KEY PHYSICAL EVIDENCE</h3>
          <div style="margin-top: 8px;">
            ${(resObj.extracted_evidence || [])
        .map(
          (e) => `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e5e7eb; font-size: 12px;">
                <span>• ${e.label}</span>
                <span style="font-weight: 600;">${e.confidence}</span>
              </div>
            `
        )
        .join("") || "<p style='font-size: 12px; color: #9ca3af;'>No evidence markers available</p>"}
          </div>
        </div>

        <div>
          <h3 style="font-size: 13px; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">AI MULTIMODAL SUMMARY</h3>
          <div style="font-size: 12px; line-height: 1.6; color: #374151; white-space: pre-wrap; margin-top: 8px;">
            ${summary?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary not available for this record."}
          </div>
        </div>
      </div>
    `;

    tempContainer.innerHTML = content;
    document.body.appendChild(tempContainer);

    const opt = {
      margin: [0.5, 0.5],
      filename: `${caseNameParam.replace(/\s+/g, "_")}_archive_report.pdf`,
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));

    if (videoFiles.length > 0 && files.length > 1) {
      setUploadError("Please upload only one video file at a time");
      e.target.value = "";
      return;
    }

    setNewFiles(files);
    setUploadError("");
  };

  const handleAnalyzeCase = async () => {
    if (!selectedCase) {
      setUploadError("Please select a case first");
      return;
    }
    if (newFiles.length === 0) {
      setUploadError("Please select at least one file");
      return;
    }

    setUploadLoading(true);
    setUploadError("");

    try {
      const activeMeta = caseDetails[0]?.metadata || {};
      const formData = new FormData();
      formData.append("caseName", selectedCase);
      formData.append("location", activeMeta.location || "");
      formData.append("date", activeMeta.date || "");
      formData.append("crimeTime", activeMeta.crimeTime || "");
      formData.append("email", email);
      formData.append("caseResult", JSON.stringify(caseResult || {}));
      newFiles.forEach((file) => formData.append("files", file));

      await axios.post(`${BACKEND_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewFiles([]);
      await handleCaseClick(selectedCase);
    } catch (err) {
      console.error("Failed to append files to case:", err);
      setUploadError("Failed to update case media.");
    } finally {
      setUploadLoading(false);
    }
  };

  const activeMeta = caseDetails[0]?.metadata || {};
  const imageFiles = caseDetails.filter(
    (f) => f && f.contentType && f.contentType.startsWith("image")
  );
  const videoFiles = caseDetails.filter(
    (f) => f && f.contentType && f.contentType.startsWith("video")
  );
  const geminiSummary =
    caseDetails[0]?.metadata?.geminiOutput ||
    caseDetails[0]?.geminiOutput ||
    null;
  const geminiText =
    geminiSummary?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const structuredSections = parseGeminiSections(geminiText);

  const rawConfidence = caseResult?.crime_confidence || 0.85;
  const parsedConfidence =
    typeof rawConfidence === "string"
      ? parseFloat(rawConfidence.replace("%", "")) / (rawConfidence.includes("%") ? 100 : 1)
      : rawConfidence;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
              <FolderArchive className="size-3.5" />
              Evidence Archive
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Investigator Dossier Repository
            </h1>
          </div>
          <div className="font-mono text-xs text-white/50">
            Authenticated: <span className="text-amber-300">{email}</span>
          </div>
        </div>

        {fetchingCases ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-white/50">
              <Loader2 className="size-4 animate-spin text-amber-300" />
              Loading Archive Catalog...
            </div>
          </div>
        ) : cases.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-[#0b0c12] p-12 text-center">
            <Fingerprint className="mx-auto size-10 text-white/30" />
            <h3 className="mt-4 text-lg font-semibold text-white">No Cases on Record</h3>
            <p className="mt-1 text-sm text-white/45">
              You haven&apos;t submitted any crime scenes for analysis yet.
            </p>
            <a
              href="/upload"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#08080c] hover:bg-amber-300"
            >
              Open First Intake
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left Case Index Sidebar */}
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 px-1">
                Case Files ({cases.length})
              </p>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {cases.map((cName) => {
                  const isSelected = selectedCase === cName;
                  return (
                    <button
                      key={cName}
                      onClick={() => handleCaseClick(cName)}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-all",
                        isSelected
                          ? "border-amber-400/40 bg-amber-400/[0.08] shadow-md"
                          : "border-white/[0.06] bg-[#0b0c12] hover:border-white/20 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                          FILE
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-400">
                          <CheckCircle2 className="size-2.5" /> Logged
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-white">
                        {cName}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Case Inspection Detail */}
            <div className="min-w-0">
              {loading ? (
                <div className="flex h-96 items-center justify-center rounded-2xl border border-white/10 bg-[#0b0c12]">
                  <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-white/50">
                    <Loader2 className="size-4 animate-spin text-amber-300" />
                    Retrieving Dossier...
                  </div>
                </div>
              ) : selectedCase ? (
                <div className="space-y-6">
                  {/* Case Header Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#0b0c12] p-6 shadow-xl">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
                          <Shield className="size-3.5" /> Active Dossier
                        </div>
                        <h2 className="mt-1 text-2xl font-bold text-white">
                          {selectedCase}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/50">
                          {activeMeta.location && (
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="size-3.5 text-amber-400" />
                              {activeMeta.location}
                            </span>
                          )}
                          {activeMeta.date && (
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="size-3.5 text-cyan-400" />
                              {activeMeta.date}
                            </span>
                          )}
                          {activeMeta.crimeTime && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="size-3.5 text-rose-400" />
                              {activeMeta.crimeTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadPDF(selectedCase, geminiSummary)}
                        className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#08080c] hover:bg-amber-300"
                      >
                        <Download className="size-3.5" /> Download PDF
                      </button>
                    </div>

                    {/* Classification & Confidence Bar */}
                    {caseResult?.predicted_class && (
                      <div className="mt-6 grid items-center gap-6 border-t border-white/[0.07] pt-6 sm:grid-cols-[1fr_auto]">
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                            Crime Classification
                          </p>
                          <p className="mt-1 text-2xl font-extrabold text-amber-300">
                            {caseResult.predicted_class}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
                              CLIP 512-d
                            </span>
                            <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">
                              ViT-B/16
                            </span>
                          </div>
                        </div>
                        <ConfidenceGauge
                          confidence={parsedConfidence}
                          strokeClass="stroke-amber-400"
                          size={110}
                        />
                      </div>
                    )}
                  </div>

                  {/* Physical Evidence Markers */}
                  {caseResult?.extracted_evidence && caseResult.extracted_evidence.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-[#0b0c12] p-6 shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                          Identified Physical Evidence
                        </span>
                        <span className="font-mono text-[10px] text-white/30">
                          {caseResult.extracted_evidence.length} Markers
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {caseResult.extracted_evidence.map((ev, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                          >
                            <span className="text-white/80 font-medium truncate pr-2">
                              • {ev.label}
                            </span>
                            <span className="font-mono text-xs text-amber-300 font-semibold">
                              {ev.confidence}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Case Media Gallery */}
                  <div className="rounded-2xl border border-white/10 bg-[#0b0c12] p-6 shadow-xl">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">
                      Digital Evidence Media ({imageFiles.length + videoFiles.length})
                    </p>

                    {imageFiles.length === 0 && videoFiles.length === 0 ? (
                      <p className="text-xs font-mono text-white/40">No media stored for this case.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {videoFiles.map((file) => (
                          <div
                            key={file._id}
                            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 col-span-2"
                          >
                            <video controls className="w-full max-h-56">
                              <source
                                src={`${BACKEND_URL}/api/upload/file/${file._id}`}
                                type={file.contentType}
                              />
                            </video>
                            <div className="p-2 font-mono text-[9px] text-white/40 truncate">
                              {file.filename}
                            </div>
                          </div>
                        ))}

                        {imageFiles.map((file) => (
                          <div
                            key={file._id}
                            onClick={() => {
                              setModalImage(`${BACKEND_URL}/api/upload/file/${file._id}`);
                              setModalOpen(true);
                            }}
                            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40"
                          >
                            <img
                              src={`${BACKEND_URL}/api/upload/file/${file._id}`}
                              alt={file.filename || "Case image"}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                              <span className="grid size-8 place-items-center rounded-full bg-black/60 text-white">
                                <Maximize2 className="size-4" />
                              </span>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1 font-mono text-[8px] text-white/60 truncate">
                              {file.filename}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Append More Media Form */}
                    <div className="mt-6 border-t border-white/[0.06] pt-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 mb-2">
                        Append Media to Case
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="font-mono text-xs text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:text-white hover:file:bg-white/20"
                        />
                        <button
                          onClick={handleAnalyzeCase}
                          disabled={newFiles.length === 0 || uploadLoading}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#08080c] disabled:opacity-40 hover:bg-amber-300"
                        >
                          {uploadLoading ? (
                            <>
                              <Loader2 className="size-3 animate-spin" /> Uploading...
                            </>
                          ) : (
                            <>
                              <Plus className="size-3" /> Append Files
                            </>
                          )}
                        </button>
                      </div>
                      {uploadError && (
                        <p className="mt-2 font-mono text-xs text-rose-400">{uploadError}</p>
                      )}
                    </div>
                  </div>

                  {/* AI Multimodal Summary */}
                  {geminiText && (
                    <div className="rounded-2xl border border-white/10 bg-[#0b0c12] p-6 shadow-xl">
                      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                        <FileText className="size-3.5 text-amber-300" /> Investigative Case Dossier
                      </div>
                      <div className="mt-4 space-y-4">
                        {structuredSections.length > 0 ? (
                          structuredSections.map((sec, i) => (
                            <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-4">
                              <h4 className="font-mono text-xs font-bold text-amber-300 uppercase tracking-[0.14em]">
                                {sec.header}
                              </h4>
                              <div className="mt-2 space-y-1.5 text-xs text-white/70 leading-relaxed">
                                {sec.lines.map((l, lIdx) => (
                                  <p key={lIdx}>{l}</p>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                            {geminiText}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {modalOpen && modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-[#0b0c12]">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="size-4" />
            </button>
            <img src={modalImage} alt="Enlarged evidence" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
