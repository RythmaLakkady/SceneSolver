/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import googleIcon from "./assets/google_img.png";
import { BACKEND_URL } from "./config";

// Import images correctly
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

export default function Login() {
  const auth = useAuth();
  const login = auth?.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate(); // Hook for navigation

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
    setLoading(true); // Start loading state

    const result = await login({ email, password });
    setLoading(false); // End loading state

    if (result.success) {
      // Redirect to dashboard or home page on success
      navigate("/"); // Use navigate for redirection
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    // Make sure the URL dynamically matches your environment (dev/prod)
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <section className="relative w-full h-screen flex flex-col text-center px-6 overflow-hidden">
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

      Header
      <header className="relative z-10 text-white text-2xl font-bold py-4">
        SceneSolver
      </header>

      {/* Login Box */}
      <div className="flex-grow flex justify-center items-center">
        <motion.div
          className="relative z-10 bg-white/10 backdrop-blur-lg p-10 rounded-xl shadow-xl max-w-md w-full"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-bold text-white">Welcome Back!</h2>
          <p className="text-gray-300 mt-3 text-lg">Log in to continue</p>

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
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-5 py-4 bg-[#D83A3A] text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 hover:bg-[#B92B2B] disabled:opacity-50"
            >
              {loading ? "Logging In..." : "Login"}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-white text-gray-700 font-semibold text-lg rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
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
      </div>
    </section>
  );
}
