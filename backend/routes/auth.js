import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { validateEmail, validatePassword } from "../utils/validation.js";
import { generateOTP, sendOTP } from "../utils/emailOTP.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    console.log("Register request body:", JSON.stringify(req.body, null, 2));
    console.log("Headers:", req.headers);
    const { email, password, name } = req.body;

    console.log("Extracted values:", { email, password, name });

    if (!name) {
      console.log("Name validation failed - name is missing");
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

    const existingLocalUser = await User.findOne({ email });
    if (existingLocalUser) {
      return res
        .status(400)
        .json({ error: "Email already registered for local login" });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      name,
      email,
      password,
      displayName: name || email.split("@")[0],
      isVerified: false,
      otp: {
        code: otp,
        expiresAt: otpExpiresAt,
      },
    });

    await user.save();

    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
      await User.findByIdAndDelete(user._id);
      return res
        .status(500)
        .json({ error: "Failed to send verification email" });
    }

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      userId: user._id,
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
      return res.status(400).json({ error: "Email already verified" });
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ error: "No OTP found" });
    }

    if (Date.now() > user.otp.expiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
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
        displayName: user.displayName,
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

    const emailSent = await sendOTP(user.email, otp);
    if (!emailSent) {
      return res
        .status(500)
        .json({ error: "Failed to send verification email" });
    }

    res.json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Found user:", {
      email: user.email,
      hasPassword: !!user.password,
    });

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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
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
      displayName: user.displayName,
      authType: "local",
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
