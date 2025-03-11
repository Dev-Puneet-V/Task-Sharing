import express, { Request, Response, Router } from "express";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import mongoose from "mongoose";
import { Task } from "../models/Task";

const router: Router = express.Router();

interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: Array<{
    from: mongoose.Types.ObjectId;
    status: string;
  }>;
  sentFriendRequests: Array<{
    to: mongoose.Types.ObjectId;
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

    const existingSentRequest = friend.sentFriendRequests.find(
      (request) => request.to.toString() === req.user?._id.toString()
    );

    if (existingSentRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    friend.friendRequests.push({
      from: req.user?._id as mongoose.Types.ObjectId,
      status: "pending",
    });
    await User.findByIdAndUpdate(req.user?._id, {
      sentFriendRequests: [
        ...(req.user?.sentFriendRequests || []),
        {
          to: friend._id as mongoose.Types.ObjectId,
          status: "pending",
        },
      ],
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
        const sentRequest = friend.sentFriendRequests?.find(
          (request) => request.to.toString() === req.user?._id.toString()
        );
        if (sentRequest) {
          sentRequest.status = "accepted";
        }
        await friend.save();
      }
    } else if (status === "rejected") {
      const sentRequest = req.user?.sentFriendRequests?.find(
        (request) => request.to.toString() === req.params.userId
      );
      if (sentRequest) {
        sentRequest.status = "rejected";
      }
      const friend = await User.findById(req.params.userId);
      if (friend) {
        const sentRequest = friend.sentFriendRequests?.find(
          (request) => request.to.toString() === req.user?._id.toString()
        );
        if (sentRequest) {
          sentRequest.status = "rejected";
        }
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
      "_id name email"
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
      "_id name email"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: "Error fetching friends list" });
  }
});

// Search for potential friends by email or name
router.get("/new", auth, async (req: Request, res: any) => {
  try {
    const { query } = req.query;

    // Validate if search query is provided
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        details: "Please provide a search term (email or name)",
      });
    }

    const currentUser = await User.findById(req.user?._id);
    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        details: "Current user not found",
      });
    }

    // Get IDs to exclude
    const friendIds = currentUser.friends || [];
    const pendingRequestIds = currentUser.friendRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.from);

    const sentRequestIds = currentUser.sentFriendRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.to);

    // Find users by email or name who are not already friends or have pending requests
    const potentialFriends = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } }, // Case insensitive email search
        { name: { $regex: query, $options: "i" } }, // Case insensitive name search
      ],
      _id: {
        $nin: [
          req.user?._id, // Exclude self
          ...friendIds, // Exclude current friends
          ...pendingRequestIds, // Exclude users with pending requests
          ...sentRequestIds, // Exclude users with pending requests
        ],
      },
    })
      .select("name email")
      .limit(10); // Limit results to prevent large responses

    if (potentialFriends.length === 0) {
      return res.status(404).json({
        error: "No users found",
        details:
          "No matching users found or they might already be your friends",
      });
    }

    res.json({
      message: "Potential friends found successfully",
      users: potentialFriends,
    });
  } catch (error) {
    console.error("Error finding potential friends:", error);
    res.status(500).json({
      error: "Failed to find potential friends",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// 2. Get current friends list (for task sharing)
router.get("/list", auth, async (req: Request, res: any) => {
  try {
    const currentUser = await User.findById(req.user?._id).populate(
      "friends",
      "name email"
    );

    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        details: "Current user not found",
      });
    }

    const validFriends = currentUser.friends.filter(
      (friend) => friend !== null
    );

    res.json({
      message: "Friends fetched successfully",
      friends: validFriends,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({
      error: "Failed to fetch friends",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// 3. Search within friends (for task sharing)
router.get("/search", auth, async (req: Request, res: any) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Invalid search query",
        details: "Please provide a search term",
      });
    }

    const currentUser = await User.findById(req.user?._id).populate({
      path: "friends",
      match: {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
      select: "name email",
    });

    if (!currentUser) {
      return res.status(404).json({
        error: "User not found",
        details: "Current user not found",
      });
    }

    const matchingFriends = currentUser.friends.filter(
      (friend) => friend !== null
    );

    res.json({
      message: "Friends search completed",
      friends: matchingFriends,
    });
  } catch (error) {
    console.error("Error searching friends:", error);
    res.status(500).json({
      error: "Failed to search friends",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Remove friend
router.delete("/:friendId", auth, async (req: Request, res: any) => {
  try {
    const { friendId } = req.params;

    // Remove friend from current user's friends list
    await User.findByIdAndUpdate(req.user?._id, {
      $pull: { friends: friendId },
    });

    // Remove current user from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.user?._id },
    });

    res.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      error: "Failed to remove friend",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Share task with friend
router.post("/share-task/:taskId", auth, async (req: Request, res: any) => {
  try {
    const { taskId } = req.params;
    const { friendIds } = req.body;

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        details: "Please provide at least one friend to share with",
      });
    }

    // Verify all friendIds are actually friends
    const currentUser = await User.findById(req.user?._id);
    const invalidFriends = friendIds.filter(
      (id) => !currentUser?.friends.includes(id)
    );

    if (invalidFriends.length > 0) {
      return res.status(400).json({
        error: "Invalid friends",
        details: "Some users are not in your friends list",
      });
    }

    // Update task to include new shared users
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $addToSet: { sharedWith: { $each: friendIds } },
      },
      { new: true }
    ).populate("sharedWith", "name email");

    if (!updatedTask) {
      return res.status(404).json({
        error: "Task not found",
        details: "The specified task does not exist",
      });
    }

    res.json({
      message: "Task shared successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error sharing task:", error);
    res.status(500).json({
      error: "Failed to share task",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Remove task sharing for specific friends
router.delete("/unshare-task/:taskId", auth, async (req: Request, res: any) => {
  try {
    const { taskId } = req.params;
    const { friendIds } = req.body;

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        details: "Please provide at least one friend to unshare with",
      });
    }

    // Update task to remove shared users
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $pull: { sharedWith: { $in: friendIds } },
      },
      { new: true }
    ).populate("sharedWith", "name email");

    if (!updatedTask) {
      return res.status(404).json({
        error: "Task not found",
        details: "The specified task does not exist",
      });
    }

    res.json({
      message: "Task sharing removed successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error removing task sharing:", error);
    res.status(500).json({
      error: "Failed to remove task sharing",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Get tasks shared with me
router.get("/shared-tasks", auth, async (req: Request, res: any) => {
  try {
    const sharedTasks = await Task.find({
      sharedWith: req.user?._id,
    })
      .populate("owner", "name email")
      .populate("sharedWith", "name email");

    res.json({
      message: "Shared tasks fetched successfully",
      tasks: sharedTasks,
    });
  } catch (error) {
    console.error("Error fetching shared tasks:", error);
    res.status(500).json({
      error: "Failed to fetch shared tasks",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Get tasks I've shared with others
router.get("/my-shared-tasks", auth, async (req: Request, res: any) => {
  try {
    const sharedTasks = await Task.find({
      owner: req.user?._id,
      sharedWith: { $exists: true, $not: { $size: 0 } },
    })
      .populate("owner", "name email")
      .populate("sharedWith", "name email");

    res.json({
      message: "My shared tasks fetched successfully",
      tasks: sharedTasks,
    });
  } catch (error) {
    console.error("Error fetching my shared tasks:", error);
    res.status(500).json({
      error: "Failed to fetch my shared tasks",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

export default router;
