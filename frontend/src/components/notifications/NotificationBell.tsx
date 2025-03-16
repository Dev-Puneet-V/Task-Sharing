import React, { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/axios";
import { useWebSocket } from "../../context/WebSocketContext";

interface Notification {
  _id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const { ws, sendMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/notifications");
        console.log("Fetched notifications:", data);
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received in NotificationBell:", message);

        if (message.type === "NOTIFICATION") {
          console.log("New notification received:", message.payload);
          setNotifications((prev) => [message.payload, ...prev]);
        } else if (message.type === "NOTIFICATION_READ") {
          console.log("Notification marked as read:", message.payload);
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === message.payload.notificationId
                ? { ...n, isRead: true }
                : n
            )
          );
        } else if (message.type === "ALL_NOTIFICATIONS_READ") {
          console.log("All notifications marked as read");
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }
      } catch (error) {
        console.error("Error processing notification:", error);
      }
    };

    ws.addEventListener("message", handleMessage);

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [ws]);

  const markAsRead = async (id: string) => {
    try {
      console.log("Marking notification as read:", id);
      await api.patch(`/notifications/${id}/read`);

      // Update local state immediately
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      // Send WebSocket message
      if (sendMessage) {
        sendMessage("NOTIFICATION_READ", { notificationId: id });
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log("Marking all notifications as read");
      await api.patch("/notifications/read-all");

      // Update local state immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      // Send WebSocket message
      if (sendMessage) {
        sendMessage("ALL_NOTIFICATIONS_READ", {});
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50"
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b last:border-b-0 ${
                      !notification.isRead ? "bg-blue-50" : ""
                    } cursor-pointer hover:bg-gray-50`}
                    onClick={() =>
                      !notification.isRead && markAsRead(notification._id)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800">
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
