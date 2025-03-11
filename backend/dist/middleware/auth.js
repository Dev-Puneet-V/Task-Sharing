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
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new Error("No token provided");
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        const user = yield User_1.User.findOne({ _id: decoded._id });
        if (!user) {
            throw new Error("User not found");
        }
        req.user = {
            _id: new mongoose_1.default.Types.ObjectId(user === null || user === void 0 ? void 0 : user._id),
            friends: user.friends,
            friendRequests: user.friendRequests,
        };
        req.token = token;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Please authenticate." });
    }
});
exports.auth = auth;
