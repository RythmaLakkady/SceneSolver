import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "src/assets/crimeSceneImg.jpg",
  "src/assets/cs1.jpg",
  "src/assets/cs2.jpg",
  "src/assets/cs3.jpg",
];

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [index, setIndex] = useState(0);

  // Auto-change background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 overflow-hidden">
      {/* Background Image Slider */}
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

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

      {/* Upload Box */}
      <motion.div
        className="relative z-10 bg-white/10 backdrop-blur-lg p-10 rounded-xl shadow-xl max-w-2xl w-full text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl font-bold text-white">Upload Crime Scene Evidence</h2>
        <p className="text-gray-300 mt-3 text-lg">Drag & drop files here or click to browse.</p>

        {/* Drag & Drop Box */}
        <div
          {...getRootProps()}
          className={`mt-6 p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
            isDragActive ? "border-[#D83A3A] bg-red-50/20" : "border-gray-300 bg-white/10"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-[#D83A3A] font-semibold text-lg">Drop files here...</p>
          ) : (
            <p className="text-gray-300 text-lg">Drag and drop files or click to upload</p>
          )}
        </div>

        {/* Display Uploaded Files */}
        {files.length > 0 && (
          <div className="mt-6 space-y-2 text-white">
            {files.map((file, index) => (
              <p key={index} className="text-gray-200 text-lg">{file.name}</p>
            ))}
          </div>
        )}

        {/* Start Analyzing Button */}
        <motion.button
          className="mt-6 w-full bg-[#D83A3A] text-white text-lg px-6 py-4 rounded-lg shadow-md font-semibold hover:bg-[#B92B2B] transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Analyzing
        </motion.button>
      </motion.div>
    </section>
  );
}
