import React, { useEffect, useState } from "react";
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../../utils/axios";
import { RetryManager, createRetryManager } from "../../utils/retry";
import Skeleton from "../common/Skeleton";
const retryManager = createRetryManager({
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  onRetry: (attempt: number, delay: number) => {
    console.log(`Retrying operation attempt ${attempt} in ${delay}ms`);
  },
});
interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
  dueSoon: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await retryManager.execute(async () => {
          const response = await api.get("/tasks/stats");
          // Process your data
          return response.data;
        });
        setStats(data);
        setError("");
      } catch (err) {
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, index) => (
          <Skeleton key={index} height="150px" className="rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Tasks</p>
              <h3 className="text-3xl font-bold">{stats?.total || 0}</h3>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        {/* Tasks in Progress */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">In Progress</p>
              <h3 className="text-3xl font-bold">{stats?.inProgress || 0}</h3>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Completed</p>
              <h3 className="text-3xl font-bold">{stats?.completed || 0}</h3>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-lg shadow col-span-full">
          <h3 className="text-lg font-semibold mb-4">Task Progress</h3>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{
                width: `${stats ? (stats.completed / stats.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {stats ? Math.round((stats.completed / stats.total) * 100) : 0}%
            Complete
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
