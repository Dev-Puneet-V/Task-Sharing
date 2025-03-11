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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Cookie options
const cookieOptions = {
    // httpOnly: true, // Prevents JavaScript access to the cookie
    secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // sameSite: "strict" as const,
};
router.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        const user = yield User_1.User.findById(decoded._id);
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: "Error fetching user" });
    }
}));
// Register
router.post("/register", ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Create new user
        const user = new User_1.User({
            email,
            password: hashedPassword,
            name,
        });
        yield user.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ _id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        // Set token in cookie
        res.cookie("token", token, cookieOptions);
        // Send response without including the token in the body
        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        res.status(400).json({ error: "Error creating user" });
    }
})));
// Login
router.post("/login", ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const user = yield User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Check password
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ _id: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        // Set token in cookie
        res.cookie("token", token, cookieOptions);
        // Send response without including the token in the body
        res.json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        res.status(400).json({ error: "Error logging in" });
    }
})));
// Logout
router.post("/logout", ((req, res) => {
    // Clear the token cookie
    res.clearCookie("token", cookieOptions);
    res.json({ message: "Logged out successfully" });
}));
exports.default = router;
