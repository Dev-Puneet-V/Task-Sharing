import React, { useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  ShareIcon,
  CheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

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
  sharedWith: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onShare: (taskId: string, userId: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onShare,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [error, setError] = useState("");

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
      setError("User sharing not implemented yet");
      setShowShareModal(false);
    } catch (err) {
      setError("Failed to share task");
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
                onClick={() => onDelete(task._id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Share Task</h3>
            <input
              type="email"
              placeholder="Enter email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
