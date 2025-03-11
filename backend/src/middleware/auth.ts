import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import mongoose from "mongoose";

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { _id: string };

    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error("User not found");
    }

    req.user = {
      _id: new mongoose.Types.ObjectId(user?._id as string),
      friends: user.friends,
      friendRequests: user.friendRequests,
      sentFriendRequests: user.sentFriendRequests,
    };
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate." });
  }
};
