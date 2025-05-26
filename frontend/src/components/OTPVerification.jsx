import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OTPVerification = ({ userId, onVerificationSuccess }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await verifyOTP(userId, otp);
      if (result.success) {
        onVerificationSuccess?.();
        navigate("/");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await resendOTP(userId);
      if (result.success) {
        setSuccess("New verification code sent successfully!");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-300/30">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Email Verification
      </h2>
      <p className="text-gray-300 text-center mb-6">
        Please enter the verification code sent to your email
      </p>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter verification code"
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-gray-600 focus:border-[#D83A3A] focus:outline-none"
            maxLength={6}
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {success && (
          <p className="text-green-400 text-sm text-center">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className={`w-full py-3 rounded-xl transition-all ${
            loading || otp.length !== 6
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-[#D83A3A] text-white hover:bg-[#B92B2B]"
          }`}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <button
          type="button"
          onClick={handleResendOTP}
          disabled={loading}
          className="w-full text-gray-400 text-sm hover:text-white transition-colors"
        >
          Didn't receive the code? Send again
        </button>
      </form>
    </div>
  );
};

export default OTPVerification;
