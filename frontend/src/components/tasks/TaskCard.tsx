import React, { useEffect, useRef, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CheckIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import api from "../../utils/axios";
import ShareTaskModal from "./ShareTaskModal";
import { useAuth } from "../../context/AuthContext";

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
  const [editedTitle, setEditedTitle] = useState(task?.title);
  const [editedDescription, setEditedDescription] = useState(task?.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareEmailRef = useRef<HTMLInputElement>(null);
  const [shareEmailUser, setShareEmailUser] = useState<
    BaseUserData | SelfUserData | null
  >(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // Check if current user is the owner
  const isOwner = user?._id === task?.owner._id;

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
    if (!isOwner) return; // Only owner can update title/description
    try {
      await onUpdate(task?._id, {
        title: editedTitle,
        description: editedDescription,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleShare = async () => {
    if (!isOwner) return; // Only owner can share
    setShowShareModal(true);
  };

  const handleDelete = async () => {
    if (!isOwner) return; // Only owner can delete
    try {
      await onDelete(task?._id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleStatusChange = async (newStatus: Task["status"]) => {
    try {
      await onUpdate(task?._id, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      {!isEditing ? (
        <>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{task?.title}</h3>
              <p className="text-gray-600 mb-4">{task?.description}</p>
            </div>
            {isOwner && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edit task"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-green-600"
                  title="Share task"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete task"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4 mb-4">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {task?.tags?.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <span className="font-medium mr-2">Status:</span>
          <select
            value={task?.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as Task["status"])
            }
            className={`p-1 rounded ${
              !isOwner ? "bg-gray-100" : "bg-white border"
            }`}
            disabled={!isOwner && task?.status === "completed"} // Non-owners can only mark as completed
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center">
          <span className="font-medium mr-2">Priority:</span>
          <span
            className={`px-2 py-1 rounded-full text-sm ${getPriorityColor(
              task?.priority
            )}`}
          >
            {task?.priority || "none"}
          </span>
        </div>

        {task?.dueDate && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Due:</span>
            <span>{new Date(task?.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Shared with section */}
      {task?.sharedWith.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Shared with:</h4>
          <div className="flex flex-wrap gap-2">
            {task?.sharedWith.map((user) => (
              <span
                key={user._id}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {user.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Task</h3>
            <p className="mb-4">Are you sure you want to delete this task?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareTaskModal
          taskId={task?._id}
          currentSharedWith={task?.sharedWith}
          onClose={() => setShowShareModal(false)}
          onShare={onShare}
          onUnshare={onUnshare}
        />
      )}
    </div>
  );
};

export default TaskCard;
