import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import TaskCard from "./TaskCard";
import CreateTaskModal from "./CreateTaskModal";
import api from "../../utils/axios";
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

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    tag: "",
  });
  const [sort, setSort] = useState({
    field: "createdAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [showSharedTasks, setShowSharedTasks] = useState(false);
  const [sharedTasks, setSharedTasks] = useState<Task[]>([]);
  const [sharedWithMeTasks, setSharedWithMeTasks] = useState<Task[]>([]);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const params = {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.search && { search: filters.search }),
        ...(filters.tag && { tag: filters.tag }),
        sortBy: `${sort.field}:${sort.direction}`,
        limit: limit.toString(),
        skip: ((page - 1) * limit).toString(),
      };

      const { data: myTasksData } = await api.get("/tasks", { params });
      setTasks(myTasksData.tasks);
      setTotal(myTasksData.total);
      setHasMore(myTasksData.hasMore);

      const { data: sharedWithMeData } = await api.get("/friends/shared-tasks");
      setSharedWithMeTasks(sharedWithMeData.tasks);

      const { data: mySharedData } = await api.get("/friends/my-shared-tasks");
      setSharedTasks(mySharedData.tasks);

      setError("");
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [filters, sort, page]);

  const handleCreateTask = async (
    taskData: Omit<
      Task,
      "_id" | "owner" | "sharedWith" | "createdAt" | "updatedAt"
    >
  ) => {
    try {
      console.log("Creating task with data:", taskData);

      const { data: newTask } = await api.post("/tasks", taskData);
      console.log("Created task:", newTask);

      setTasks((prevTasks = []) => [newTask, ...prevTasks]);
      setShowCreateModal(false);
      setError("");
    } catch (err: any) {
      console.error("Error creating task:", err);
      setError(err.response?.data?.error || "Error creating task");
      setShowCreateModal(true);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data: updatedTask } = await api.patch(
        `/tasks/${taskId}`,
        updates
      );
      setTasks((prevTasks = []) =>
        prevTasks.map((task) => (task._id === taskId ? updatedTask : task))
      );
    } catch (err: any) {
      console.error("Error updating task:", err);
      setError(err.response?.data?.error || "Error updating task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setError(err.response?.data?.error || "Error deleting task");
    }
  };

  const handleShareTask = async (taskId: string, friendIds: string[]) => {
    try {
      const { data: updatedTask } = await api.post(
        `/friends/share-task/${taskId}`,
        {
          friendIds,
        }
      );
      console.log("Updated task:", updatedTask, taskId);
      setTasks((prevTasks = []) =>
        prevTasks.map((task) =>
          task._id === taskId ? updatedTask?.task : task
        )
      );
      setSharedTasks((prevTasks = []) => [...prevTasks, updatedTask]);
    } catch (err: any) {
      console.error("Error sharing task:", err);
      setError(err.response?.data?.error || "Error sharing task");
    }
  };

  const handleUnshareTask = async (taskId: string, friendIds: string[]) => {
    try {
      const { data: updatedTask } = await api.delete(
        `/friends/unshare-task/${taskId}`,
        {
          data: { friendIds },
        }
      );
      setTasks((prevTasks = []) =>
        prevTasks.map((task) =>
          task._id === taskId ? updatedTask?.task : task
        )
      );
      if (updatedTask?.task?.sharedWith.length === 0) {
        setSharedTasks((prevTasks = []) =>
          prevTasks?.filter((task) => task._id !== taskId)
        );
      }
    } catch (err: any) {
      console.error("Error unsharing task:", err);
      setError(err.response?.data?.error || "Error unsharing task");
    }
  };

  const displayedTasks = showSharedTasks ? sharedWithMeTasks : tasks;

  return (
    <div className="h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex flex-col h-full">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <div className="mt-2">
              <button
                onClick={() => setShowSharedTasks(false)}
                className={`mr-4 ${
                  !showSharedTasks
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600"
                }`}
              >
                My Tasks ({tasks ? tasks?.length : 0})
              </button>
              <button
                onClick={() => setShowSharedTasks(true)}
                className={`${
                  showSharedTasks
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600"
                }`}
              >
                Shared with Me (
                {sharedWithMeTasks ? sharedWithMeTasks?.length : 0})
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Task
          </button>
        </div>

        {/* Filters - Fixed */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="pending">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="border rounded-md px-3 py-2 flex-grow"
            />
          </div>
        </div>

        {/* Tasks List - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : displayedTasks?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {showSharedTasks ? "No tasks shared with you" : "No tasks found"}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-min">
              {displayedTasks?.map((task) => (
                <TaskCard
                  key={task?._id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onShare={handleShareTask}
                  onUnshare={handleUnshareTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination - Fixed */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} tasks
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
};

export default TaskList;
