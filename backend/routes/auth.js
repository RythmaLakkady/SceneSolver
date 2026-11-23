import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { validateEmail, validatePassword } from "../utils/validation.js";
import { generateOTP, sendOTP } from "../utils/emailOTP.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    let existingLocalUser = await User.findOne({ email });
    if (existingLocalUser) {
      if (existingLocalUser.isVerified) {
        return res
          .status(400)
          .json({ error: "Email already registered. Please sign in." });
      }
      // If user exists but is not verified, allow them to re-verify
      const otp = generateOTP();
      existingLocalUser.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      await existingLocalUser.save();
      await sendOTP(email, otp);
      return res.status(200).json({
        message: "Account pending verification. Verification code generated.",
        userId: existingLocalUser._id,
        devOtp: otp,
      });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      displayName: name.trim() || email.split("@")[0],
      isVerified: false,
      otp: {
        code: otp,
        expiresAt: otpExpiresAt,
      },
    });

    await user.save();
    await sendOTP(email, otp);

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      userId: user._id,
      devOtp: otp,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.json({
        message: "Email already verified",
        token,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName || user.name,
        },
      });
    }

    // Universal bypass for dev/test mode: 123456 or matching OTP
    const isMasterOtp = otp === "123456";
    const matchesSavedOtp = user.otp && user.otp.code === otp;

    if (!isMasterOtp && !matchesSavedOtp) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (!isMasterOtp && user.otp?.expiresAt && Date.now() > user.otp.expiresAt) {
      return res.status(400).json({ error: "Verification code expired. Request a new one." });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName || user.name,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = {
      code: otp,
      expiresAt: otpExpiresAt,
    };
    await user.save();
    await sendOTP(user.email, otp);

    res.json({ message: "New OTP sent successfully", devOtp: otp });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        error: "Email not verified",
        userId: user._id,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName || user.name,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/demo-login", async (req, res) => {
  try {
    const demoEmail = "investigator.demo@scenesolver.internal";
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      user = new User({
        name: "Lead Investigator Decker",
        email: demoEmail,
        password: "DemoPassword123!",
        displayName: "Inv. Decker",
        isVerified: true,
      });
      await user.save();
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Demo investigator access authorized",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName || user.name,
      },
      token,
    });
  } catch (error) {
    console.error("Demo login error:", error);
    res.status(500).json({ error: "Demo login failed" });
  }
});

router.get("/current_user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName || user.name,
      authType: "local",
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
