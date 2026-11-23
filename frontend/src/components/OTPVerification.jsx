import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, AlertCircle, Loader2, RefreshCw, Zap } from "lucide-react";

export default function OTPVerification({ userId, devOtp, onVerificationSuccess }) {
  const [otp, setOtp] = useState(devOtp || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDevOtp, setCurrentDevOtp] = useState(devOtp || "123456");
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
        setError(result.error || "Verification failed");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await resendOTP(userId);
      if (result.success) {
        if (result.devOtp) {
          setCurrentDevOtp(result.devOtp);
          setOtp(result.devOtp);
        }
        setSuccess("New verification code dispatched.");
      } else {
        setError(result.error || "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reveal w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c12] p-8 shadow-2xl">
      <div className="text-center">
        <div className="inline-grid size-12 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
          <ShieldCheck className="size-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Security Verification
        </h2>
        <p className="mt-1 font-mono text-xs text-white/40">
          Enter the 6-digit verification clearance code
        </p>
      </div>

      {/* Dev Mode Banner with 1-click Auto-Fill */}
      <div className="mt-5 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-center">
        <p className="font-mono text-[11px] text-amber-300 flex items-center justify-center gap-1.5 font-semibold">
          <Zap className="size-3.5 fill-amber-300" /> Dev Mode Active: No Email Setup Needed
        </p>
        <p className="mt-1 font-mono text-[10px] text-white/70">
          Your code is: <span className="font-bold text-amber-300 tracking-wider text-xs">{currentDevOtp}</span>
        </p>
        <button
          type="button"
          onClick={() => setOtp(currentDevOtp)}
          className="mt-2 inline-flex items-center gap-1 rounded border border-amber-400/40 bg-amber-400/20 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-300 hover:bg-amber-400/30"
        >
          Auto-fill Code
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 font-mono text-xs text-rose-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 font-mono text-xs text-emerald-300">
          <ShieldCheck className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="mt-6 space-y-4">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5 text-center">
            Verification Code
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-lg border border-white/10 bg-black/40 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#08080c] shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)] hover:bg-amber-300 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Verifying...
            </>
          ) : (
            "Confirm Authorization"
          )}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
        >
          <RefreshCw className="size-3" /> Resend Verification Code
        </button>
      </form>
    </div>
  );
}
