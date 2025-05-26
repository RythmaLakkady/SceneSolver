import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import html2pdf from "html2pdf.js";

const images = [
  "src/assets/crimeSceneImg.jpg",
  "src/assets/cs1.jpg",
  "src/assets/cs2.jpg",
  "src/assets/cs3.jpg",
];

export default function User() {
  const { user } = useAuth();
  const email = user.email;

  const [index, setIndex] = useState(0);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState([]);
  const [caseResult, setCaseResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserCases();
  }, [email]);

  const fetchUserCases = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/upload/user?email=${email}`
      );
      // console.log("Raw case data:", res.data);

      const filtered = res.data.filter(
        (item) => item && item.metadata && item.metadata.caseName
      );

      const uniqueCases = [
        ...new Map(
          filtered.map((item) => [item.metadata.caseName, item])
        ).values(),
      ].map((item) => item.metadata.caseName);

      setCases(uniqueCases);
    } catch (err) {
      console.error("Error fetching cases:", err);
    }
  };

  const handleCaseClick = async (caseName) => {
    setLoading(true);
    setSelectedCase(caseName);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/upload/user/case?email=${email}&caseName=${caseName}`
      );

      setCaseDetails(res.data);

      const resultData =
        res.data &&
        res.data[0] &&
        res.data[0].metadata &&
        res.data[0].metadata.caseResult
          ? res.data[0].metadata.caseResult
          : {};

      setCaseResult(resultData);
    } catch (err) {
      console.error("Error fetching case details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatGeminiOutput = (text) => {
    const sections = text.split(/(?=\n[A-Z][A-Z\s]+:)/);
    return sections
      .map((section, index) => {
        const [header, ...content] = section.split("\n");
        if (!header.trim()) return null;

        const cleanHeader = header.replace(/[:*]+/g, "").trim();

        return (
          <div
            key={index}
            className="mb-8 last:mb-0 bg-black/20 rounded-lg p-6 border border-gray-700/30"
          >
            <h3 className="text-xl font-semibold text-[#D83A3A] mb-4 pb-2 border-b border-gray-700/30">
              {cleanHeader}
            </h3>
            <div className="text-gray-300 space-y-3">
              {content
                .map((line, i) => {
                  if (!line.trim()) return null;

                  const keyValueMatch = line.trim().match(/^([^:]+):\s*(.+)$/);
                  if (keyValueMatch) {
                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 bg-black/20 p-3 rounded-lg"
                      >
                        <span className="text-[#D83A3A] font-medium min-w-[120px]">
                          {keyValueMatch[1].trim()}:
                        </span>
                        <span className="text-gray-300">
                          {keyValueMatch[2].trim()}
                        </span>
                      </div>
                    );
                  }

                  const bulletMatch = line.trim().match(/^[-*]\s*(.+)$/);
                  if (bulletMatch) {
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-black/20 p-3 rounded-lg"
                      >
                        <span className="text-[#D83A3A] mt-1">•</span>
                        <span className="text-gray-300 flex-1">
                          {bulletMatch[1].trim()}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={i}
                      className="leading-relaxed bg-black/20 p-3 rounded-lg"
                    >
                      {line.trim()}
                    </p>
                  );
                })
                .filter(Boolean)}
            </div>
          </div>
        );
      })
      .filter(Boolean);
  };

  const handleDownloadPDF = (caseName, summary) => {
    const tempContainer = document.createElement("div");
    tempContainer.style.background = "white";
    tempContainer.style.padding = "40px";
    tempContainer.style.color = "black";
    tempContainer.style.fontFamily = "Arial, sans-serif";

    const caseResult = caseDetails[0]?.metadata?.caseResult || {};

    const content = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h1 style="color: #D83A3A; font-size: 28px; text-align: center; margin-bottom: 20px;">
          Crime Scene Analysis Report
        </h1>
        <h2 style="font-size: 22px; text-align: center; margin-bottom: 30px; color: #333;">
          ${caseName}
        </h2>
        
        <div style="margin-bottom: 40px; padding: 20px; background: #f8f8f8; border-radius: 8px;">
          <h3 style="color: #D83A3A; font-size: 20px; margin-bottom: 15px;">Crime Scene Classification</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #666; margin-bottom: 5px;">Type:</p>
              <p style="color: #333; font-weight: 500;">${
                caseResult.predicted_class || "Not available"
              }</p>
            </div>
            <div style="padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #666; margin-bottom: 5px;">Confidence:</p>
              <p style="color: #333; font-weight: 500;">${
                caseResult.crime_confidence || "Not available"
              }</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 40px; padding: 20px; background: #f8f8f8; border-radius: 8px;">
          <h3 style="color: #D83A3A; font-size: 20px; margin-bottom: 15px;">Evidence Analysis</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${
              caseResult.extracted_evidence
                ?.map(
                  (evidence) => `
              <div style="padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #333; font-weight: 500;">${evidence.label}</span>
                <span style="color: #666; font-size: 14px;">Confidence: ${evidence.confidence}</span>
              </div>
            `
                )
                .join("") || "No evidence available"
            }
          </div>
        </div>

        <div style="padding: 20px; background: #f8f8f8; border-radius: 8px;">
          <h3 style="color: #D83A3A; font-size: 20px; margin-bottom: 15px;">AI Analysis Summary</h3>
          ${summary.candidates[0].content.parts[0].text
            .split(/(?=\n[A-Z][A-Z\s]+:)/)
            .map((section) => {
              const [header, ...content] = section.split("\n");
              if (!header.trim()) return "";

              const cleanHeader = header.replace(/[:*]+/g, "").trim();

              return `
              <div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4 style="color: #D83A3A; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                  ${cleanHeader}
                </h4>
                <div style="color: #333; line-height: 1.6;">
                  ${content
                    .map((line) => {
                      if (!line.trim()) return "";
                      const keyValueMatch = line
                        .trim()
                        .match(/^([^:]+):\s*(.+)$/);
                      const bulletMatch = line.trim().match(/^[-*]\s*(.+)$/);

                      if (keyValueMatch) {
                        return `
                        <div style="margin-bottom: 10px; padding: 10px; background: #f8f8f8; border-radius: 4px;">
                          <span style="color: #D83A3A; font-weight: 500;">${keyValueMatch[1].trim()}:</span>
                          <span style="color: #333;">${keyValueMatch[2].trim()}</span>
                        </div>
                      `;
                      }

                      if (bulletMatch) {
                        return `
                        <div style="margin-bottom: 10px; padding: 10px; background: #f8f8f8; border-radius: 4px;">
                          <span style="color: #D83A3A; margin-right: 8px;">•</span>
                          <span style="color: #333;">${bulletMatch[1].trim()}</span>
                        </div>
                      `;
                      }

                      return `<p style="margin-bottom: 10px; padding: 10px; background: #f8f8f8; border-radius: 4px;">${line.trim()}</p>`;
                    })
                    .join("")}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;

    tempContainer.innerHTML = content;
    document.body.appendChild(tempContainer);

    const opt = {
      margin: [0.5, 0.5],
      filename: `${caseName}_report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    html2pdf()
      .set(opt)
      .from(tempContainer)
      .save()
      .then(() => {
        document.body.removeChild(tempContainer);
      });
  };

  const renderCaseMedia = () => {
    const imageFiles = caseDetails.filter(
      (f) => f && f.contentType && f.contentType.startsWith("image")
    );

    const videoFiles = caseDetails.filter(
      (f) => f && f.contentType && f.contentType.startsWith("video")
    );

    if (imageFiles.length === 0 && videoFiles.length === 0) {
      return (
        <div className="col-span-3 text-white text-center p-8 bg-black/30 rounded-lg">
          No media available for this case.
        </div>
      );
    }

    return (
      <>
        {videoFiles.map((file) => (
          <motion.div
            key={file._id}
            className="relative group overflow-hidden rounded-lg border border-white/20 col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <video
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: "400px" }}
            >
              <source
                src={`http://localhost:5000/api/upload/file/${file._id}`}
                type={file.contentType}
              />
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
              {file.filename}
            </div>
          </motion.div>
        ))}

        {imageFiles.map((file) => (
          <motion.div
            key={file._id}
            className="relative group overflow-hidden rounded-lg border border-white/20 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => {
              setModalImage(
                `http://localhost:5000/api/upload/file/${file._id}`
              );
              setModalOpen(true);
            }}
          >
            <img
              src={`http://localhost:5000/api/upload/file/${file._id}`}
              alt={file.filename || "Case image"}
              className="w-full h-56 object-cover transform group-hover:scale-105 transition duration-300 ease-in-out"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
              {file.filename}
            </div>
          </motion.div>
        ))}
      </>
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    const videoFiles = files.filter((file) => file.type.startsWith("video/"));

    if (videoFiles.length > 0) {
      if (files.length > 1) {
        setUploadError("Please upload only one video file at a time");
        e.target.value = "";
        return;
      }
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

    const isVideoUpload = newFiles.some((file) =>
      file.type.startsWith("video/")
    );

    if (!isVideoUpload && newFiles.length < 1) {
      setUploadError("Please select at least one image");
      return;
    }

    setUploadLoading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("caseName", selectedCase);
      newFiles.forEach((file) => formData.append("files", file));

      const response = await axios.post(
        "http://localhost:5000/api/upload/add-to-case",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.result) {
        setCaseResult(response.data.result);
        setNewFiles([]);

        await handleCaseClick(selectedCase);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error.response?.data?.error ||
          "Error processing case. Please try again."
      );
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      setNewFiles([]);
    } finally {
      setUploadLoading(false);
    }
  };

  const renderCaseDetails = () => {
    if (!selectedCase || !caseDetails || caseDetails.length === 0) return null;

    const caseResult = caseDetails[0]?.metadata?.caseResult || {};
    const caseSummary = caseDetails[0]?.metadata?.caseSummary;

    return (
      <div className="space-y-6">
        <div className="bg-black/40 p-6 rounded-xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-white">Case Summary</h3>
            <button
              onClick={() => handleDownloadPDF(selectedCase, caseSummary)}
              className="flex items-center px-4 py-2 bg-[#D83A3A] text-white rounded-lg hover:bg-[#B92B2B] transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download PDF
            </button>
          </div>

          <div className="grid gap-6">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
              <h4 className="text-xl font-medium text-[#D83A3A] mb-4">
                Crime Scene Classification
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Type:</p>
                  <p className="text-white">
                    {caseResult.predicted_class || "Not available"}
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Confidence:</p>
                  <p className="text-white">
                    {caseResult.crime_confidence || "Not available"}
                  </p>
                </div>
              </div>
            </div>

            {caseResult.extracted_evidence && (
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-xl font-medium text-[#D83A3A] mb-4">
                  Evidence Analysis
                </h4>
                <div className="space-y-3">
                  {caseResult.extracted_evidence.map((evidence, idx) => (
                    <div
                      key={idx}
                      className="bg-black/30 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="text-white">{evidence.label}</span>
                      <span className="text-sm text-gray-300">
                        Confidence: {evidence.confidence}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caseSummary && (
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-xl font-medium text-[#D83A3A] mb-4">
                  AI Analysis Summary
                </h4>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="prose prose-invert max-w-none">
                    {formatGeminiOutput(
                      caseSummary.candidates[0].content.parts[0].text
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start bg-[#1A1A1A] pt-20 p-6 overflow-auto font-serif">
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        {images.map((img, i) => (
          <motion.img
            key={i}
            src={img}
            className="absolute w-full h-full object-cover blur-lg"
            style={{ opacity: i === index ? 1 : 0 }}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 max-w-4xl w-full space-y-10">
        <motion.div
          className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-gray-300/30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-3 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            User Cases
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cases.length > 0 ? (
              cases.map((caseName, idx) => (
                <motion.div
                  key={idx}
                  onClick={() => handleCaseClick(caseName)}
                  className={`cursor-pointer p-5 rounded-xl text-white transition-all border shadow-lg ${
                    selectedCase === caseName
                      ? "bg-gradient-to-r from-purple-900/70 to-indigo-900/70 border-purple-500/50 shadow-purple-500/20"
                      : "bg-white/10 border-gray-300/20 hover:bg-white/20 hover:border-gray-300/40"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <div className="flex items-center">
                    <div
                      className={`rounded-full w-3 h-3 mr-3 ${
                        selectedCase === caseName
                          ? "bg-purple-400 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <div>
                      <h3
                        className={`text-lg ${
                          selectedCase === caseName ? "font-semibold" : ""
                        }`}
                      >
                        {caseName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Click to view case details
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 text-white text-center p-8 bg-black/30 rounded-lg border border-gray-700/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-lg font-medium">No cases found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Please upload case files first
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedCase && (
            <motion.div
              className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-gray-300/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-semibold text-white flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 mr-3 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {selectedCase}
                </h3>

                <span className="px-3 py-1 bg-purple-900/60 text-purple-200 text-xs rounded-full border border-purple-500/50">
                  {
                    caseDetails.filter(
                      (f) =>
                        f && f.contentType && f.contentType.startsWith("image")
                    ).length
                  }{" "}
                  Images
                </span>
              </div>

              <div className="mb-8 p-6 bg-black/30 rounded-xl border border-gray-700/50">
                <h4 className="text-xl font-semibold text-white mb-4">
                  Case Evidence
                </h4>
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      multiple={
                        !newFiles.some((file) => file.type.startsWith("video/"))
                      }
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/60 file:text-purple-200 hover:file:bg-purple-900/80 file:cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      You can upload multiple images or a single video file at a
                      time
                    </p>
                  </div>
                  {newFiles.length > 0 && (
                    <div className="text-sm text-gray-400">
                      {newFiles.length} new file(s) selected:{" "}
                      {newFiles.map((f) => f.name).join(", ")}
                    </div>
                  )}
                  {uploadError && (
                    <div className="text-red-400 text-sm">{uploadError}</div>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={handleAnalyzeCase}
                      disabled={uploadLoading}
                      className={`px-4 py-2 rounded-lg text-white font-medium ${
                        uploadLoading
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      } transition-colors flex items-center gap-2`}
                    >
                      {uploadLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          {newFiles.some((file) =>
                            file.type.startsWith("video/")
                          )
                            ? "Processing Video..."
                            : newFiles.length > 0
                            ? "Uploading & Analyzing..."
                            : "Analyzing..."}
                        </>
                      ) : (
                        <>
                          {newFiles.some((file) =>
                            file.type.startsWith("video/")
                          )
                            ? "Process Video"
                            : newFiles.length > 0
                            ? "Upload & Analyze Evidence"
                            : "Analyze Case"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-56">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {renderCaseMedia()}
                  </div>
                  {renderCaseDetails()}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalOpen && modalImage && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="relative max-w-5xl max-h-[90vh] w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImage}
                alt="Full view"
                className="w-full h-auto max-h-[90vh] rounded-xl shadow-2xl object-contain"
              />
              <button
                className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
                onClick={() => setModalOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white py-4 px-6 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-1">Evidence Image</h4>
                    <p className="text-sm text-gray-300">
                      Case: {selectedCase}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </button>
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
