import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Task {
  title: string;
  description: string;
  dueDate?: Date;
  priority?: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  tags?: string[];
}

interface CreateTaskModalProps {
  onClose: () => void;
  onCreate: (
    taskData: Omit<
      Task,
      "_id" | "owner" | "sharedWith" | "createdAt" | "updatedAt"
    >
  ) => Promise<void>;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [task, setTask] = useState<Task>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Form submitted with task:", task); // Debug log

      if (!task.title.trim()) {
        setError("Title is required");
        return;
      }

      if (!task.description.trim()) {
        setError("Description is required");
        return;
      }

      // Format the task data
      const taskData = {
        ...task,
        // Convert ISO string to Date object if dueDate exists
        dueDate: task.dueDate ? task.dueDate : undefined,
        // Ensure tags is always an array
        tags: task.tags || [],
      };

      console.log("Submitting task data:", taskData); // Debug log
      await onCreate(taskData);
      onClose();
    } catch (err) {
      console.error("Error in form submission:", err); // Debug log
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!task.tags?.includes(tagInput.trim())) {
        setTask((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTask((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={task.description}
              onChange={(e) =>
                setTask({ ...task, description: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={
                task.dueDate
                  ? new Date(task.dueDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setTask({
                  ...task,
                  dueDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) =>
                  setTask({
                    ...task,
                    priority: e.target.value as Task["priority"],
                  })
                }
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) =>
                  setTask({ ...task, status: e.target.value as Task["status"] })
                }
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Type tag and press Enter"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {task.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
