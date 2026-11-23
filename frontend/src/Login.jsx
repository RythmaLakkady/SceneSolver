import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { BACKEND_URL } from "./config";
import { Fingerprint, Lock, Mail, AlertCircle, Loader2, ArrowRight, Zap } from "lucide-react";
import googleIcon from "./assets/google_img.png";

export default function Login() {
  const auth = useAuth();
  const login = auth?.login;
  const demoLogin = auth?.demoLogin;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError("");
    setDemoLoading(true);
    try {
      const result = await demoLogin();
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Demo login failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="reveal w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c12]/90 p-8 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        {/* Header Icon & Title */}
        <div className="text-center">
          <div className="inline-grid size-12 place-items-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_-4px_rgba(251,191,36,0.3)]">
            <Fingerprint className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Investigator Access
          </h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-white/40">
            Sign in to SceneSolver Session
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5">
              Authorized Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@agency.gov"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-1.5">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-white/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
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
                <Loader2 className="size-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Authenticate <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Instant Demo Access */}
        <div className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber-300/80">
            Instant Test Mode (No Setup Required)
          </p>
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={demoLoading || loading}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 py-2.5 font-mono text-xs font-semibold text-amber-300 shadow-[0_0_15px_-3px_rgba(251,191,36,0.2)] transition-all hover:bg-amber-400/20 disabled:opacity-50"
          >
            {demoLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Authorizing Demo Session...
              </>
            ) : (
              <>
                <Zap className="size-3.5 fill-amber-300" /> 1-Click Demo Access (Skip Login)
              </>
            )}
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative bg-[#0b0c12] px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            or continue with
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/15 bg-white/[0.03] py-2.5 font-mono text-xs text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
        >
          <img src={googleIcon} alt="Google" className="size-4 object-contain" />
          Single Sign-On (Google)
        </button>

        {/* Signup Redirect */}
        <p className="mt-6 text-center font-mono text-xs text-white/40">
          Unregistered agency credentials?{" "}
          <Link to="/signup" className="text-amber-300 hover:underline">
            Register Dossier
          </Link>
        </p>
      </div>
    </div>
  );
}
