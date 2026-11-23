import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and tailwind-merge.
 * @param  {...any} inputs - Class names or expressions
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats byte values into human-readable strings.
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "2.4 MB")
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Parses Gemini structured output text into header and content blocks.
 * @param {string} text - Raw Gemini output text
 * @returns {Array<{ header: string, content: string[] }>}
 */
export function parseGeminiSections(text) {
  if (!text || typeof text !== "string") return [];
  const sections = text
    .split(/(?=(?:^|\n)[A-Z][A-Z0-9_\s]+:)/)
    .filter((s) => s.trim());
  return sections
    .map((section) => {
      const lines = section.trim().split("\n");
      const headerLine = lines[0] || "";
      const content = lines.slice(1);
      const cleanHeader = headerLine.replace(/[:*#]+/g, "").trim();
      return {
        header: cleanHeader,
        lines: content.map((l) => l.trim()).filter(Boolean),
      };
    })
    .filter((s) => s.header);
}
