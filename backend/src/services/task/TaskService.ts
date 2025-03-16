import mongoose, { Types } from "mongoose";
import { Task } from "../../models/Task";
import { TaskBody, TaskFilters, TaskQueryResult } from "./types";
import { NotificationService } from "../notification/NotificationService";

export class TaskService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async isOwner(userId: string, taskId: string) {
    const task = await Task.findOne({
      _id: taskId,
      owner: userId,
    });
    return !!task;
  }

  async getRights(userId: string, taskId: string) {
    const rights = {
      isAdmin: false,
      isShared: false,
    };
    const task = await Task.findOne({
      _id: taskId,
      $or: [{ owner: userId }, { sharedWith: userId }],
    });
    rights.isAdmin = !!(task?.owner.toString() === userId.toString());
    rights.isShared =
      rights.isAdmin ||
      !!task?.sharedWith?.some((user) => user.toString() === userId.toString());
    return rights;
  }

  async createTask(userId: string, taskData: TaskBody) {
    const task = new Task({
      ...taskData,
      owner: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await task.save();
    return task.populate("owner", "name email");
  }

  async getTasks(
    userId: string,
    filters: TaskFilters
  ): Promise<TaskQueryResult> {
    const match: any = {
      $or: [{ owner: userId }],
    };

    if (filters.status) match.status = filters.status;
    if (filters.priority) match.priority = filters.priority;
    if (filters.tag) match.tags = filters.tag;

    if (filters.search) {
      match.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    const sort: any = {};
    if (filters.sortBy) {
      const parts = filters.sortBy.split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const limit = filters.limit || 10;
    const skip = filters.skip || 0;

    const tasks = await Task.find(match)
      .populate("owner", "name email")
      .populate("sharedWith", "name email")
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const total = await Task.countDocuments(match);

    return {
      tasks,
      total,
      hasMore: total > skip + limit,
    };
  }

  async getTaskById(taskId: string, userId: string) {
    const task = await Task.findOne({
      _id: taskId,
      $or: [{ owner: userId }, { sharedWith: userId }],
    })
      .populate("owner", "name email")
      .populate("sharedWith", "name email");

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }

  async updateTask(
    taskId: string,
    ownerId: string,
    updates: Partial<TaskBody>
  ) {
    try {
      const task = await Task.findOne({ _id: taskId });
      if (!task) {
        throw new Error("Task not found");
      }

      // Update task
      Object.assign(task, updates);
      await task.save();

      // Notify shared users about the update
      for (const userId of task.sharedWith) {
        await this.notificationService.createNotification(
          userId.toString(),
          "TASK_UPDATED",
          `${task.title} has been updated`,
          { taskId: task._id, title: task.title, updates }
        );
      }

      return task;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  async deleteTask(taskId: string, ownerId: string) {
    try {
      const task = await Task.findOne({ _id: taskId, owner: ownerId });
      if (!task) {
        throw new Error("Task not found");
      }

      // Notify shared users about deletion
      for (const userId of task.sharedWith) {
        await this.notificationService.createNotification(
          userId.toString(),
          "TASK_DELETED",
          `${task.title} has been deleted`,
          { taskId: task._id, title: task.title }
        );
      }

      await task.deleteOne();
      return task;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  async shareTask(taskId: string, ownerId: string, targetUserId: string) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.owner.toString() !== ownerId) {
      throw new Error("Not authorized to share this task");
    }

    if (task.sharedWith.includes(targetUserId as any)) {
      throw new Error("Task already shared with this user");
    }

    task.sharedWith.push(targetUserId as any);
    await task.save();

    return task;
  }

  async shareTaskWithMultiple(
    taskId: string,
    ownerId: string,
    friendIds: string[]
  ) {
    try {
      const task = await Task.findOne({ _id: taskId, owner: ownerId });
      if (!task) {
        throw new Error("Task not found");
      }

      // Add new friends to sharedWith array
      task.sharedWith = [
        ...(task.sharedWith as mongoose.Types.ObjectId[]),
        ...friendIds.map((id) => new mongoose.Types.ObjectId(id)),
      ];
      await task.save();
      await task.populate("owner", "name email");
      await task.populate("sharedWith", "name email");

      // Create notifications for each friend
      for (const friendId of friendIds) {
        await this.notificationService.createNotification(
          friendId,
          "TASK_SHARED",
          `${task.title} has been shared with you`,
          { taskId: task._id, title: task.title }
        );
      }

      return task;
    } catch (error) {
      console.error("Error sharing task:", error);
      throw error;
    }
  }

  async getTasksSharedWithMe(userId: string) {
    const tasks = await Task.find({
      sharedWith: userId,
    })
      .populate("owner", "name email")
      .populate("sharedWith", "name email")
      .sort({ updatedAt: -1 });

    return tasks;
  }

  async getMySharedTasks(userId: string) {
    const tasks = await Task.find({
      owner: userId,
      sharedWith: { $exists: true, $not: { $size: 0 } },
    })
      .populate("owner", "name email")
      .populate("sharedWith", "name email")
      .sort({ updatedAt: -1 });

    return tasks;
  }

  async unshareTask(taskId: string, ownerId: string, friendIds: string[]) {
    try {
      const task = await Task.findOne({ _id: taskId, owner: ownerId });
      if (!task) {
        throw new Error("Task not found");
      }

      // Remove friends from sharedWith array
      task.sharedWith = task.sharedWith.filter(
        (id) => !friendIds.includes(id.toString())
      );
      await task.save();
      await task.populate("owner", "name email");
      await task.populate("sharedWith", "name email");

      // Create notifications for each friend
      for (const friendId of friendIds) {
        await this.notificationService.createNotification(
          friendId,
          "TASK_UNSHARED",
          `${task.title} is no longer shared with you`,
          { taskId: task._id, title: task.title }
        );
      }

      return task;
    } catch (error) {
      console.error("Error unsharing task:", error);
      throw error;
    }
  }

  async getTaskStats(userId: string) {
    try {
      const [total, completed, inProgress, pending, highPriority, dueSoon] =
        await Promise.all([
          // Total tasks
          Task.countDocuments({ owner: userId }),
          // Completed tasks
          Task.countDocuments({ owner: userId, status: "completed" }),
          // In progress tasks
          Task.countDocuments({ owner: userId, status: "in_progress" }),
          // Pending tasks
          Task.countDocuments({ owner: userId, status: "pending" }),
          // High priority tasks
          Task.countDocuments({ owner: userId, priority: "high" }),
          // Tasks due within 3 days
          Task.countDocuments({
            owner: userId,
            dueDate: {
              $gte: new Date(),
              $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
          }),
        ]);

      return {
        total,
        completed,
        inProgress,
        pending,
        highPriority,
        dueSoon,
      };
    } catch (error) {
      console.error("Error getting task statistics:", error);
      throw new Error("Failed to get task statistics");
    }
  }
}

export default TaskService;
