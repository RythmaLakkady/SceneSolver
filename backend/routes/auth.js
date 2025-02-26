import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Guser from "../models/guser.js";
import { validateEmail, validatePassword } from "../utils/validation.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    console.log("Register request body:", req.body); // Add logging
    const { email, password, displayName } = req.body;

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

    const user = new User({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Login request body:", req.body); // Add logging
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
    res.status(500).json({ error: "Server error during login" });
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
