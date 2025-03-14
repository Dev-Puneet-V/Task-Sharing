"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const Task_1 = require("../../models/Task");
class TaskService {
    createTask(userId, taskData) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = new Task_1.Task(Object.assign(Object.assign({}, taskData), { owner: userId, createdAt: new Date(), updatedAt: new Date() }));
            yield task.save();
            return task.populate("owner", "name email");
        });
    }
    getTasks(userId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = {
                $or: [{ owner: userId }],
            };
            if (filters.status)
                match.status = filters.status;
            if (filters.priority)
                match.priority = filters.priority;
            if (filters.tag)
                match.tags = filters.tag;
            if (filters.search) {
                match.$or = [
                    { title: { $regex: filters.search, $options: "i" } },
                    { description: { $regex: filters.search, $options: "i" } },
                ];
            }
            const sort = {};
            if (filters.sortBy) {
                const parts = filters.sortBy.split(":");
                sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
            }
            else {
                sort.createdAt = -1;
            }
            const limit = filters.limit || 10;
            const skip = filters.skip || 0;
            const tasks = yield Task_1.Task.find(match)
                .populate("owner", "name email")
                .populate("sharedWith", "name email")
                .sort(sort)
                .limit(limit)
                .skip(skip);
            const total = yield Task_1.Task.countDocuments(match);
            return {
                tasks,
                total,
                hasMore: total > skip + limit,
            };
        });
    }
    getTaskById(taskId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findOne({
                _id: taskId,
                $or: [{ owner: userId }, { sharedWith: userId }],
            })
                .populate("owner", "name email")
                .populate("sharedWith", "name email");
            if (!task) {
                throw new Error("Task not found");
            }
            return task;
        });
    }
    updateTask(taskId, userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findOne({
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
                const isValidOperation = updateFields.every((update) => allowedUpdates.includes(update));
                if (!isValidOperation) {
                    throw new Error("Invalid updates");
                }
            }
            Object.assign(task, Object.assign(Object.assign({}, updates), { updatedAt: new Date() }));
            yield task.save();
            yield task.populate("owner", "name email");
            yield task.populate("sharedWith", "name email");
            return task;
        });
    }
    deleteTask(taskId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findOneAndDelete({
                _id: taskId,
                owner: userId,
            });
            if (!task) {
                throw new Error("Task not found");
            }
            return task;
        });
    }
    shareTask(taskId, ownerId, targetUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findById(taskId);
            if (!task) {
                throw new Error("Task not found");
            }
            if (task.owner.toString() !== ownerId) {
                throw new Error("Not authorized to share this task");
            }
            if (task.sharedWith.includes(targetUserId)) {
                throw new Error("Task already shared with this user");
            }
            task.sharedWith.push(targetUserId);
            yield task.save();
            return task;
        });
    }
    shareTaskWithMultiple(taskId, ownerId, friendIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findById(taskId).populate("owner", "_id name email");
            if (!task) {
                throw new Error("Task not found");
            }
            if (task.owner._id.toString() !== ownerId.toString()) {
                throw new Error("Not authorized to share this task");
            }
            // Filter out friends who already have the task shared with them
            const newFriendIds = friendIds.filter((friendId) => !task.sharedWith.includes(friendId));
            if (newFriendIds.length > 0) {
                task.sharedWith.push(...newFriendIds);
                yield task.save();
                yield task.populate("sharedWith", "name email");
            }
            return task;
        });
    }
    getTasksSharedWithMe(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield Task_1.Task.find({
                sharedWith: userId,
            })
                .populate("owner", "name email")
                .populate("sharedWith", "name email")
                .sort({ updatedAt: -1 });
            return tasks;
        });
    }
    getMySharedTasks(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield Task_1.Task.find({
                owner: userId,
                sharedWith: { $exists: true, $not: { $size: 0 } },
            })
                .populate("owner", "name email")
                .populate("sharedWith", "name email")
                .sort({ updatedAt: -1 });
            return tasks;
        });
    }
    unshareTask(taskId, ownerId, friendIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield Task_1.Task.findOne({
                _id: taskId,
                owner: ownerId,
            });
            if (!task) {
                throw new Error("Task not found");
            }
            // Remove the specified friends from sharedWith array
            task.sharedWith = task.sharedWith.filter((userId) => !friendIds.includes(userId.toString()));
            yield task.save();
            yield task.populate("owner", "name email");
            yield task.populate("sharedWith", "name email");
            return task;
        });
    }
}
exports.TaskService = TaskService;
exports.default = TaskService;
