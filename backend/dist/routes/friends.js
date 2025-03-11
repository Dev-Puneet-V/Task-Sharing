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
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// Send friend request
router.post("/request", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
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
        friend.friendRequests.push({
            from: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
            status: "pending",
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
        request.status = status;
        if (status === "accepted" && req.user) {
            // Add to friends list for both users
            if (!req.user.friends) {
                req.user.friends = [];
            }
            req.user.friends.push(new mongoose_1.default.Types.ObjectId(req.params.userId));
            const friend = yield User_1.User.findById(req.params.userId);
            if (friend) {
                if (!friend.friends) {
                    friend.friends = [];
                }
                friend.friends.push(req.user._id);
                yield friend.save();
            }
        }
        yield User_1.User.findByIdAndUpdate((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, {
            friends: (_d = req.user) === null || _d === void 0 ? void 0 : _d.friends,
            friendRequests: (_e = req.user) === null || _e === void 0 ? void 0 : _e.friendRequests,
        });
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
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).populate("friendRequests.from", "name email");
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
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).populate("friends", "name email");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user.friends);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching friends list" });
    }
}));
exports.default = router;
