import React, { useState, useEffect } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import api from "../../utils/axios";

interface Friend {
  _id: string;
  name: string;
  email: string;
}

interface ShareTaskModalProps {
  taskId: string;
  currentSharedWith: Friend[];
  onClose: () => void;
  onShare: (taskId: string, friendIds: string[]) => Promise<void>;
  onUnshare: (taskId: string, friendIds: string[]) => Promise<void>;
}

const ShareTaskModal: React.FC<ShareTaskModalProps> = ({
  taskId,
  currentSharedWith,
  onClose,
  onShare,
  onUnshare,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);

  // Get current user's friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const response = await api.get("/friends");
        setFriends(response.data);
        setError("");
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError("Failed to load friends");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // Filter friends based on search query
  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle sharing with selected friends
  const handleShare = async () => {
    if (selectedFriends.length === 0) return;

    try {
      await onShare(
        taskId,
        selectedFriends.map((f) => f._id)
      );
      onClose();
    } catch (err) {
      console.error("Error sharing task:", err);
      setError("Failed to share task");
    }
  };

  // Handle unsharing with specific friends
  const handleUnshare = async (friendId: string) => {
    try {
      await onUnshare(taskId, [friendId]);
      // Remove from currentSharedWith in parent component
    } catch (err) {
      console.error("Error unsharing task:", err);
      setError("Failed to unshare task");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Share Task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          {/* Search input */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          {/* Currently shared with */}
          {currentSharedWith.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Shared with</h3>
              <div className="space-y-2">
                {currentSharedWith.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{friend.name}</div>
                      <div className="text-sm text-gray-500">
                        {friend.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnshare(friend._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friend list */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">{error}</div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No friends found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriends.some(
                    (f) => f._id === friend._id
                  );
                  const isAlreadyShared = currentSharedWith.some(
                    (f) => f._id === friend._id
                  );

                  if (isAlreadyShared) return null;

                  return (
                    <div
                      key={friend._id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedFriends((prev) =>
                          isSelected
                            ? prev.filter((f) => f._id !== friend._id)
                            : [...prev, friend]
                        );
                      }}
                    >
                      <div>
                        <div className="font-medium">{friend.name}</div>
                        <div className="text-sm text-gray-500">
                          {friend.email}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-5 w-5 text-blue-600"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedFriends.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareTaskModal;
