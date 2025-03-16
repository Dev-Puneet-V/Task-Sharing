import rateLimit from "express-rate-limit";

// Create a limiter for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a limiter for WebSocket connections
export const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 WebSocket messages per minute
  message:
    "Too many WebSocket messages from this IP, please try again after a minute",
  standardHeaders: true,
  legacyHeaders: false,
});
