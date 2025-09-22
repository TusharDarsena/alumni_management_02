import jwt from "jsonwebtoken";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { createToken } from "../utils/jwt.js";

export const signup = async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const mustChangePassword = role === "student";
    const defaultPassword = role === "student";

    const user = await User.create({
      email,
      username,
      password,
      role,
      mustChangePassword,
      defaultPassword,
    });

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
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Incorrect email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
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
      return res.json({ status: true, user: user.username, role: user.role });
    else return res.json({ status: false });
  } catch (err) {
    return res.json({ status: false });
  }
};
