import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import html2pdf from "html2pdf.js";

export default function CaseSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    caseData,
    caseName,
    location: crimeLocation,
    date,
    geminiOutput,
  } = location.state || {};

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

  const handleDownloadPDF = () => {
    const reportContent = document.getElementById("report-content");

    const tempContainer = document.createElement("div");
    tempContainer.style.background = "white";
    tempContainer.style.padding = "40px";
    tempContainer.style.color = "black";
    tempContainer.style.fontFamily = "Arial, sans-serif";

    const content = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h1 style="color: #D83A3A; font-size: 28px; text-align: center; margin-bottom: 20px;">
          Crime Scene Analysis Report
        </h1>
        <h2 style="font-size: 22px; text-align: center; margin-bottom: 30px; color: #333;">
          ${caseName}
        </h2>
        <div style="margin-bottom: 30px; text-align: center; color: #666;">
          <p>Location: ${crimeLocation || "Not specified"}</p>
          <p>Date: ${date || "Not specified"}</p>
        </div>
        
        <div style="margin-bottom: 40px; padding: 20px; background: #f8f8f8; border-radius: 8px;">
          <h3 style="color: #D83A3A; font-size: 20px; margin-bottom: 15px;">Crime Scene Classification</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #666; margin-bottom: 5px;">Type:</p>
              <p style="color: #333; font-weight: 500;">${
                caseData.predicted_class || "Not available"
              }</p>
            </div>
            <div style="padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #666; margin-bottom: 5px;">Confidence:</p>
              <p style="color: #333; font-weight: 500;">${
                caseData.crime_confidence || "Not available"
              }</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 40px; padding: 20px; background: #f8f8f8; border-radius: 8px;">
          <h3 style="color: #D83A3A; font-size: 20px; margin-bottom: 15px;">Evidence Analysis</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${
              caseData.extracted_evidence
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
          ${geminiOutput.candidates[0].content.parts[0].text
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

  if (!caseData || !geminiOutput) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">No case data available</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#D83A3A] rounded-xl hover:bg-[#B92B2B] transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-gray-300 transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <button
              onClick={handleDownloadPDF}
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

          <div id="report-content" className="text-white space-y-8">
            <div className="text-center border-b border-gray-700 pb-6">
              <h1 className="text-4xl font-bold text-[#D83A3A] mb-4">
                Crime Scene Analysis Report
              </h1>
              <p className="text-xl font-semibold">{caseName}</p>
              <div className="mt-4 text-gray-300">
                <p>Location: {crimeLocation || "Not specified"}</p>
                <p>Date: {date || "Not specified"}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-black/30 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-[#D83A3A] mb-4">
                  Crime Scene Classification
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-gray-300 mb-2">Type:</p>
                    <p className="text-lg font-medium">
                      {caseData.predicted_class || "Not available"}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-gray-300 mb-2">Confidence:</p>
                    <p className="text-lg font-medium">
                      {caseData.crime_confidence || "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-[#D83A3A] mb-4">
                  Evidence Analysis
                </h2>
                <div className="space-y-4">
                  {caseData.extracted_evidence?.map((evidence, index) => (
                    <div key={index} className="bg-white/5 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-medium">{evidence.label}</p>
                        <span className="px-3 py-1 bg-[#D83A3A]/20 rounded-full text-sm">
                          Confidence: {evidence.confidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-[#D83A3A] mb-4">
                  AI Analysis Summary
                </h2>
                <div className="prose prose-invert max-w-none">
                  <div className="space-y-4 text-gray-300">
                    {formatGeminiOutput(
                      geminiOutput.candidates[0].content.parts[0].text
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
