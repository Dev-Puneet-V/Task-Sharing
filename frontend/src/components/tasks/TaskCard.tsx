import React, { useEffect, useRef, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import api from "../../utils/axios";
import ShareTaskModal from "./ShareTaskModal";

interface Friend {
  _id: string;
  name: string;
  email: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate?: Date;
  priority?: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  tags?: string[];
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  sharedWith: Friend[];
  createdAt: Date;
  updatedAt: Date;
}

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onShare: (taskId: string, friendIds: string[]) => Promise<void>;
  onUnshare: (taskId: string, friendIds: string[]) => Promise<void>;
}

type BaseUserData = {
  _id: string;
  name: string;
  email: string;
};

type SelfUserData = BaseUserData & {
  friends: string[];
  friendRequests: {
    from: string;
    status: "pending" | "accepted" | "rejected";
  }[];
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onShare,
  onUnshare,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareEmailRef = useRef<HTMLInputElement>(null);
  const [shareEmailUser, setShareEmailUser] = useState<
    BaseUserData | SelfUserData | null
  >(null);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const statusColors = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
  };

  const handleUpdate = async () => {
    try {
      await onUpdate(task._id, editedTask);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update task");
    }
  };

  const handleShare = async () => {
    try {
      // In a real app, you would first search for the user by email
      // and get their ID. For now, we'll just show an error
      //User types email -> send request and fetch user -> show in real time if user exists or not -> if user exists select -> at a time multiple users can be selected
      const response = await api.get(
        `/friends/e/query=${shareEmailRef?.current?.value}`
      );
      console.log(response.data);
      setShareEmailUser(response.data);
      setError("User sharing not implemented yet");
      setShowShareModal(false);
    } catch (err) {
      setError("Failed to share task");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      await onDelete(task._id);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: Task["status"]) => {
    try {
      await onUpdate(task._id, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      {error && (
        <div className="absolute top-2 right-2 bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) =>
              setEditedTask({ ...editedTask, title: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2"
          />
          <textarea
            value={editedTask.description}
            onChange={(e) =>
              setEditedTask({ ...editedTask, description: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2"
            rows={3}
          />
          <div className="flex gap-4">
            <select
              value={editedTask.status}
              onChange={(e) =>
                setEditedTask({
                  ...editedTask,
                  status: e.target.value as Task["status"],
                })
              }
              className="border rounded-md px-3 py-2"
            >
              <option value="pending">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={editedTask.priority}
              onChange={(e) =>
                setEditedTask({
                  ...editedTask,
                  priority: e.target.value as Task["priority"],
                })
              }
              className="border rounded-md px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{task.title}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <PencilIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ShareIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <TrashIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{task.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {task.priority && (
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>
            )}
            <span
              className={`px-2 py-1 rounded-full text-sm ${
                statusColors[task.status]
              }`}
            >
              {task.status.replace("_", " ")}
            </span>
            {task.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {format(new Date(task.dueDate || task.createdAt), "MMM d, yyyy")}
            </div>
            <div>
              {task.sharedWith.length > 0 && (
                <div className="flex items-center">
                  <ShareIcon className="h-4 w-4 mr-1" />
                  Shared with {task.sharedWith.length} users
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showShareModal && (
        <ShareTaskModal
          taskId={task._id}
          currentSharedWith={task.sharedWith}
          onClose={() => setShowShareModal(false)}
          onShare={onShare}
          onUnshare={onUnshare}
        />
      )}
    </div>
  );
};

export default TaskCard;
