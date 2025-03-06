/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./components/Header";


const images = [
  "/src/assets/crimeSceneImg.jpg",
  "/src/assets/cs1.jpg",
  "/src/assets/cs2.jpg",
  "/src/assets/cs3.jpg",
];

export default function Dashboard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full font-serif relative">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        {/* Background Image Transition */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <AnimatePresence mode="sync">
            {images.map((img, i) => 
              i === index && (
                <motion.img
                  key={i}
                  src={img}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              )
            )}
          </AnimatePresence>
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        {/* Hero Content */}
        <motion.div 
          className="relative z-10 max-w-3xl text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl font-bold transition-transform hover:scale-105 duration-300">
            <span className="text-[#D83A3A]">SceneSolver</span>
            <br />AI-Powered Crime Scene Analysis
          </h1>
          <p className="mt-4 text-lg transition-opacity hover:opacity-100 duration-300">
            Upload crime scene images or videos and let AI analyze key evidence instantly.
          </p>

          {/* Buttons */}
          <div className="mt-6 flex space-x-10 justify-center">
            
          <motion.button 
  whileHover={{ scale: 1.15 }} 
  whileTap={{ scale: 0.95 }}
  className="px-8 py-4 bg-[#D83A3A] text-white text-lg font-bold rounded-full shadow-lg transition-all duration-300 hover:bg-[#B92B2B]"
  onClick={() => window.location.href = '/login'}
>
  Analyze Crime Scene Now!
</motion.button>


          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
<section className="text-center py-16 bg-white">
  <h2 className="text-4xl font-bold text-black">How It Works</h2>
  <p className="text-gray-600 mt-3 text-lg max-w-xl mx-auto">
    SceneSolver automates crime scene analysis using AI-driven forensic techniques.
  </p>

  {/* Boxed Steps in One Line */}
  <div className="mt-12 mx-auto max-w-5xl p-8 bg-white rounded-lg shadow-lg flex justify-between items-center text-lg font-medium text-gray-800 border border-gray-300">
    <span className="text-xl font-semibold">📤 Upload</span>
    <span className="text-xl font-semibold">➝</span>
    <span className="text-xl font-semibold">🤖 AI Analyzes</span>
    <span className="text-xl font-semibold">➝</span>
    <span className="text-xl font-semibold">🔍 Detect & Classify</span>
    <span className="text-xl font-semibold">➝</span>
    <span className="text-xl font-semibold">📄 Generate Reports</span>
  </div>
</section>

{/* Features Section */}
<section className="text-center py-12">
        <h2 className="text-3xl font-semibold transition-colors duration-300">Features</h2>
        <p className="text-gray-600 mt-2">
          SceneSolver utilizes advanced AI models for forensic analysis.
        </p>

        {/* Features Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              title: "🔍 Crime Scene Classification",
              desc: "Uses OpenAI’s CLIP to classify crime scenes based on image-text understanding, improving accuracy in crime type identification.",
            },
            {
              title: "🕵 Evidence Extraction",
              desc: "Vision Transformer (ViT) detects and highlights key evidence such as weapons, bloodstains, and footprints.",
            },
            {
              title: "🎥 Video Frame Processing",
              desc: "Extracts key frames from crime scene videos to analyze only the most relevant images, reducing computational costs.",
            },
            {
              title: "📝 AI-Powered Crime Scene Summarization",
              desc: "Generates concise summaries of crime scenes by extracting textual insights from detected evidence.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg transition-transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <h3 className="text-xl font-semibold text-[#D83A3A]">{feature.title}</h3>
              <p className="text-gray-600 mt-2">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Developers Section */}
<section className="text-center py-12">
  <h2 className="text-3xl font-semibold">Meet the Developers</h2>
  <p className="text-gray-600 mt-2">The minds behind SceneSolver</p>

  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
    {[
      { name: "Rythma Lakkady", linkedin: "https://www.linkedin.com/in/rythma-lakkady-1725852a2", github: "https://github.com/RythmaLakkady" },
      { name: "Rishab Deshpande", linkedin: "https://www.linkedin.com/in/rishab-deshpande-828537350", github: "https://github.com/RishabDeshpande" },
      { name: "Leela", linkedin: "https://www.linkedin.com/in/leela-dhari-22a857", github: "https://github.com/leeladhari" },
      { name: "Y Tripura", linkedin: "https://www.linkedin.com/in/tripura-y-a5a43b307", github: "https://github.com/tripuray" },
      { name: "Koppula Tusshar", linkedin: "https://www.linkedin.com/in/tusshar-koppula-79a3312b0", github: "https://github.com/Tusshar-K" },
      { name: "Aditya Panyala", linkedin: "https://www.linkedin.com/in/adityapanyala", github: "https://github.com/EpicDino7" },
    ].map((dev, index) => (
      <div
        key={index}
        className="bg-white p-6 rounded-xl shadow-lg transition-transform hover:scale-105"
      >
        <h3 className="text-xl font-semibold text-[#D83A3A]">{dev.name}</h3>
        <div className="flex justify-center space-x-4 mt-3">
          <a href={dev.linkedin} target="_blank" rel="noopener noreferrer">
            <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" className="w-6 h-6 transition-transform hover:scale-110" />
          </a>
          <a href={dev.github} target="_blank" rel="noopener noreferrer">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111432.png" alt="GitHub" className="w-6 h-6 transition-transform hover:scale-110" />
          </a>
        </div>
      </div>
    ))}
  </div>
</section>


      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-700 bg-black">
        <p className="text-white">© {new Date().getFullYear()} SceneSolver. All rights reserved.</p>
      </footer>
    </div>
  );
}
