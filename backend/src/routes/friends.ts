import express, { Request, Response, Router } from "express";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import mongoose from "mongoose";

const router: Router = express.Router();

interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: Array<{
    from: mongoose.Types.ObjectId;
    status: string;
  }>;
}

// Send friend request
router.post("/request", auth, async (req: Request, res: any) => {
  try {
    const { email } = req.body;
    const friend = (await User.findOne({ email })) as IUser;

    if (!friend) {
      return res.status(404).json({ error: "User not found" });
    }

    if (friend._id.toString() === req.user?._id.toString()) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if already friends
    if (req.user?.friends?.includes(friend._id)) {
      return res.status(400).json({ error: "Already friends with this user" });
    }

    // Check if request already exists
    const existingRequest = friend.friendRequests.find(
      (request) => request.from.toString() === req.user?._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    friend.friendRequests.push({
      from: req.user?._id as mongoose.Types.ObjectId,
      status: "pending",
    });

    await friend.save();
    res.json({ message: "Friend request sent successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error sending friend request" });
  }
});

// Accept/Reject friend request
router.patch("/request/:userId", auth, async (req: Request, res: any) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const request = req.user?.friendRequests?.find(
      (request) =>
        request.from.toString() === req.params.userId &&
        request.status === "pending"
    );

    if (!request) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    request.status = status;

    if (status === "accepted" && req.user) {
      // Add to friends list for both users
      if (!req.user.friends) {
        req.user.friends = [];
      }
      req.user.friends.push(new mongoose.Types.ObjectId(req.params.userId));
      const friend = await User.findById(req.params.userId);
      if (friend) {
        if (!friend.friends) {
          friend.friends = [];
        }
        friend.friends.push(req.user._id);
        await friend.save();
      }
    }

    await User.findByIdAndUpdate(req.user?._id, {
      friends: req.user?.friends,
      friendRequests: req.user?.friendRequests,
    });

    res.json({ message: `Friend request ${status}` });
  } catch (error) {
    res.status(400).json({ error: "Error processing friend request" });
  }
});
// Get friend requests
router.get("/requests", auth, async (req: Request, res: any) => {
  try {
    const user = await User.findById(req.user?._id).populate(
      "friendRequests.from",
      "name email"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ error: "Error fetching friend requests" });
  }
});

// Get friends list
router.get("/", auth, async (req: Request, res: any) => {
  try {
    const user = await User.findById(req.user?._id).populate(
      "friends",
      "name email"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: "Error fetching friends list" });
  }
});

export default router;
