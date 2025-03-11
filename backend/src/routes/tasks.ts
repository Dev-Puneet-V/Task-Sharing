import express, { Request, Response, Router } from "express";
import { auth } from "../middleware/auth";
import { Task } from "../models/Task";
import mongoose from "mongoose";

const router: Router = express.Router();

interface TaskBody {
  title: string;
  description: string;
  dueDate?: Date;
  priority?: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "completed";
  tags?: string[];
}

// Create a new task
router.post(
  "/",
  auth,
  async (req: Request<{}, {}, TaskBody>, res: Response) => {
    try {
      const task = new Task({
        ...req.body,
        owner: req.user?._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await task.save();
      await task.populate("owner", "name email");
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Error creating task" });
    }
  }
);

// Get all tasks with filters
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const match: any = {
      $or: [{ owner: req.user?._id }, { sharedWith: req.user?._id }],
    };

    // Filter by status
    if (req.query.status) {
      match.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      match.priority = req.query.priority;
    }

    // Filter by tags
    if (req.query.tag) {
      match.tags = req.query.tag;
    }

    // Search by title or description
    if (req.query.search) {
      match.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const sort: any = {};
    if (req.query.sortBy) {
      const parts = (req.query.sortBy as string).split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    } else {
      // Default sort by createdAt desc
      sort.createdAt = -1;
    }

    const tasks = await Task.find(match)
      .populate("owner", "name email")
      .populate("sharedWith", "name email")
      .sort(sort)
      .limit(parseInt(req.query.limit as string) || 10)
      .skip(parseInt(req.query.skip as string) || 0);

    const total = await Task.countDocuments(match);

    res.json({
      tasks,
      total,
      hasMore:
        total >
        (parseInt(req.query.skip as string) || 0) +
          (parseInt(req.query.limit as string) || 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// Get a specific task by ID
router.get("/:id", auth, async (req: Request, res: any) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user?._id }, { sharedWith: req.user?._id }],
    })
      .populate("owner", "name email")
      .populate("sharedWith", "name email");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Error fetching task" });
  }
});

// Update a task
router.patch("/:id", auth, async (req: Request, res: any) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user?._id }, { sharedWith: req.user?._id }],
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Only owner can update certain fields
    if (task.owner.toString() !== req.user?._id.toString()) {
      const allowedUpdates = ["status"];
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({ error: "Invalid updates" });
      }
    }

    Object.assign(task, { ...req.body, updatedAt: new Date() });
    await task.save();
    await task.populate("owner", "name email");
    await task.populate("sharedWith", "name email");

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: "Error updating task" });
  }
});

// Delete a task
router.delete("/:id", auth, async (req: Request, res: any) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user?._id,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", task });
  } catch (error) {
    res.status(500).json({ error: "Error deleting task" });
  }
});

// Share a task with another user
router.post("/:id/share", auth, async (req: Request, res: any) => {
  try {
    const { userId } = req.body;
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user?._id,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.sharedWith.includes(userId)) {
      return res
        .status(400)
        .json({ error: "Task already shared with this user" });
    }

    task.sharedWith.push(new mongoose.Types.ObjectId(userId));
    await task.save();
    await task.populate("owner", "name email");
    await task.populate("sharedWith", "name email");

    res.json(task);
  } catch (error) {
    res.status(400).json({ error: "Error sharing task" });
  }
});

export default router;
