import dotenv from "dotenv";
dotenv.config();

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "http://localhost:5173", // Vite's default port
  "http://localhost:3000", // Common React dev port
  "https://your-production-domain.com", // Add your production domain here
];

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/task-tracker",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  allowedOrigins: ALLOWED_ORIGINS,
  corsOptions: {
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      const allowedOrigins = [
        "http://localhost:5173", // Vite dev server
        "http://localhost:3000", // Alternative dev port
        "http://localhost:5173", // Another common dev port
        process.env.FRONTEND_URL, // Production URL from env
      ].filter(Boolean); // Remove any undefined values

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  },
};

export default config;
