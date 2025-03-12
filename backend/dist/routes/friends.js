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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const FriendService_1 = require("../services/friend/FriendService");
const TaskService_1 = require("../services/task/TaskService");
const router = express_1.default.Router();
const friendService = new FriendService_1.FriendService();
const taskService = new TaskService_1.TaskService();
// Send friend request
router.post("/request", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield friendService.sendFriendRequest((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, req.body.email);
        res.json(result);
    }
    catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
}));
// Accept/Reject friend request
router.patch("/request/:userId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield friendService.respondToFriendRequest((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, req.params.userId, req.body.status);
        res.json(result);
    }
    catch (error) {
        if (error.message === "Friend request not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
}));
// Get friend requests
router.get("/requests", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requests = yield friendService.getFriendRequests((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json(requests);
    }
    catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error fetching friend requests" });
        }
    }
}));
// Get friends list
router.get("/", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const friends = yield friendService.getFriendsList((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json(friends);
    }
    catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error fetching friends list" });
        }
    }
}));
// Search for potential friends by email or name
router.get("/new", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string") {
            return res.status(400).json({
                error: "Invalid request",
                details: "Please provide a search term (email or name)",
            });
        }
        const result = yield friendService.searchPotentialFriends((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, {
            query,
            limit: 10,
        });
        if (result.users.length === 0) {
            return res.status(404).json({
                error: "No users found",
                details: result.message,
            });
        }
        res.json(result);
    }
    catch (error) {
        console.error("Error finding potential friends:", error);
        res.status(500).json({
            error: "Failed to find potential friends",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Get current friends list (for task sharing)
router.get("/list", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield friendService.getCurrentFriends((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json(result);
    }
    catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({
            error: "Failed to fetch friends",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Get tasks shared with me
router.get("/shared-tasks", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tasks = yield taskService.getTasksSharedWithMe((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching shared tasks" });
    }
}));
// Get my tasks that I've shared with others
router.get("/my-shared-tasks", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tasks = yield taskService.getMySharedTasks((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching shared tasks" });
    }
}));
// Unshare task with friends
router.delete("/unshare-task/:taskId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { friendIds } = req.body;
        const task = yield taskService.unshareTask(req.params.taskId, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, friendIds);
        res.json({ message: "Task unshared successfully", task });
    }
    catch (error) {
        if (error.message === "Task not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "Error unsharing task" });
        }
    }
}));
// Remove friend
router.delete("/:friendId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield friendService.removeFriend((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, req.params.friendId);
        res.json(result);
    }
    catch (error) {
        if (error.message === "Friend not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "Error removing friend" });
        }
    }
}));
// Share task with friends
router.post("/share-task/:taskId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { friendIds } = req.body;
        const task = yield taskService.shareTaskWithMultiple(req.params.taskId, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, friendIds);
        res.json({ message: "Task unshared successfully", task });
    }
    catch (error) {
        if (error.message === "Task not found") {
            res.status(404).json({ error: error.message });
        }
        else if (error.message === "Task already shared with this user") {
            res.status(400).json({ error: error.message });
        }
        else {
            console.error("Error sharing task:", error);
            res.status(400).json({ error: "Error sharing task" });
        }
    }
}));
exports.default = router;
