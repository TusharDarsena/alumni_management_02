import express from "express";
import {
  signup,
  login,
  logout,
  verifyUser,
  changePasswordFirst,
  verifyOtp,
  resendOtp,
  updateProfile,
} from "../controllers/AuthController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/verify", requireAuth, verifyUser);
router.post("/change-password-first", requireAuth, changePasswordFirst);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.patch("/update-profile", requireAuth, updateProfile);

export default router;
