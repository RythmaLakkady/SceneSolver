/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const images = [
  "src/assets/crimeSceneImg.jpg",
  "src/assets/cs1.jpg",
  "src/assets/cs2.jpg",
  "src/assets/cs3.jpg",
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [index, setIndex] = useState(0);

  // Auto-change background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const result = await signup({
      email,
      password,
      displayName: name,
    });

    if (!result.success) {
      alert(result.error || "Signup failed");
    }
  };

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col justify-center items-center text-center px-6 overflow-hidden mt-20">
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

      <motion.div
        className="relative z-10 bg-white/10 backdrop-blur-lg p-10 rounded-xl shadow-xl max-w-md w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-4xl font-bold text-white">Create Account</h2>
        <p className="text-gray-300 mt-3 text-lg">Sign up to get started</p>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="mt-6 space-y-5">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {/* Signup Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-4 bg-[#D83A3A] text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 hover:bg-[#B92B2B]"
          >
            Sign Up
          </motion.button>
        </form>

        {/* Login Link */}
        <p className="text-gray-300 mt-5 text-lg">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#D83A3A] font-semibold hover:underline"
          >
            Login here
          </a>
        </p>
      </motion.div>
    </section>
  );
}
