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
const TaskService_1 = require("../services/task/TaskService");
const router = express_1.default.Router();
const taskService = new TaskService_1.TaskService();
// Create a new task
router.post("/", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield taskService.createTask((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, req.body);
        res.status(201).json(task);
    }
    catch (error) {
        res.status(400).json({ error: "Error creating task" });
    }
}));
// Get all tasks with filters
router.get("/", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield taskService.getTasks((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, {
            status: req.query.status,
            priority: req.query.priority,
            tag: req.query.tag,
            search: req.query.search,
            sortBy: req.query.sortBy,
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching tasks" });
    }
}));
// Get a specific task by ID
router.get("/:id", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield taskService.getTaskById(req.params.id, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json(task);
    }
    catch (error) {
        if (error.message === "Task not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error fetching task" });
        }
    }
}));
// Update a task
router.patch("/:id", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield taskService.updateTask(req.params.id, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, req.body);
        res.json(task);
    }
    catch (error) {
        console.log(error);
        if (error.message === "Task not found") {
            res.status(404).json({ error: error.message });
        }
        else if (error.message === "Invalid updates") {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "Error updating task" });
        }
    }
}));
// Delete a task
router.delete("/:id", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield taskService.deleteTask(req.params.id, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        res.json({ message: "Task deleted successfully", task });
    }
    catch (error) {
        if (error.message === "Task not found") {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "Error deleting task" });
        }
    }
}));
// Share a task with another user
router.post("/:id/share", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const task = yield taskService.shareTask(req.params.id, (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, req.body.userId);
        res.json(task);
    }
    catch (error) {
        if (error.message === "Task not found") {
            res.status(404).json({ error: error.message });
        }
        else if (error.message === "Task already shared with this user") {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(400).json({ error: "Error sharing task" });
        }
    }
}));
exports.default = router;
