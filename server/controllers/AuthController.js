import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createToken } from "../utils/jwt.js";

const isStrongPassword = (pwd) => {
  if (typeof pwd !== "string") return false;
  if (pwd.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

export const signup = async (req, res) => {
  try {
    const { email, username, password: providedPassword, role } = req.body;
    console.log(`Signup attempt: email=${email}, role=${role}, providedPassword length=${providedPassword ? providedPassword.length : 'none'}`);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const mustChangePassword = role === "student";
    const defaultPasswordFlag = role === "student";  // renamed to avoid confusion

    const passwordToSet = role === "student" ? "DefaultPass123!" : providedPassword;
    console.log(`Setting password for role ${role}: using ${role === "student" ? "default" : "provided"} (length: ${passwordToSet.length})`);

    const user = await User.create({
      email: email.toLowerCase(),
      username,
      password: passwordToSet,
      role,
      mustChangePassword,
      defaultPassword: defaultPasswordFlag,
    });
    console.log(`User created: ${user._id}, role: ${user.role}, mustChangePassword: ${user.mustChangePassword}, defaultPassword: ${user.defaultPassword}`);

    const token = createToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res
      .status(201)
      .json({ message: "User signed up successfully", success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("User found in DB:", user ? `ID: ${user._id}, role: ${user.role}` : 'No user');
    if (!user)
      return res.status(400).json({ message: "Incorrect email or password" });

    const token = createToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "User logged in", success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
};

// Verify token
export const verifyUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ status: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user)
      return res.json({
        status: true,
        user: user.username,
        role: user.role,
        mustChangePassword: Boolean(user.mustChangePassword),
        defaultPassword: Boolean(user.defaultPassword),
      });
    else return res.json({ status: false });
  } catch (err) {
    return res.json({ status: false });
  }
};

export const changePasswordFirst = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid session" });

    if (!user.mustChangePassword || user.defaultPassword === false) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password change on first login not required",
        });
    }

    const { newPassword } = req.body || {};
    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }

    // Reject if new password equals current (default) password
    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password cannot be the same as the default password",
        });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password too weak. Use at least 8 characters with upper, lower, number, and special character.",
      });
    }

    user.password = newPassword; // pre-save hook will hash
    user.mustChangePassword = false;
    user.defaultPassword = false;
    await user.save();

    const refreshed = createToken(user._id);
    res.cookie("token", refreshed, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);
    if (err?.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid session" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
