import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { BACKEND_URL } from "./config";
import OTPVerification from "./components/OTPVerification";
import { Fingerprint, Lock, Mail, User as UserIcon, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import googleIcon from "./assets/google_img.png";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signup({ email, password, name });
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Registration failed");
    } else {
      setUserId(result.userId);
      setDevOtp(result.devOtp);
      setShowOTP(true);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  if (showOTP) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <OTPVerification
          userId={userId}
          devOtp={devOtp}
          onVerificationSuccess={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="reveal w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c12]/90 p-8 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="text-center">
          <div className="inline-grid size-12 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_-4px_rgba(251,191,36,0.3)]">
            <Fingerprint className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Register Investigator
          </h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-white/40">
            Create an Authorized Account
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent John Doe"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@agency.gov"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#08080c] shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)] transition-all hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Provisioning...
              </>
            ) : (
              <>
                Create Account <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative bg-[#0b0c12] px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/15 bg-white/[0.03] py-2.5 font-mono text-xs text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
        >
          <img src={googleIcon} alt="Google" className="size-4 object-contain" />
          Single Sign-On (Google)
        </button>

        <p className="mt-6 text-center font-mono text-xs text-white/40">
          Already registered?{" "}
          <Link to="/login" className="text-amber-300 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
