import jwt from "jsonwebtoken";
import config from "../config";

export const verifyToken = async (token: string): Promise<string | null> => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { _id: string };
    return decoded._id;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
};
