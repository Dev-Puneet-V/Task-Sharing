import express, { Request, Response, Router } from "express";
import { auth } from "../middleware/auth";
import { TaskService } from "../services/task/TaskService";
import { TaskBody } from "../services/task/types";

const router: Router = express.Router();
const taskService = new TaskService();

// Create a new task
router.post(
  "/",
  auth,
  async (req: Request<{}, {}, TaskBody>, res: Response) => {
    try {
      const task = await taskService.createTask(req.user?._id as unknown as string, req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Error creating task" });
    }
  }
);

// Get all tasks with filters
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const result = await taskService.getTasks(req.user?._id as unknown as string, {
      status: req.query.status as string,
      priority: req.query.priority as string,
      tag: req.query.tag as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      limit: parseInt(req.query.limit as string),
      skip: parseInt(req.query.skip as string),
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// Get a specific task by ID
router.get("/:id", auth, async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user?._id as unknown as string);
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
    const task = await taskService.deleteTask(req.params.id, req.user?._id as unknown as string);
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
