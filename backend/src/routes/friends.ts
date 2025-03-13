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
    res.json({
      success: true,
      message: "Friend request sent successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: error.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to send friend request",
        error: error.message,
      });
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
    res.json({
      success: true,
      message: `Friend request ${req.body.status} successfully`,
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Friend request not found") {
      res.status(404).json({
        success: false,
        message: "Friend request not found",
        error: error.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to process friend request",
        error: error.message,
      });
    }
  }
});

// Get friend requests
router.get("/requests", auth, async (req: Request, res: Response) => {
  try {
    const requests = await friendService.getFriendRequests(
      req.user?._id as unknown as string
    );
    res.json({
      success: true,
      message: "Friend requests retrieved successfully",
      data: requests,
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch friend requests",
        error: error.message,
      });
    }
  }
});

// Get friends list
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const friends = await friendService.getFriendsList(
      req.user?._id as unknown as string
    );
    res.json({
      success: true,
      message: "Friends list retrieved successfully",
      data: friends,
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch friends list",
        error: error.message,
      });
    }
  }
});

// Search for potential friends by email or name
router.get("/new", auth, async (req: Request, res: any) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        error: "Please provide a search term (email or name)",
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
        success: false,
        message: "No users found",
        error: result.message,
      });
    }

    res.json({
      success: true,
      message: "Potential friends found successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error finding potential friends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to find potential friends",
      error:
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
    res.json({
      success: true,
      message: "Current friends list retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching friends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch friends",
      error:
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
    res.json({
      success: true,
      message: "Shared tasks retrieved successfully",
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shared tasks",
      error: error.message,
    });
  }
});

// Get my tasks that I've shared with others
router.get("/my-shared-tasks", auth, async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getMySharedTasks(
      req.user?._id as unknown as string
    );
    res.json({
      success: true,
      message: "My shared tasks retrieved successfully",
      data: tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shared tasks",
      error: error.message,
    });
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
      res.json({
        success: true,
        message: "Task unshared successfully",
        data: task,
      });
    } catch (error: any) {
      if (error.message === "Task not found") {
        res.status(404).json({
          success: false,
          message: "Task not found",
          error: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to unshare task",
          error: error.message,
        });
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
    res.json({
      success: true,
      message: "Friend removed successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Friend not found") {
      res.status(404).json({
        success: false,
        message: "Friend not found",
        error: error.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to remove friend",
        error: error.message,
      });
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
      res.json({
        success: true,
        message: "Task shared successfully",
        data: task,
      });
    } catch (error: any) {
      if (error.message === "Task not found") {
        res.status(404).json({
          success: false,
          message: "Task not found",
          error: error.message,
        });
      } else if (error.message === "Task already shared with this user") {
        res.status(400).json({
          success: false,
          message: "Task already shared with this user",
          error: error.message,
        });
      } else {
        console.error("Error sharing task:", error);
        res.status(400).json({
          success: false,
          message: "Failed to share task",
          error: error.message,
        });
      }
    }
  }
);

export default router;
