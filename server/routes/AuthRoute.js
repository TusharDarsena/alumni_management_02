import express from "express";
import {
  signup,
  login,
  logout,
  verifyUser,
  changePasswordFirst,
  verifyOtp,
  resendOtp,
  sendVerification,
  setPassword,
  resendVerification,
} from "../controllers/AuthController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/verify", verifyHandler);
router.post("/change-password-first", requireAuth, changePasswordFirst);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// New verification endpoints
router.post("/send-verification", sendVerification);
router.post("/set-password", setPassword);
router.post("/resend-verification", resendVerification);

// Profile update endpoint
router.patch("/update-profile", requireAuth, updateProfile);

export default router;
