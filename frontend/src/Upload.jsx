import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";

const images = [
  "src/assets/crimeSceneImg.jpg",
  "src/assets/cs1.jpg",
  "src/assets/cs2.jpg",
  "src/assets/cs3.jpg",
  "src/assets/cs4.jpeg",
  "src/assets/cs5.jpeg",
  "src/assets/cs6.jpeg",
  "src/assets/cs7.jpeg",
  "src/assets/cs8.jpeg",
];

function ImageUploader({ multiple, maxFiles, minFiles, onFilesChange }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length < minFiles) {
        onFilesChange([], `You must upload at least ${minFiles} files.`);
      } else if (acceptedFiles.length > maxFiles) {
        onFilesChange([], `You can upload a maximum of ${maxFiles} files.`);
      } else {
        onFilesChange(acceptedFiles, "");
      }
    },
    accept: {
      "image/jpg": [],
      "image/png": [],
      "video/mp4": [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`mt-6 p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-[#D83A3A] bg-red-50/20"
          : "border-gray-400 bg-white/10"
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-[#D83A3A] font-semibold text-lg">
          Drop files here...
        </p>
      ) : (
        <p className="text-gray-300 text-lg">
          Drag and drop files or click to upload
        </p>
      )}
    </div>
  );
}

export default function Upload() {
  const [step, setStep] = useState(1);
  const [caseTitle, setCaseTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Upload");
  const [processing, setProcessing] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFilesChange = (uploadedFiles, errorMessage) => {
    if (errorMessage) {
      setError(errorMessage);
      setFiles([]);
      setSuccessMessage("");
    } else {
      setError("");
      setFiles(uploadedFiles);
      setSuccessMessage(
        `${uploadedFiles.length} file(s) uploaded successfully!`
      );
    }
  };

  const handleAnalyze = async () => {
    if (files.length < 4) {
      setError("Please upload at least 4 valid files before proceeding.");
      return;
    }

    setProcessing(true);
    setActiveTab("Process");

    const formData = new FormData();
    formData.append("caseTitle", caseTitle);
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Analysis Results:", data);
      setProcessing(false);
    } catch (error) {
      console.error("Error analyzing files:", error);
      setProcessing(false);
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#1A1A1A] p-6 overflow-auto font-serif">
      {/* Background slideshow */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Header Text */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="text-5xl font-bold text-white mt-18">
          Analyze Your Scene Now!
        </h1>
        <p className="text-gray-300 text-lg mt-2">
          Upload, analyze, and extract crime scene type & evidence.
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex justify-center space-x-6 mb-6">
        {["Upload", "Process", "Results"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg ${
              activeTab === tab
                ? "bg-[#D83A3A] text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main card */}
      <motion.div
        className="relative z-10 bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl max-w-2xl w-full text-center border border-gray-300/30 overflow-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {activeTab === "Upload" && (
          <>
            {step === 1 ? (
              <>
                <h2 className="text-4xl font-bold text-white">
                  Enter Case Title
                </h2>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="mt-6 p-3 rounded-2xl border border-gray-400 bg-transparent text-white placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#D83A3A] transition-all"
                  placeholder="Enter case title"
                />
                <button
                  onClick={() => {
                    if (caseTitle.trim() === "") {
                      setError("Case title cannot be empty.");
                      return;
                    }
                    setStep(2);
                    setError("");
                  }}
                  className="mt-6 px-6 py-3 bg-[#D83A3A] text-white rounded-2xl hover:bg-[#B92B2B] transition-all shadow-md"
                >
                  Next
                </button>
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-white">{caseTitle}</h2>
                <p className="text-gray-300 mt-3 text-lg">
                  Upload{" "}
                  <span className="text-[#D83A3A] font-semibold">
                    one video
                  </span>{" "}
                  OR between{" "}
                  <span className="text-[#D83A3A] font-semibold">
                    4 and 15 images
                  </span>
                  .
                </p>
                <ImageUploader
                  multiple={true}
                  maxFiles={15}
                  minFiles={4}
                  onFilesChange={handleFilesChange}
                />
                {files.length > 0 && (
                  <div className="mt-6 max-h-40 overflow-y-auto space-y-2 text-left">
                    {files.map((file, index) => (
                      <p
                        key={index}
                        className="text-gray-200 text-sm truncate bg-black/40 px-3 py-2 rounded-xl"
                      >
                        {file.name}
                      </p>
                    ))}
                  </div>
                )}
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
                {successMessage && (
                  <p className="text-green-400 mt-4 text-sm">
                    {successMessage}
                  </p>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={files.length < 4} // Disable button until required files are uploaded
                  className={`mt-6 px-6 py-3 rounded-2xl transition-all shadow-md ${
                    files.length >= 4
                      ? "bg-[#D83A3A] text-white hover:bg-[#B92B2B]"
                      : "bg-gray-500 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  Analyze
                </button>
              </>
            )}
          </>
        )}

        {activeTab === "Process" && (
          <h2 className="text-4xl font-bold text-white">
            {processing
              ? "Processing Files..."
              : "Upload files to begin processing"}
          </h2>
        )}

        {activeTab === "Results" && (
          <h2 className="text-4xl font-bold text-white">
            {files.length > 0
              ? "Results will be displayed here."
              : "No results yet."}
          </h2>
        )}
      </motion.div>
    </section>
  );
}
