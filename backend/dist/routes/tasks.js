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
const Task_1 = require("../models/Task");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// Create a new task
router.post("/", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = new Task_1.Task(Object.assign(Object.assign({}, req.body), { owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, createdAt: new Date(), updatedAt: new Date() }));
        yield task.save();
        yield task.populate("owner", "name email");
        res.status(201).json(task);
    }
    catch (error) {
        res.status(400).json({ error: "Error creating task" });
    }
}));
// Get all tasks with filters
router.get("/", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const match = {
            $or: [{ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, { sharedWith: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }],
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
        const sort = {};
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(":");
            sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
        }
        else {
            // Default sort by createdAt desc
            sort.createdAt = -1;
        }
        const tasks = yield Task_1.Task.find(match)
            .populate("owner", "name email")
            .populate("sharedWith", "name email")
            .sort(sort)
            .limit(parseInt(req.query.limit) || 10)
            .skip(parseInt(req.query.skip) || 0);
        const total = yield Task_1.Task.countDocuments(match);
        res.json({
            tasks,
            total,
            hasMore: total >
                (parseInt(req.query.skip) || 0) +
                    (parseInt(req.query.limit) || 10),
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching tasks" });
    }
}));
// Get a specific task by ID
router.get("/:id", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const task = yield Task_1.Task.findOne({
            _id: req.params.id,
            $or: [{ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, { sharedWith: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }],
        })
            .populate("owner", "name email")
            .populate("sharedWith", "name email");
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching task" });
    }
}));
// Update a task
router.patch("/:id", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const task = yield Task_1.Task.findOne({
            _id: req.params.id,
            $or: [{ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, { sharedWith: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }],
        });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        // Only owner can update certain fields
        if (task.owner.toString() !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id.toString())) {
            const allowedUpdates = ["status"];
            const updates = Object.keys(req.body);
            const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
            if (!isValidOperation) {
                return res.status(400).json({ error: "Invalid updates" });
            }
        }
        Object.assign(task, Object.assign(Object.assign({}, req.body), { updatedAt: new Date() }));
        yield task.save();
        yield task.populate("owner", "name email");
        yield task.populate("sharedWith", "name email");
        res.json(task);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Error updating task" });
    }
}));
// Delete a task
router.delete("/:id", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield Task_1.Task.findOneAndDelete({
            _id: req.params.id,
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json({ message: "Task deleted successfully", task });
    }
    catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }
}));
// Share a task with another user
router.post("/:id/share", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = req.body;
        const task = yield Task_1.Task.findOne({
            _id: req.params.id,
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        if (task.sharedWith.includes(userId)) {
            return res
                .status(400)
                .json({ error: "Task already shared with this user" });
        }
        task.sharedWith.push(new mongoose_1.default.Types.ObjectId(userId));
        yield task.save();
        yield task.populate("owner", "name email");
        yield task.populate("sharedWith", "name email");
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: "Error sharing task" });
    }
}));
exports.default = router;
