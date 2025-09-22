import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const createToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment");
  }
  return jwt.sign({ id }, secret, {
    expiresIn: "3d",
  });
};
