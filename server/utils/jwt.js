import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const createToken = (id, tokenVersion = 0) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment");
  }
  return jwt.sign({ id, v: tokenVersion }, secret, {
    expiresIn: "3d",
  });
};
