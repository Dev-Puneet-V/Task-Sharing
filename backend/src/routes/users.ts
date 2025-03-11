import express, { Request, Response } from "express";
import { User, IUser } from "../models/User";
import { auth } from "../middleware/auth";

const router = express.Router();

// Get user by email
router.get("/email/:email", auth, async (req: Request, res: any) => {
  try {
    const { email } = req.params;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: "Please provide a valid email address",
      });
    }

    // Find user but exclude sensitive information
    const user: Omit<IUser, "password" | "__v"> | null = await User.findOne({ email }).select({
      password: 0,
      __v: 0,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "No user exists with this email address",
      });
    }

    // Check if the requesting user is searching for themselves
    const isSelf: Boolean = req.user?._id.toString() === user?._id?.toString();

    // Return different data based on whether it's the user themselves or another user
    const userData = isSelf
      ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          friends: user.friends,
          friendRequests: user.friendRequests,
        }
      : {
          _id: user._id,
          name: user.name,
          email: user.email,
        };

    res.json({
      message: "User found successfully",
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);

    if (error instanceof Error) {
      res.status(500).json({
        error: "Failed to fetch user",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch user",
        details: "An unexpected error occurred",
      });
    }
  }
});

export default router;
