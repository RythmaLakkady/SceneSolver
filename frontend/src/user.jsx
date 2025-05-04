import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";

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
      console.log("Raw case data:", res.data);

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

  const renderCaseImages = () => {
    const imageFiles = caseDetails.filter(
      (f) => f && f.contentType && f.contentType.startsWith("image")
    );

    if (imageFiles.length === 0) {
      return (
        <div className="col-span-3 text-white text-center p-8 bg-black/30 rounded-lg">
          No images available for this case.
        </div>
      );
    }

    return imageFiles.map((file) => (
      <motion.div
        key={file._id}
        className="relative group overflow-hidden rounded-lg border border-white/20 cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => {
          setModalImage(`http://localhost:5000/api/upload/file/${file._id}`);
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
    ));
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

              {loading ? (
                <div className="flex justify-center items-center h-56">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {renderCaseImages()}
                  </div>

                  <div className="text-white">
                    <h4 className="text-xl font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Case Analysis
                    </h4>

                    <div className="bg-black/40 p-6 rounded-md text-gray-200 overflow-auto max-h-96 border border-gray-700/50">
                      {Object.keys(caseResult).length === 0 ? (
                        <div className="text-center py-8">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto mb-2 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-gray-400 italic">
                            No case analysis available
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                          {caseResult.category && (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 shadow-inner">
                              <h5 className="text-purple-300 font-medium mb-3 text-lg border-b border-gray-700 pb-2">
                                Category Analysis
                              </h5>
                              <div className="space-y-2">
                                {typeof caseResult.category === "string" ? (
                                  <div className="px-3 py-2 bg-purple-900/30 text-white rounded-md">
                                    {caseResult.category}
                                  </div>
                                ) : (
                                  Object.entries(caseResult.category || {}).map(
                                    ([key, value], idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between"
                                      >
                                        <span className="text-gray-300 capitalize">
                                          {key.replace(/_/g, " ")}
                                        </span>
                                        <span className="px-3 py-1 bg-purple-900/30 text-white rounded-md text-sm">
                                          {typeof value === "object"
                                            ? JSON.stringify(value)
                                            : String(value)}
                                        </span>
                                      </div>
                                    )
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {caseResult.detection && (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 shadow-inner">
                              <h5 className="text-blue-300 font-medium mb-3 text-lg border-b border-gray-700 pb-2">
                                Detection Results
                              </h5>
                              <div className="space-y-2">
                                {typeof caseResult.detection === "string" ? (
                                  <div className="px-3 py-2 bg-blue-900/30 text-white rounded-md">
                                    {caseResult.detection}
                                  </div>
                                ) : (
                                  Object.entries(
                                    caseResult.detection || {}
                                  ).map(([key, value], idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between"
                                    >
                                      <span className="text-gray-300 capitalize">
                                        {key.replace(/_/g, " ")}
                                      </span>
                                      <span className="px-3 py-1 bg-blue-900/30 text-white rounded-md text-sm">
                                        {typeof value === "object"
                                          ? JSON.stringify(value)
                                          : String(value)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {caseResult.analysis && (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 shadow-inner md:col-span-2">
                              <h5 className="text-green-300 font-medium mb-3 text-lg border-b border-gray-700 pb-2">
                                Detailed Analysis
                              </h5>
                              <div className="space-y-2">
                                {typeof caseResult.analysis === "string" ? (
                                  <div className="px-3 py-2 bg-green-900/30 text-white rounded-md">
                                    {caseResult.analysis}
                                  </div>
                                ) : (
                                  Object.entries(caseResult.analysis || {}).map(
                                    ([key, value], idx) => (
                                      <div key={idx} className="mb-3 last:mb-0">
                                        <h6 className="text-gray-300 capitalize mb-1 font-medium">
                                          {key.replace(/_/g, " ")}
                                        </h6>
                                        <div className="px-3 py-2 bg-green-900/30 text-white rounded-md text-sm">
                                          {typeof value === "object"
                                            ? JSON.stringify(value)
                                            : String(value)}
                                        </div>
                                      </div>
                                    )
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {caseResult.recommendations && (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 shadow-inner md:col-span-2">
                              <h5 className="text-amber-300 font-medium mb-3 text-lg border-b border-gray-700 pb-2">
                                Recommendations
                              </h5>
                              <div className="space-y-2">
                                {typeof caseResult.recommendations ===
                                "string" ? (
                                  <div className="px-3 py-2 bg-amber-900/30 text-white rounded-md">
                                    {caseResult.recommendations}
                                  </div>
                                ) : Array.isArray(
                                    caseResult.recommendations
                                  ) ? (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {caseResult.recommendations.map(
                                      (item, idx) => (
                                        <li
                                          key={idx}
                                          className="text-amber-100"
                                        >
                                          {item}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  Object.entries(
                                    caseResult.recommendations || {}
                                  ).map(([key, value], idx) => (
                                    <div key={idx} className="mb-3 last:mb-0">
                                      <h6 className="text-gray-300 capitalize mb-1 font-medium">
                                        {key.replace(/_/g, " ")}
                                      </h6>
                                      <div className="px-3 py-2 bg-amber-900/30 text-white rounded-md text-sm">
                                        {typeof value === "object"
                                          ? JSON.stringify(value)
                                          : String(value)}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {Object.entries(caseResult)
                            .filter(
                              ([key]) =>
                                ![
                                  "category",
                                  "detection",
                                  "analysis",
                                  "recommendations",
                                ].includes(key)
                            )
                            .map(([key, value], idx) => (
                              <div
                                key={idx}
                                className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 shadow-inner"
                              >
                                <h5 className="text-gray-300 font-medium mb-3 text-lg border-b border-gray-700 pb-2 capitalize">
                                  {key.replace(/_/g, " ")}
                                </h5>
                                <div className="space-y-2">
                                  {typeof value === "string" ? (
                                    <div className="px-3 py-2 bg-gray-800/80 text-white rounded-md">
                                      {value}
                                    </div>
                                  ) : Array.isArray(value) ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {value.map((item, idx) => (
                                        <li key={idx}>
                                          {typeof item === "object"
                                            ? JSON.stringify(item)
                                            : String(item)}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : typeof value === "object" ? (
                                    Object.entries(value || {}).map(
                                      ([subKey, subValue], subIdx) => (
                                        <div
                                          key={subIdx}
                                          className="flex items-center justify-between"
                                        >
                                          <span className="text-gray-300 capitalize">
                                            {subKey.replace(/_/g, " ")}
                                          </span>
                                          <span className="px-3 py-1 bg-gray-800/80 text-white rounded-md text-sm">
                                            {typeof subValue === "object"
                                              ? JSON.stringify(subValue)
                                              : String(subValue)}
                                          </span>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className="px-3 py-2 bg-gray-800/80 text-white rounded-md">
                                      {String(value)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
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
