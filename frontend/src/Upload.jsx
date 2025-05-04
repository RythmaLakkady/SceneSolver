import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useAuth } from "./context/AuthContext";
import axios from "axios";

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
      "image/jpeg": [],
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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [caseName, setCaseName] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Upload");
  const [processing, setProcessing] = useState(false);
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState(null);

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

    try {
      const inferenceForm = new FormData();
      inferenceForm.append("caseName", caseName);
      files.forEach((file) => inferenceForm.append("files", file));
      inferenceForm.append("email", user.email);

      const inferenceRes = await axios.post(
        "http://127.0.0.1:5000/upload",
        inferenceForm,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const caseResult = JSON.stringify(inferenceRes.data.data);

      const finalFormData = new FormData();
      finalFormData.append("caseName", caseName);
      finalFormData.append("email", user.email);
      finalFormData.append("caseResult", caseResult);
      files.forEach((file) => finalFormData.append("files", file));

      const uploadRes = await axios.post(
        "http://localhost:5000/api/upload",
        finalFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload success response:", uploadRes.data);
      setResponse(uploadRes.data);
      setError(null);
      setActiveTab("Results");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Upload failed");
      setResponse(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#1A1A1A] p-6 overflow-auto font-serif">
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

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      <div className="relative z-10 text-center mb-6">
        <h1 className="text-5xl font-bold text-white mt-18">
          Analyze Your Scene Now!
        </h1>
        <p className="text-gray-300 text-lg mt-2">
          Upload, analyze, and extract crime scene type & evidence.
        </p>
      </div>

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
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="mt-6 p-3 rounded-2xl border border-gray-400 bg-transparent text-white placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#D83A3A] transition-all"
                  placeholder="Enter case title"
                />
                <button
                  onClick={() => {
                    if (caseName.trim() === "") {
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
                <h2 className="text-4xl font-bold text-white">{caseName}</h2>
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
                  disabled={files.length < 4}
                  className={`mt-6 px-6 py-3 rounded-2xl transition-all shadow-md ${
                    files.length >= 4
                      ? "bg-[#D83A3A] text-white hover:bg-[#B92B2B]"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {processing ? "Analyzing..." : "Analyze"}
                </button>
              </>
            )}
          </>
        )}

        {activeTab === "Process" && processing && (
          <div className="text-white font-semibold text-xl">
            Analyzing your data, please wait...
          </div>
        )}

        {activeTab === "Results" && response && (
          <div className="text-white text-left space-y-4">
            <h2 className="text-3xl font-bold text-center mb-6">
              Analysis Results
            </h2>

            <div className="bg-black/30 p-4 rounded-xl">
              <p className="text-xl">
                <span className="font-semibold text-[#D83A3A]">
                  Crime Type:
                </span>{" "}
                {response.files[0]?.metadata?.caseResult?.predicted_class ||
                  "N/A"}
              </p>
              <p className="text-xl mt-4">
                <span className="font-semibold text-[#D83A3A]">
                  Confidence:
                </span>{" "}
                {response.files[0]?.metadata?.caseResult?.crime_confidence ||
                  "N/A"}
              </p>
            </div>

            <div className="bg-black/30 p-4 rounded-xl">
              <p className="text-xl font-semibold text-[#D83A3A] mb-2">
                Extracted Evidence:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg">
                {response.files[0]?.metadata?.caseResult?.extracted_evidence?.map(
                  (evidence, i) => (
                    <li key={i}>
                      {evidence.label} (Confidence: {evidence.confidence})
                    </li>
                  )
                ) || <li>No evidence found</li>}
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
