import express, { Request, Response, Router } from "express";
import { auth } from "../middleware/auth";
import { FriendService } from "../services/friend/FriendService";
import { TaskService } from "../services/task/TaskService";

const router: Router = express.Router();
const friendService = new FriendService();
const taskService = new TaskService();

// Send friend request
router.post("/request", auth, async (req: Request, res: Response) => {
  try {
    const result = await friendService.sendFriendRequest(
      req.user?._id as unknown as string,
      req.body.email
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Accept/Reject friend request
router.patch("/request/:userId", auth, async (req: Request, res: Response) => {
  try {
    const result = await friendService.respondToFriendRequest(
      req.user?._id as unknown as string,
      req.params.userId,
      req.body.status
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "Friend request not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Get friend requests
router.get("/requests", auth, async (req: Request, res: Response) => {
  try {
    const requests = await friendService.getFriendRequests(
      req.user?._id as unknown as string
    );
    res.json(requests);
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error fetching friend requests" });
    }
  }
});

// Get friends list
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const friends = await friendService.getFriendsList(
      req.user?._id as unknown as string
    );
    res.json(friends);
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error fetching friends list" });
    }
  }
});

// Search for potential friends by email or name
router.get("/new", auth, async (req: Request, res: any) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        details: "Please provide a search term (email or name)",
      });
    }

    const result = await friendService.searchPotentialFriends(
      req.user?._id as unknown as string,
      {
        query,
        limit: 10,
      }
    );

    if (result.users.length === 0) {
      return res.status(404).json({
        error: "No users found",
        details: result.message,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error finding potential friends:", error);
    res.status(500).json({
      error: "Failed to find potential friends",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Get current friends list (for task sharing)
router.get("/list", auth, async (req: Request, res: Response) => {
  try {
    const result = await friendService.getCurrentFriends(
      req.user?._id as unknown as string
    );
    res.json(result);
  } catch (error: any) {
    console.error("Error fetching friends:", error);
    res.status(500).json({
      error: "Failed to fetch friends",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
});

// Get tasks shared with me
router.get("/shared-tasks", auth, async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getTasksSharedWithMe(
      req.user?._id as unknown as string
    );
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching shared tasks" });
  }
});

// Get my tasks that I've shared with others
router.get("/my-shared-tasks", auth, async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getMySharedTasks(
      req.user?._id as unknown as string
    );
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: "Error fetching shared tasks" });
  }
});

// Unshare task with friends
router.delete(
  "/unshare-task/:taskId",
  auth,
  async (req: Request, res: Response) => {
    try {
      const { friendIds } = req.body;
      const task = await taskService.unshareTask(
        req.params.taskId,
        req.user?._id as unknown as string,
        friendIds
      );
      res.json({ message: "Task unshared successfully", task });
    } catch (error: any) {
      if (error.message === "Task not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Error unsharing task" });
      }
    }
  }
);

// Remove friend
router.delete("/:friendId", auth, async (req: Request, res: Response) => {
  try {
    const result = await friendService.removeFriend(
      req.user?._id as unknown as string,
      req.params.friendId
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === "Friend not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: "Error removing friend" });
    }
  }
});

// Share task with friends
router.post(
  "/share-task/:taskId",
  auth,
  async (req: Request, res: Response) => {
    try {
      const { friendIds } = req.body;
      const task = await taskService.shareTaskWithMultiple(
        req.params.taskId,
        req.user?._id as unknown as string,
        friendIds
      );
      res.json({ message: "Task unshared successfully", task });
    } catch (error: any) {
      if (error.message === "Task not found") {
        res.status(404).json({ error: error.message });
      } else if (error.message === "Task already shared with this user") {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Error sharing task:", error);
        res.status(400).json({ error: "Error sharing task" });
      }
    }
  }
);

export default router;
