import { useState, useEffect } from "react";

export default function ScrambleText({ text, className = "", delay = 0 }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplay("");
      return;
    }
    const chars = "ABCDEF0123456789#@%&*";
    let frame = 0;
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        frame += 1;
        const revealed = Math.floor(frame / 3);
        setDisplay(
          text
            .split("")
            .map((char, i) =>
              i < revealed || char === " "
                ? char
                : chars[Math.floor(Math.random() * chars.length)]
            )
            .join("")
        );
        if (revealed >= text.length) clearInterval(interval);
      }, 35);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);

  return <span className={className}>{display || text || "\u00A0"}</span>;
}
