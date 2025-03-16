import { Notification, INotification } from "../../models/Notification";
import WebSocketService from "../websocket/WebSocketService";

export class NotificationService {
  private wsService: WebSocketService;

  constructor() {
    this.wsService = WebSocketService.getInstance();
  }

  async createNotification(
    userId: string,
    type: INotification["type"],
    message: string,
    data: any
  ) {
    try {
      const notification = new Notification({
        userId,
        type,
        message,
        data,
      });

      await notification.save();

      // Send real-time notification if user is connected
      this.wsService.sendToUser(userId, "NOTIFICATION", notification);

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getUnreadNotifications(userId: string) {
    try {
      return await Notification.find({ userId, isRead: false })
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      throw error;
    }
  }

  async getAllNotifications(userId: string) {
    try {
      return await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100);
    } catch (error) {
      console.error("Error fetching all notifications:", error);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  async deleteNotification(userId: string, notificationId: string) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }
}
