import { Link } from "react-router-dom";
import { Fingerprint, Shield, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-[#07070a] z-20">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.26em] text-white/50">
              <span className="grid size-6 place-items-center rounded border border-amber-400/30 bg-amber-400/10 text-amber-300">
                <Fingerprint className="size-3.5" />
              </span>
              SceneSolver Labs
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white/90">
              The scene is the witness.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Zero-shot CLIP classification × ViT patch token salience. Automated forensic analysis for investigators before the tape comes down.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/50 sm:grid-cols-3">
            <Link to="/" className="transition-colors hover:text-amber-300">
              Home
            </Link>
            <Link to="/about" className="transition-colors hover:text-amber-300">
              Inside Engine
            </Link>
            <Link to="/upload" className="transition-colors hover:text-amber-300">
              Case Intake
            </Link>
            <Link to="/user" className="transition-colors hover:text-amber-300">
              My Archive
            </Link>
            <span className="flex items-center gap-1.5 text-white/30">
              <Cpu className="size-3 text-cyan-400/60" /> ViT-B/16
            </span>
            <span className="flex items-center gap-1.5 text-white/30">
              <Shield className="size-3 text-amber-400/60" /> CLIP 512-d
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>Forensic Demonstration Interface · Chain of custody metadata</span>
          <span>© {new Date().getFullYear()} SceneSolver. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
