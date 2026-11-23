import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Fingerprint, UploadCloud, FolderArchive, LogOut, LogIn, User as UserIcon } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07] bg-[#08080c]/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Brand Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative grid size-9 place-items-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 transition-colors group-hover:border-amber-400/60">
            <Fingerprint className="size-5" strokeWidth={1.7} />
            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-mono text-[13px] font-bold tracking-[0.22em] text-white">
              SCENE<span className="text-amber-300">SOLVER</span>
            </span>
            <span className="mt-1 hidden font-mono text-[9px] tracking-[0.26em] text-white/40 sm:block">
              FORENSIC VISION ENGINE
            </span>
          </span>
        </Link>

        {/* Center Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            About
          </Link>

          {user && (
            <>
              <Link
                to="/upload"
                className="hidden rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex items-center gap-1.5"
              >
                <UploadCloud className="size-3.5 text-amber-300/80" />
                Upload
              </Link>
              <Link
                to="/user"
                className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 transition-colors hover:bg-white/5 hover:text-white inline-flex items-center gap-1.5"
              >
                <FolderArchive className="size-3.5 text-cyan-300/80" />
                Cases
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 lg:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Online
          </span>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/user"
                className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/80 transition-colors hover:border-amber-400/40 hover:text-amber-300"
              >
                <UserIcon className="size-3.5 text-amber-300" />
                <span className="max-w-[110px] truncate">{user.displayName || user.email?.split("@")[0] || "Investigator"}</span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-white/60 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-400 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#08080c] shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)] transition-colors hover:bg-amber-300"
            >
              <LogIn className="size-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
