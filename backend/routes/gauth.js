import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import Guser from "../models/Guser.js";
import User from "../models/user.js";

const router = express.Router();

const logRequest = (req, res, next) => {
  console.log("Request path:", req.path);
  console.log("Session:", req.session);
  console.log("User:", req.user);
  next();
};

router.use(logRequest);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CORS_ORIGIN || "http://localhost:5173"}/login`,
    session: false,
  }),
  (req, res) => {
    try {
      const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      res.redirect(`${process.env.CORS_ORIGIN || "http://localhost:5173"}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect(`${process.env.CORS_ORIGIN || "http://localhost:5173"}/login`);
    }
  }
);

router.get("/current_user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await Guser.findById(decoded.userId);
    let authType = "google";

    // If not found in Guser, check User (local / demo user)
    if (!user) {
      user = await User.findById(decoded.userId);
      authType = "local";
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName || user.name,
      avatar: user.avatar,
      authType,
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
