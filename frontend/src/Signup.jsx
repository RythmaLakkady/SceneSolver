import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import OTPVerification from "./components/OTPVerification";

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

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    const result = await signup({
      email,
      password,
      name,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Signup failed");
    } else {
      setUserId(result.userId);
      setShowOTP(true);
    }
  };

  const handleVerificationSuccess = () => {
    navigate("/");
  };

  if (showOTP) {
    return (
      <section className="relative w-full min-h-screen flex flex-col items-center text-center px-6 overflow-hidden">
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

        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

        <header className="relative z-10 text-white text-3xl font-bold py-6">
          SceneSolver
        </header>

        <div className="flex-grow flex justify-center items-center w-full">
          <OTPVerification
            userId={userId}
            onVerificationSuccess={handleVerificationSuccess}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center text-center px-6 overflow-hidden">
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

      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

      <header className="relative z-10 text-white text-3xl font-bold py-6">
        SceneSolver
      </header>

      <div className="flex-grow flex justify-center items-center w-full">
        <motion.div
          className="relative z-10 bg-white/10 backdrop-blur-lg p-10 rounded-xl shadow-xl max-w-lg w-full mx-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-bold text-white">Create an Account</h2>
          <p className="text-gray-300 mt-3 text-lg">Sign up to get started</p>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <form onSubmit={handleSignup} className="mt-6 space-y-5">
            <input
              type="text"
              autoComplete="name"
              placeholder="Full Name"
              className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm Password"
              className="w-full px-5 py-4 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D83A3A]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-[#D83A3A] text-white font-semibold text-lg rounded-lg shadow-md transition-all duration-300 hover:bg-[#B92B2B] disabled:opacity-50"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </motion.button>

            <motion.button
              type="button"
              onClick={() =>
                (window.location.href = "http://localhost:5000/api/auth/google")
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-white text-gray-700 font-semibold text-lg rounded-lg shadow-md transition-all duration-300 flex items-center justify-center"
            >
              <img
                src="src/assets/google_img.png"
                alt="Google"
                className="w-6 h-6 mr-2"
              />
              Continue with Google
            </motion.button>
          </form>

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
      </div>
    </section>
  );
}
