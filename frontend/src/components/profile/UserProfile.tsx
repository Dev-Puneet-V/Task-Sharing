import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  UserCircleIcon,
  ChartBarIcon,
  CogIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import api from "../../utils/axios";
import Skeleton from "../common/Skeleton";
import Dashboard from "../dashboard/Dashboard";

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  collaborations: number;
  averageCompletionTime: number;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "stats" | "settings">(
    "profile"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/tasks/stats");
        setStats(data);
        setError("");
      } catch (err) {
        setError("Failed to load user statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await api.patch("/users/profile", { name });
      setIsEditing(false);
      setError("");
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <UserCircleIcon className="h-24 w-24 text-gray-400" />
          <button className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg">
            <CogIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-indigo-600 hover:text-indigo-800"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    // <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //   {loading ? (
    //     Array(4)
    //       .fill(0)
    //       .map((_, i) => (
    //         <Skeleton key={i} height="100px" className="rounded-lg" />
    //       ))
    //   ) : (
    //     <>
    //       <div className="bg-white p-6 rounded-lg shadow">
    //         <div className="flex items-center justify-between">
    //           <h3 className="text-lg font-medium text-gray-900">Total Tasks</h3>
    //           <span className="text-2xl font-bold text-indigo-600">
    //             {stats?.totalTasks || 0}
    //           </span>
    //         </div>
    //       </div>
    //       <div className="bg-white p-6 rounded-lg shadow">
    //         <div className="flex items-center justify-between">
    //           <h3 className="text-lg font-medium text-gray-900">Completed</h3>
    //           <span className="text-2xl font-bold text-green-600">
    //             {stats?.completedTasks || 0}
    //           </span>
    //         </div>
    //       </div>
    //       <div className="bg-white p-6 rounded-lg shadow">
    //         <div className="flex items-center justify-between">
    //           <h3 className="text-lg font-medium text-gray-900">
    //             Collaborations
    //           </h3>
    //           <span className="text-2xl font-bold text-blue-600">
    //             {stats?.collaborations || 0}
    //           </span>
    //         </div>
    //       </div>
    //       <div className="bg-white p-6 rounded-lg shadow">
    //         <div className="flex items-center justify-between">
    //           <h3 className="text-lg font-medium text-gray-900">
    //             Avg. Completion
    //           </h3>
    //           <span className="text-2xl font-bold text-purple-600">
    //             {stats?.averageCompletionTime || 0} days
    //           </span>
    //         </div>
    //       </div>
    //     </>
    //   )}
    // </div>
    <><Dashboard /></>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Account Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Notifications
            </label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2">Task updates</span>
              </label>
            </div>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2">Friend requests</span>
              </label>
            </div>
          </div>
          <div>
            <button className="flex items-center text-indigo-600 hover:text-indigo-800">
              <KeyIcon className="h-5 w-5 mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === "profile"
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === "stats"
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Statistics
            </button>
            {/* <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === "settings"
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Settings
            </button> */}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && renderProfile()}
          {activeTab === "stats" && renderStats()}
          {/* {activeTab === "settings" && renderSettings()} */}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
