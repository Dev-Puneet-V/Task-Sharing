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
const User_1 = require("../models/User");
const Task_1 = require("../models/Task");
const router = express_1.default.Router();
// Send friend request
router.post("/request", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { email } = req.body;
        const friend = (yield User_1.User.findOne({ email }));
        if (!friend) {
            return res.status(404).json({ error: "User not found" });
        }
        if (friend._id.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            return res
                .status(400)
                .json({ error: "Cannot send friend request to yourself" });
        }
        // Check if already friends
        if ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.friends) === null || _c === void 0 ? void 0 : _c.includes(friend._id)) {
            return res.status(400).json({ error: "Already friends with this user" });
        }
        // Check if request already exists
        const existingRequest = friend.friendRequests.find((request) => { var _a; return request.from.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString()); });
        if (existingRequest) {
            return res.status(400).json({ error: "Friend request already sent" });
        }
        const existingSentRequest = friend.sentFriendRequests.find((request) => { var _a; return request.to.toString() === ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString()); });
        if (existingSentRequest) {
            return res.status(400).json({ error: "Friend request already sent" });
        }
        friend.friendRequests.push({
            from: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
            status: "pending",
        });
        yield User_1.User.findByIdAndUpdate((_e = req.user) === null || _e === void 0 ? void 0 : _e._id, {
            sentFriendRequests: [
                ...(((_f = req.user) === null || _f === void 0 ? void 0 : _f.sentFriendRequests) || []),
                {
                    to: friend._id,
                    status: "pending",
                },
            ],
        });
        yield friend.save();
        res.json({ message: "Friend request sent successfully" });
    }
    catch (error) {
        res.status(400).json({ error: "Error sending friend request" });
    }
}));
// Accept/Reject friend request
router.patch("/request/:userId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { status } = req.body;
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        const request = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.friendRequests) === null || _b === void 0 ? void 0 : _b.find((request) => request.from.toString() === req.params.userId &&
            request.status === "pending");
        if (!request) {
            return res.status(404).json({ error: "Friend request not found" });
        }
        yield User_1.User.findByIdAndUpdate((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, Object.assign({ $pull: { friendRequests: { from: req.params.userId } } }, (status === "accepted" && { $push: { friends: req.params.userId } })));
        yield User_1.User.findByIdAndUpdate(req.params.userId, Object.assign({ $pull: { sentFriendRequests: { to: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id } } }, (status === "accepted" && { $push: { friends: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id } })));
        res.json({ message: `Friend request ${status}` });
    }
    catch (error) {
        res.status(400).json({ error: "Error processing friend request" });
    }
}));
// Get friend requests
router.get("/requests", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).populate("friendRequests.from", "_id name email");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user.friendRequests);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching friend requests" });
    }
}));
// Get friends list
router.get("/", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).populate("friends", "_id name email");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user.friends);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching friends list" });
    }
}));
// Search for potential friends by email or name
router.get("/new", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { query } = req.query;
        // Validate if search query is provided
        if (!query || typeof query !== "string") {
            return res.status(400).json({
                error: "Invalid request",
                details: "Please provide a search term (email or name)",
            });
        }
        const currentUser = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!currentUser) {
            return res.status(404).json({
                error: "User not found",
                details: "Current user not found",
            });
        }
        // Get IDs to exclude
        const friendIds = currentUser.friends || [];
        const pendingRequestIds = currentUser.friendRequests
            .filter((request) => request.status === "pending")
            .map((request) => request.from);
        const sentRequestIds = currentUser.sentFriendRequests
            .filter((request) => request.status === "pending")
            .map((request) => request.to);
        // Find users by email or name who are not already friends or have pending requests
        const potentialFriends = yield User_1.User.find({
            $or: [
                { email: { $regex: query, $options: "i" } }, // Case insensitive email search
                { name: { $regex: query, $options: "i" } }, // Case insensitive name search
            ],
            _id: {
                $nin: [
                    (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, // Exclude self
                    ...friendIds, // Exclude current friends
                    ...pendingRequestIds, // Exclude users with pending requests
                    ...sentRequestIds, // Exclude users with pending requests
                ],
            },
        })
            .select("name email")
            .limit(10); // Limit results to prevent large responses
        if (potentialFriends.length === 0) {
            return res.status(404).json({
                error: "No users found",
                details: "No matching users found or they might already be your friends",
            });
        }
        res.json({
            message: "Potential friends found successfully",
            users: potentialFriends,
        });
    }
    catch (error) {
        console.error("Error finding potential friends:", error);
        res.status(500).json({
            error: "Failed to find potential friends",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// 2. Get current friends list (for task sharing)
router.get("/list", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const currentUser = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).populate("friends", "name email");
        if (!currentUser) {
            return res.status(404).json({
                error: "User not found",
                details: "Current user not found",
            });
        }
        const validFriends = currentUser.friends.filter((friend) => friend !== null);
        res.json({
            message: "Friends fetched successfully",
            friends: validFriends,
        });
    }
    catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({
            error: "Failed to fetch friends",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// 3. Search within friends (for task sharing)
router.get("/search", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string") {
            return res.status(400).json({
                error: "Invalid search query",
                details: "Please provide a search term",
            });
        }
        const currentUser = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).populate({
            path: "friends",
            match: {
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } },
                ],
            },
            select: "name email",
        });
        if (!currentUser) {
            return res.status(404).json({
                error: "User not found",
                details: "Current user not found",
            });
        }
        const matchingFriends = currentUser.friends.filter((friend) => friend !== null);
        res.json({
            message: "Friends search completed",
            friends: matchingFriends,
        });
    }
    catch (error) {
        console.error("Error searching friends:", error);
        res.status(500).json({
            error: "Failed to search friends",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Remove friend
router.delete("/:friendId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { friendId } = req.params;
        // Remove friend from current user's friends list
        yield User_1.User.findByIdAndUpdate((_a = req.user) === null || _a === void 0 ? void 0 : _a._id, {
            $pull: { friends: friendId },
        });
        //Remove all tasks shared with the friend
        yield Task_1.Task.updateMany({ sharedWith: friendId }, { $pull: { sharedWith: friendId } });
        // Remove current user from friend's friends list
        yield User_1.User.findByIdAndUpdate(friendId, {
            $pull: { friends: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id },
        });
        res.json({ message: "Friend removed successfully" });
    }
    catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({
            error: "Failed to remove friend",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Share task with friend
router.post("/share-task/:taskId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { taskId } = req.params;
        const { friendIds } = req.body;
        if (!Array.isArray(friendIds) || friendIds.length === 0) {
            return res.status(400).json({
                error: "Invalid request",
                details: "Please provide at least one friend to share with",
            });
        }
        // Verify all friendIds are actually friends
        const currentUser = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const invalidFriends = friendIds.filter((id) => !(currentUser === null || currentUser === void 0 ? void 0 : currentUser.friends.includes(id)));
        if (invalidFriends.length > 0) {
            return res.status(400).json({
                error: "Invalid friends",
                details: "Some users are not in your friends list",
            });
        }
        // Update task to include new shared users
        const updatedTask = yield Task_1.Task.findByIdAndUpdate(taskId, {
            $addToSet: { sharedWith: { $each: friendIds } },
        }, { new: true }).populate("sharedWith", "name email");
        if (!updatedTask) {
            return res.status(404).json({
                error: "Task not found",
                details: "The specified task does not exist",
            });
        }
        res.json({
            message: "Task shared successfully",
            task: updatedTask,
        });
    }
    catch (error) {
        console.error("Error sharing task:", error);
        res.status(500).json({
            error: "Failed to share task",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Remove task sharing for specific friends
router.delete("/unshare-task/:taskId", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const { friendIds } = req.body;
        if (!Array.isArray(friendIds) || friendIds.length === 0) {
            return res.status(400).json({
                error: "Invalid request",
                details: "Please provide at least one friend to unshare with",
            });
        }
        // Update task to remove shared users
        const updatedTask = yield Task_1.Task.findByIdAndUpdate(taskId, {
            $pull: { sharedWith: { $in: friendIds } },
        }, { new: true }).populate("sharedWith", "name email");
        if (!updatedTask) {
            return res.status(404).json({
                error: "Task not found",
                details: "The specified task does not exist",
            });
        }
        res.json({
            message: "Task sharing removed successfully",
            task: updatedTask,
        });
    }
    catch (error) {
        console.error("Error removing task sharing:", error);
        res.status(500).json({
            error: "Failed to remove task sharing",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Get tasks shared with me
router.get("/shared-tasks", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const sharedTasks = yield Task_1.Task.find({
            sharedWith: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        })
            .populate("owner", "name email")
            .populate("sharedWith", "name email");
        res.json({
            message: "Shared tasks fetched successfully",
            tasks: sharedTasks,
        });
    }
    catch (error) {
        console.error("Error fetching shared tasks:", error);
        res.status(500).json({
            error: "Failed to fetch shared tasks",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
// Get tasks I've shared with others
router.get("/my-shared-tasks", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const sharedTasks = yield Task_1.Task.find({
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            sharedWith: { $exists: true, $not: { $size: 0 } },
        })
            .populate("owner", "name email")
            .populate("sharedWith", "name email");
        res.json({
            message: "My shared tasks fetched successfully",
            tasks: sharedTasks,
        });
    }
    catch (error) {
        console.error("Error fetching my shared tasks:", error);
        res.status(500).json({
            error: "Failed to fetch my shared tasks",
            details: error instanceof Error ? error.message : "An unexpected error occurred",
        });
    }
}));
exports.default = router;
