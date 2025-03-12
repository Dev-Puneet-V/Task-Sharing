import mongoose, { Types } from "mongoose";
import { User } from "../../models/User";
import {
  FriendRequest,
  FriendSearchFilters,
  FriendSearchResult,
} from "./types";

export class FriendService {
  async sendFriendRequest(fromUserId: string, targetEmail: string) {
    const friend = await User.findOne({ email: targetEmail });

    if (!friend) {
      throw new Error("User not found");
    }

    if (friend._id?.toString() === fromUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if already friends
    const currentUser = await User.findById(fromUserId);
    if (!currentUser) {
      throw new Error("Current user not found");
    }

    if (
      currentUser.friends?.includes(
        friend._id as unknown as mongoose.Types.ObjectId
      )
    ) {
      throw new Error("Already friends with this user");
    }

    // Check if request already exists
    const existingRequest = friend.friendRequests.find(
      (request) => request.from.toString() === fromUserId
    );

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    const existingSentRequest = friend.sentFriendRequests.find(
      (request) => request.to.toString() === fromUserId
    );

    if (existingSentRequest) {
      throw new Error("Friend request already sent");
    }

    friend.friendRequests.push({
      from: new Types.ObjectId(fromUserId),
      status: "pending",
    });

    await User.findByIdAndUpdate(fromUserId, {
      sentFriendRequests: [
        ...(currentUser.sentFriendRequests || []),
        {
          to: friend._id,
          status: "pending",
        },
      ],
    });

    await friend.save();
    return { message: "Friend request sent successfully" };
  }

  async respondToFriendRequest(
    userId: string,
    fromUserId: string,
    status: "accepted" | "rejected"
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const request = user.friendRequests?.find(
      (request) =>
        request.from.toString() === fromUserId && request.status === "pending"
    );

    if (!request) {
      throw new Error("Friend request not found");
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { friendRequests: { from: fromUserId } },
      ...(status === "accepted" && { $push: { friends: fromUserId } }),
    });

    await User.findByIdAndUpdate(fromUserId, {
      $pull: { sentFriendRequests: { to: userId } },
      ...(status === "accepted" && { $push: { friends: userId } }),
    });

    return { message: `Friend request ${status}` };
  }

  async getFriendRequests(userId: string) {
    const user = await User.findById(userId).populate(
      "friendRequests.from",
      "_id name email"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user.friendRequests;
  }

  async getFriendsList(userId: string) {
    const user = await User.findById(userId).populate(
      "friends",
      "_id name email"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user.friends;
  }

  async searchPotentialFriends(
    userId: string,
    filters: FriendSearchFilters
  ): Promise<FriendSearchResult> {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Get IDs to exclude
    const friendIds = currentUser.friends || [];
    const pendingRequestIds = currentUser.friendRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.from);

    const sentRequestIds = currentUser.sentFriendRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.to);

    // Find users by email or name who are not already friends or have pending requests
    const potentialFriends = await User.find({
      $or: [
        { email: { $regex: filters.query, $options: "i" } },
        { name: { $regex: filters.query, $options: "i" } },
      ],
      _id: {
        $nin: [userId, ...friendIds, ...pendingRequestIds, ...sentRequestIds],
      },
    })
      .select("name email")
      .limit(filters.limit || 10);

    if (potentialFriends.length === 0) {
      return {
        message:
          "No matching users found or they might already be your friends",
        users: [],
      };
    }

    return {
      message: "Potential friends found successfully",
      users: potentialFriends,
    };
  }

  async getCurrentFriends(userId: string) {
    const user = await User.findById(userId).populate("friends");
    if (!user) {
      throw new Error("User not found");
    }
    return user.friends.filter((friend) => friend !== null);
  }

  async removeFriend(userId: string, friendId: string) {
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!user || !friend) {
      throw new Error("Friend not found");
    }

    // Remove friend from both users' friend lists
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    await Promise.all([user.save(), friend.save()]);

    return { message: "Friend removed successfully" };
  }
}

export default FriendService;
