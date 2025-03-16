import express, { Request, Response } from "express";
import { auth } from "../middleware/auth";
import { NotificationService } from "../services/notification/NotificationService";

const router = express.Router();
const notificationService = new NotificationService();

// Get unread notifications
router.get("/unread", auth, async (req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getUnreadNotifications(
      req.user?._id.toString() as string
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

// Get all notifications
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getAllNotifications(
      req.user?._id.toString() as string
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

// Mark notification as read
router.patch("/:id/read", auth, async (req: Request, res: Response) => {
  try {
    const notification = await notificationService.markAsRead(
      req.user?._id.toString() as string,
      req.params.id
    );
    res.json(notification);
  } catch (error: any) {
    if (error.message === "Notification not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error updating notification" });
    }
  }
});

// Mark all notifications as read
router.patch("/read-all", auth, async (req: Request, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user?._id.toString() as string);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Error updating notifications" });
  }
});

// Delete a notification
router.delete("/:id", auth, async (req: Request, res: Response) => {
  try {
    await notificationService.deleteNotification(
      req.user?._id.toString() as string,
      req.params.id
    );
    res.json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    if (error.message === "Notification not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error deleting notification" });
    }
  }
});

export default router;
