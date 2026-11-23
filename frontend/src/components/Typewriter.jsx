import { useState, useEffect } from "react";

export default function Typewriter({ text, speed = 8 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (!text) return;
    let index = 0;
    const id = setInterval(() => {
      index += 2;
      setCount(index);
      if (index >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  if (!text) return null;

  return (
    <span>
      {text.slice(0, count)}
      {count < text.length && <span className="animate-blink text-amber-300">▌</span>}
    </span>
  );
}
