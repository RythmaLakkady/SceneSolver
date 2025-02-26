import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import Guser from "../models/guser.js";

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
    failureRedirect: "http://localhost:5173/login",
    session: false,
  }),
  (req, res) => {
    try {
      const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("http://localhost:5173/login");
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
    const user = await Guser.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      authType: "google",
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Error logging out" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ error: "Error destroying session" });
      }
      res.clearCookie("sessionId");
      res.json({ message: "Logged out successfully" });
    });
  });
});

export default router;
