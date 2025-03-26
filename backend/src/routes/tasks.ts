import express, { Request, Response, Router } from "express";
import { auth } from "../middleware/auth";
import { TaskService } from "../services/task/TaskService";
import { TaskBody } from "../services/task/types";
import { Task } from "../models/Task";

const router: Router = express.Router();
const taskService = new TaskService();

router.get("/stats", auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id as unknown as string;
    const stats = await taskService.getTaskStats(userId);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching task statistics" });
  }
});

// Create a new task
router.post(
  "/",
  auth,
  async (req: Request<{}, {}, TaskBody>, res: Response) => {
    try {
      const task = await taskService.createTask(
        req.user?._id as unknown as string,
        req.body
      );
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Error creating task" });
    }
  }
);

// Get all tasks with filters
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      search,
      sortBy = "createdAt:desc",
      limit = 10,
      skip = 0,
    } = req.query;

    // Build query
    const query: any = {
      $or: [{ owner: req.user?._id }, { sharedWith: req.user?._id }],
    };

    // Add filters
    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // Add search
    if (search && typeof search === "string") {
      query.$text = { $search: search };
    }

    // Parse sort parameters
    const [sortField, sortDirection] = (sortBy as string).split(":");

    // Execute query
    const tasks = await Task.find(query)
      .sort({ [sortField]: sortDirection === "desc" ? -1 : 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("owner", "name email")
      .populate("sharedWith", "name email");

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      total,
      hasMore: total > Number(skip) + Number(limit),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// Get a specific task by ID
router.get("/:id", auth, async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskById(
      req.params.id,
      req.user?._id as unknown as string
    );
    res.json(task);
  } catch (error: any) {
    if (error.message === "Task not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error fetching task" });
    }
  }
});

// Update a task
router.patch("/:id", auth, async (req: Request, res: Response) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.user?._id as unknown as string,
      req.body
    );
    res.json(task);
  } catch (error: any) {
    console.log(error);
    if (error.message === "Task not found") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "Invalid updates") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "Error updating task" });
    }
  }
});

// Delete a task
router.delete("/:id", auth, async (req: Request, res: Response) => {
  try {
    const task = await taskService.deleteTask(
      req.params.id,
      req.user?._id as unknown as string
    );
    res.json({ message: "Task deleted successfully", task });
  } catch (error: any) {
    if (error.message === "Task not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error deleting task" });
    }
  }
});

// Share a task with another user
router.post("/:id/share", auth, async (req: Request, res: Response) => {
  try {
    const task = await taskService.shareTask(
      req.params.id,
      req.user?._id as unknown as string,
      req.body.userId
    );
    res.json(task);
  } catch (error: any) {
    if (error.message === "Task not found") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "Task already shared with this user") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "Error sharing task" });
    }
  }
});

export default router;
