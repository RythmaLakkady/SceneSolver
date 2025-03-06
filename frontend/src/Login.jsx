/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import googleIcon from "./assets/google_img.png";

const images = [
  "src/assets/crimeSceneImg.jpg",
  "src/assets/cs1.jpg",
  "src/assets/cs2.jpg",
  "src/assets/cs3.jpg",
];

export default function Login() {
  const auth = useAuth();
  const login = auth?.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");

  // Auto-change background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login({ email, password });
    if (!result.success) {
      setError(result.error || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
    
  };

  return (
    <section className="relative w-full h-[100vh] flex justify-center items-center text-center px-6 overflow-hidden">
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
        <h2 className="text-4xl font-bold text-white">Welcome Back!</h2>
        <p className="text-gray-300 mt-3 text-lg">Sign in to continue</p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 text-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-5">
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

          {/* Buttons */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-4 bg-[#D83A3A] text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 hover:bg-[#B92B2B]"
          >
            Login
          </motion.button>
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-4 bg-white text-gray-700 font-semibold text-lg rounded-lg shadow-md transition-all duration-300 mt-4 flex items-center justify-center"
          >
            <img
              src={googleIcon}
              alt="Google"
              className="w-6 h-6 mr-2"
            />
            Continue with Google
          </motion.button>
        </form>

        {/* Sign-up Link */}
        <p className="text-gray-300 mt-5 text-lg">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-[#D83A3A] font-semibold hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
