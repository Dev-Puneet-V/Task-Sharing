"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const friends_1 = __importDefault(require("./routes/friends"));
const users_1 = __importDefault(require("./routes/users"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Vite's default port
    credentials: true, // Important for cookies
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    // Log request details
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    // Log request body if present
    if (Object.keys(req.body).length > 0) {
        console.log("Request Body:", JSON.stringify(req.body, null, 2));
    }
    // Track response
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[${timestamp}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Database connection
mongoose_1.default
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/task-tracker")
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));
// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/tasks", tasks_1.default);
app.use("/api/friends", friends_1.default);
app.use("/api/users", users_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
