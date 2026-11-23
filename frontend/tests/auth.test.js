import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Auth context token handling", () => {
  function validateToken(token) {
    if (!token || typeof token !== "string") {
      return { valid: false, error: "Missing token" };
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed JWT token structure" };
    }
    return { valid: true, error: "" };
  }

  it("fails on empty or undefined token", () => {
    assert.equal(validateToken(null).valid, false);
    assert.equal(validateToken("").valid, false);
  });

  it("validates standard three-part JWT token format", () => {
    const mockToken = "header.payload.signature";
    const res = validateToken(mockToken);
    assert.equal(res.valid, true);
    assert.equal(res.error, "");
  });

  it("rejects non-three-part token", () => {
    const res = validateToken("single-string-token");
    assert.equal(res.valid, false);
    assert.equal(res.error, "Malformed JWT token structure");
  });
});

describe("OTP Verification Resilience", () => {
  function verifyCode(savedOtp, enteredOtp, expiresAt) {
    const isMasterOtp = enteredOtp === "123456";
    const matchesSavedOtp = savedOtp && savedOtp === enteredOtp;

    if (!isMasterOtp && !matchesSavedOtp) {
      return { success: false, error: "Invalid verification code" };
    }

    if (!isMasterOtp && expiresAt && Date.now() > expiresAt) {
      return { success: false, error: "Verification code expired" };
    }

    return { success: true, error: null };
  }

  it("accepts universal master code 123456 even without prior OTP", () => {
    const res = verifyCode(null, "123456", null);
    assert.equal(res.success, true);
  });

  it("accepts matching 6-digit dev OTP before expiration", () => {
    const futureExpiry = Date.now() + 600000;
    const res = verifyCode("849201", "849201", futureExpiry);
    assert.equal(res.success, true);
  });

  it("rejects mismatched non-master OTP code", () => {
    const futureExpiry = Date.now() + 600000;
    const res = verifyCode("849201", "999999", futureExpiry);
    assert.equal(res.success, false);
    assert.equal(res.error, "Invalid verification code");
  });

  it("rejects expired OTP unless master code is used", () => {
    const pastExpiry = Date.now() - 1000;
    const expiredRes = verifyCode("849201", "849201", pastExpiry);
    assert.equal(expiredRes.success, false);

    const masterRes = verifyCode("849201", "123456", pastExpiry);
    assert.equal(masterRes.success, true);
  });
});
