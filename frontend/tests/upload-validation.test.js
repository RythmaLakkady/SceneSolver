import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Upload validation constraints", () => {
  function validateUploadFiles(files) {
    if (!files || files.length === 0) {
      return { valid: false, error: "No files selected" };
    }
    const videoFiles = files.filter((f) => f.type?.startsWith("video/"));
    if (videoFiles.length > 0) {
      if (files.length > 1) {
        return { valid: false, error: "Please upload only one video file at a time" };
      }
      return { valid: true, error: "" };
    }
    if (files.length < 4) {
      return { valid: false, error: "You must upload at least 4 images." };
    }
    if (files.length > 15) {
      return { valid: false, error: "You can upload a maximum of 15 images." };
    }
    return { valid: true, error: "" };
  }

  it("fails if file list is empty", () => {
    const res = validateUploadFiles([]);
    assert.equal(res.valid, false);
    assert.match(res.error, /No files/);
  });

  it("rejects fewer than 4 images", () => {
    const files = [
      { name: "img1.jpg", type: "image/jpeg" },
      { name: "img2.jpg", type: "image/jpeg" },
      { name: "img3.jpg", type: "image/jpeg" },
    ];
    const res = validateUploadFiles(files);
    assert.equal(res.valid, false);
    assert.match(res.error, /at least 4 images/);
  });

  it("accepts exactly 4 to 15 images", () => {
    const files = Array.from({ length: 4 }, (_, i) => ({
      name: `img${i}.jpg`,
      type: "image/jpeg",
    }));
    const res = validateUploadFiles(files);
    assert.equal(res.valid, true);
    assert.equal(res.error, "");
  });

  it("accepts a single video file", () => {
    const files = [{ name: "clip.mp4", type: "video/mp4" }];
    const res = validateUploadFiles(files);
    assert.equal(res.valid, true);
    assert.equal(res.error, "");
  });

  it("rejects multiple videos or mixing video with images", () => {
    const files = [
      { name: "clip.mp4", type: "video/mp4" },
      { name: "img.jpg", type: "image/jpeg" },
    ];
    const res = validateUploadFiles(files);
    assert.equal(res.valid, false);
    assert.match(res.error, /only one video/);
  });
});
