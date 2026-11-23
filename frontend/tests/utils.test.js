import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cn, formatBytes, parseGeminiSections } from "../src/lib/utils.js";

describe("Utils - cn()", () => {
  it("merges multiple class names correctly", () => {
    const result = cn("p-4", "text-white", false && "hidden", "bg-black");
    assert.equal(result, "p-4 text-white bg-black");
  });

  it("handles tailwind class conflicts using last-wins resolution", () => {
    const result = cn("text-white", "text-amber-400");
    assert.equal(result, "text-amber-400");
  });

  it("handles empty or falsy inputs gracefully", () => {
    assert.equal(cn("", null, undefined, false), "");
  });
});

describe("Utils - formatBytes()", () => {
  it("formats zero bytes", () => {
    assert.equal(formatBytes(0), "0 B");
  });

  it("formats kilobytes and megabytes", () => {
    assert.equal(formatBytes(1024), "1 KB");
    assert.equal(formatBytes(1024 * 1024 * 2.5), "2.5 MB");
  });
});

describe("Utils - parseGeminiSections()", () => {
  it("handles empty or null text", () => {
    assert.deepEqual(parseGeminiSections(""), []);
    assert.deepEqual(parseGeminiSections(null), []);
  });

  it("parses structured headers and content lines", () => {
    const input = `INCIDENT SUMMARY:
The scene is a suspected burglary with forced rear entry.
Points of interest include pry marks.

RECOMMENDED ACTIONS:
- Recover tool mark impressions
- Check CCTV footage`;

    const sections = parseGeminiSections(input);
    assert.equal(sections.length, 2);
    assert.equal(sections[0].header, "INCIDENT SUMMARY");
    assert.equal(sections[0].lines.length, 2);
    assert.equal(sections[1].header, "RECOMMENDED ACTIONS");
    assert.equal(sections[1].lines.length, 2);
  });
});
