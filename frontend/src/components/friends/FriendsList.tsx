import React, { useState, useEffect } from "react";
import {
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import api from "../../utils/axios";

interface Friend {
  _id: string;
  name: string;
  email: string;
}

interface FriendRequest {
  from: Friend;
  status: "pending" | "accepted" | "rejected";
}

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);

  // Fetch friends and friend requests
  const fetchFriendsData = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests"),
      ]);
      setFriends(friendsRes.data.data);
      setFriendRequests(requestsRes.data.data);
      setError("");
    } catch (err) {
      console.error("Error fetching friends data:", err);
      setError("Failed to load friends data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  // Send friend request
  const handleSendRequest = async (email: string) => {
    try {
      await api.post("/friends/request", { email });
      setSearchResults(searchResults.filter((user) => user.email !== email));
      setShowAddFriend(false);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send friend request");
    }
  };

  // Accept/Reject friend request
  const handleRequestResponse = async (
    userId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      await api.patch(`/friends/request/${userId}`, { status });
      fetchFriendsData(); // Refresh the lists
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to process friend request");
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      await api.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove friend");
    }
  };

  // Search potential friends
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);

  const searchPotentialFriends = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data } = await api.get(
        `/friends/new?query=${encodeURIComponent(query)}`
      );
      setSearchResults(data.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to search users");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Friends</h1>
        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add Friend
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add Friend Section */}
      {showAddFriend && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Find Friends</h2>
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchPotentialFriends(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-60 overflow-y-auto">
            {searching ? (
              <div className="text-center py-4">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.email)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Send Request
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-4 text-gray-500">
                No users found
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Friend Requests Section */}
      {friendRequests?.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Friend Requests</h2>
          <div className="space-y-3">
            {friendRequests?.map((request) => (
              <div
                key={request.from._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <div className="font-medium">{request.from.name}</div>
                  <div className="text-sm text-gray-500">
                    {request.from.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleRequestResponse(request.from._id, "accepted")
                    }
                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      handleRequestResponse(request.from._id, "rejected")
                    }
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">My Friends</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : friends?.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No friends yet</div>
        ) : (
          <div className="space-y-3">
            {friends?.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <div className="font-medium">{friend.name}</div>
                  <div className="text-sm text-gray-500">{friend.email}</div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend._id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Remove friend"
                >
                  <UserMinusIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
