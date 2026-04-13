import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import crimeSceneImg from "./assets/crimeSceneImg.jpg";
import cs1 from "./assets/cs1.jpg";
import cs2 from "./assets/cs2.jpg";
import cs3 from "./assets/cs3.jpg";
import cs4 from "./assets/cs4.jpeg";
import cs5 from "./assets/cs5.jpeg";
import cs6 from "./assets/cs6.jpeg";
import cs7 from "./assets/cs7.jpeg";
import cs8 from "./assets/cs8.jpeg";

const images = [crimeSceneImg, cs1, cs2, cs3, cs4, cs5, cs6, cs7, cs8];

export default function About() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="font-serif bg-[#1A1A1A] text-white relative">
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* About SceneSolver */}
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
          <motion.h1
            className="text-5xl font-bold text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            About SceneSolver
          </motion.h1>
          <motion.p
            className="text-xl text-center mt-4 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            An AI-powered forensic platform that automates crime scene analysis
          </motion.p>
        </div>

        {/* Our Technology */}
        <div className="flex flex-col lg:flex-row items-center justify-between p-10 gap-10">
          <div className="lg:w-1/2 lg:pl-6"> {/* Added lg:pl-6 for padding on larger screens */}
            <h2 className="text-4xl font-bold mb-4">Our Technology</h2>
            <p className="text-lg text-gray-300 lg:pr-16">
              SceneSolver leverages cutting-edge AI models to transform
              forensic investigations. Our platform combines 
              CLIP (Contrastive Language-Image Pre-training) with 
              Vision Transformers (ViT) to analyze crime scene images 
              with unprecedented accuracy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:w-1/2">
            <div className="bg-white/10 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-[#D83A3A]">CLIP</h3>
              <p className="text-gray-300 mt-2">
                Connects visual and textual data for comprehensive analysis
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-[#D83A3A]">ViT</h3>
              <p className="text-gray-300 mt-2">
                Processes images as sequences for detailed visual understanding
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-[#D83A3A]">Batch Processing</h3>
              <p className="text-gray-300 mt-2">
                Analyze multiple images simultaneously for efficient investigations
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-[#D83A3A]">Reporting</h3>
              <p className="text-gray-300 mt-2">
                Generate detailed reports with evidence summaries
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="p-10">
          <h2 className="text-4xl font-bold text-center mb-10">How It Works</h2>
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="lg:w-1/2 space-y-6 lg:pl-6"> {/* Added lg:pl-6 for padding on larger screens */}
              <div>
                <h3 className="text-2xl font-bold text-[#D83A3A]">1. Upload</h3>
                <p className="text-gray-300 mt-2">
                  Upload crime scene images individually or in batches
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#D83A3A]">2. Process</h3>
                <p className="text-gray-300 mt-2">
                  AI models analyze images to identify crime types and evidence
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#D83A3A]">3. Analyze</h3>
                <p className="text-gray-300 mt-2">
                  Review AI-generated findings and evidence markers
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#D83A3A]">4. Report</h3>
                <p className="text-gray-300 mt-2">
                  Export detailed reports for your investigation
                </p>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <motion.img
                src={new URL('./assets/howitworks.png', import.meta.url).href}
                alt="How It Works"
                className="w-full max-w-sm rounded-lg shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>

        {/* Meet the Developers Section */}
        <div className="p-10 mb-16"> {/* Added mb-16 for extra spacing */}
          <h2 className="text-4xl font-bold text-center mb-5 text-white">Meet the Developers</h2>
          <p className="text-gray-300 text-center mb-2">The minds behind SceneSolver</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { name: "Aditya Panyala", linkedin: "https://www.linkedin.com/in/adityapanyala", github: "https://github.com/EpicDino7" },
              { name: "Rishab Deshpande", linkedin: "https://www.linkedin.com/in/rishab-deshpande-828537350", github: "https://github.com/RishabDeshpande" },
            ].map((dev, index) => (
              <div
                key={index}
                className="bg-white/10 p-6 rounded-xl shadow-lg transition-transform hover:scale-105 text-center"
              >
                <h3 className="text-xl font-semibold text-[#D83A3A]">{dev.name}</h3>
                <div className="flex justify-center space-x-4 mt-3">
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                      alt="LinkedIn"
                      className="w-6 h-6 transition-transform hover:scale-110"
                    />
                  </a>
                  <a href={dev.github} target="_blank" rel="noopener noreferrer">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/2111/2111432.png"
                      alt="GitHub"
                      className="w-6 h-6 transition-transform hover:scale-110"
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready to Transform Section */}
        <div className="p-10 text-center bg-[#1A1A1A]">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Investigations?
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-6">
            Start using SceneSolver today to enhance your forensic analysis capabilities.
          </p>
          <button
            onClick={() => navigate('/login')} // Navigate to the login page
            className="px-8 py-4 bg-[#D83A3A] text-white text-lg font-bold rounded-full shadow-lg transition-all duration-300 hover:bg-[#B92B2B] hover:shadow-[0_0_15px_#D83A3A]" // Added glowing hover effect
          >
            Get Started
          </button>
        </div>
        {/* Footer */}
        
      <footer className=" py-6 text-center text-gray-700 bg-black">
        <p className="text-white">© {new Date().getFullYear()} SceneSolver. All rights reserved.</p>
      </footer>
      </div>
    </section>
  );
}