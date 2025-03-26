import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import friendRoutes from "./routes/friends";
import userRoutes from "./routes/users";
import notificationRoutes from "./routes/notifications";
import WebSocketService from "./services/websocket/WebSocketService";
import config from "./config";

dotenv.config();

const app = express();

// Middleware
app.use(cors(config.corsOptions));
app.use(cookieParser());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// // Apply rate limiting
// app.use("/api/", apiLimiter); // Apply to all API routes
// app.use("/api/auth/", authLimiter); // Apply stricter limits to auth routes

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
    console.log(
      `[${timestamp}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// Routes
app.get("/check", (req, res) => {
  res.send("Hello World");
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Initialize WebSocket after database connection
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start HTTP server
    server.listen(config.port, async () => {
      console.log(`Server is running on port ${config.port}`);

      // Initialize WebSocket server
      try {
        const wsService = WebSocketService.getInstance(server);
        wsService.connect();
        console.log("WebSocket server initialized");
      } catch (error) {
        console.error("Failed to initialize WebSocket server:", error);
      }
    });
  })
  .catch((error) => console.error("MongoDB connection error:", error));
