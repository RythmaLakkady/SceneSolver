import { useEffect } from "react";

export default function AmbientFX() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (event) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
        document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden md:block"
        style={{
          background:
            "radial-gradient(540px circle at var(--mx, 50%) var(--my, 30%), rgba(251,191,36,0.065), transparent 65%)",
        }}
      />
      <div aria-hidden className="film-grain pointer-events-none fixed inset-0 z-50" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 5px)",
        }}
      />
    </>
  );
}
