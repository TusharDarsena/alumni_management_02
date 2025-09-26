import express from "express";
import {
  signup,
  login,
  logout,
  verifyUser,
  changePasswordFirst,
} from "../controllers/AuthController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", requireAuth, verifyUser);
router.post("/change-password-first", requireAuth, changePasswordFirst);

export default router;
