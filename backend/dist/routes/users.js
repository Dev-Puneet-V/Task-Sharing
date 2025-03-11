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
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get user by email
router.get("/email/:email", auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email } = req.params;
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email format",
                details: "Please provide a valid email address",
            });
        }
        // Find user but exclude sensitive information
        const user = yield User_1.User.findOne({ email }).select({
            password: 0,
            __v: 0,
        });
        if (!user) {
            return res.status(404).json({
                error: "User not found",
                details: "No user exists with this email address",
            });
        }
        // Check if the requesting user is searching for themselves
        const isSelf = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString()) === ((_b = user === null || user === void 0 ? void 0 : user._id) === null || _b === void 0 ? void 0 : _b.toString());
        // Return different data based on whether it's the user themselves or another user
        const userData = isSelf
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                friends: user.friends,
                friendRequests: user.friendRequests,
            }
            : {
                _id: user._id,
                name: user.name,
                email: user.email,
            };
        res.json({
            message: "User found successfully",
            user: userData,
        });
    }
    catch (error) {
        console.error("Error fetching user by email:", error);
        if (error instanceof Error) {
            res.status(500).json({
                error: "Failed to fetch user",
                details: error.message,
            });
        }
        else {
            res.status(500).json({
                error: "Failed to fetch user",
                details: "An unexpected error occurred",
            });
        }
    }
}));
exports.default = router;
