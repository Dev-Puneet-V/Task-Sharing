import express, { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const router: Router = express.Router();

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

// Cookie options
const cookieOptions = {
  // httpOnly: true, // Prevents JavaScript access to the cookie
  secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // sameSite: "strict" as const,
};

router.get("/me", async (req: Request, res: any) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const user = await User.findById(decoded._id);

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Error fetching user" });
  }
});

// Register
router.post("/register", (async (req: RegisterRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

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
  } catch (error) {
    res.status(400).json({ error: "Error creating user" });
  }
}) as express.RequestHandler);

// Login
router.post("/login", (async (req: LoginRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

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
  } catch (error) {
    res.status(400).json({ error: "Error logging in" });
  }
}) as express.RequestHandler);

// Logout
router.post("/logout", ((req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logged out successfully" });
}) as express.RequestHandler);

export default router;
