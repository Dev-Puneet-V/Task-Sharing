"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || "http://localhost:5173", // Vite's default port
    "http://localhost:3000", // Common React dev port
];
const config = {
    port: process.env.PORT || 5000,
    wsPort: process.env.WEBSOCKET_PORT || 5001,
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/task-tracker",
    jwtSecret: process.env.JWT_SECRET || "your-secret-key",
    allowedOrigins: ALLOWED_ORIGINS,
    corsOptions: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
                callback(null, true);
                return;
            }
            if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    },
};
exports.default = config;
