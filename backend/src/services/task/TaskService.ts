import mongoose, { Types } from "mongoose";
import { Task } from "../../models/Task";
import { TaskBody, TaskFilters, TaskQueryResult } from "./types";

export class TaskService {
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

  async updateTask(taskId: string, userId: string, updates: Partial<TaskBody>) {
    const task = await Task.findOne({
      _id: taskId,
      $or: [{ owner: userId }, { sharedWith: userId }],
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Only owner can update certain fields
    if (task.owner.toString() !== userId.toString()) {
      const allowedUpdates = ["status"];
      const updateFields = Object.keys(updates);
      const isValidOperation = updateFields.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        throw new Error("Invalid updates");
      }
    }

    Object.assign(task, { ...updates, updatedAt: new Date() });
    await task.save();
    await task.populate("owner", "name email");
    await task.populate("sharedWith", "name email");

    return task;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await Task.findOneAndDelete({
      _id: taskId,
      owner: userId,
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
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
    const task = await Task.findById(taskId).populate(
      "owner",
      "_id name email"
    );
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.owner._id.toString() !== ownerId.toString()) {
      throw new Error("Not authorized to share this task");
    }

    // Filter out friends who already have the task shared with them
    const newFriendIds = friendIds.filter(
      (friendId) => !task.sharedWith.includes(friendId as any)
    );

    if (newFriendIds.length > 0) {
      task.sharedWith.push(...(newFriendIds as any[]));
      await task.save();
      await task.populate("sharedWith", "name email");
    }

    return task;
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
    const task = await Task.findOne({
      _id: taskId,
      owner: ownerId,
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Remove the specified friends from sharedWith array
    task.sharedWith = task.sharedWith.filter(
      (userId) => !friendIds.includes(userId.toString())
    );

    await task.save();
    await task.populate("owner", "name email");
    await task.populate("sharedWith", "name email");

    return task;
  }
}

export default TaskService;
