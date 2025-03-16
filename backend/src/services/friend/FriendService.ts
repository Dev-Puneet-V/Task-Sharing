import mongoose, { Types } from "mongoose";
import { User } from "../../models/User";
import {
  FriendRequest,
  FriendSearchFilters,
  FriendSearchResult,
} from "./types";
import { NotificationService } from "../notification/NotificationService";

export class FriendService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async sendFriendRequest(fromUserId: string, toUserEmail: string) {
    try {
      const toUser = await User.findOne({ email: toUserEmail });
      if (!toUser) {
        throw new Error("User not found");
      }

      const fromUser = await User.findById(fromUserId);
      if (!fromUser) {
        throw new Error("Sender not found");
      }

      // Check if already friends
      if (toUser.friends.includes(fromUserId as any)) {
        throw new Error("Already friends with this user");
      }

      // Check if request already sent
      const existingRequest = toUser.friendRequests.find(
        (req) => req.from.toString() === fromUserId
      );
      if (existingRequest) {
        throw new Error("Friend request already sent");
      }

      // Add friend request
      toUser.friendRequests.push({
        from: fromUserId as any,
        status: "pending",
      });
      await toUser.save();

      // Create notification for friend request
      await this.notificationService.createNotification(
        toUser?._id as string,
        "FRIEND_REQUEST",
        `${fromUser.name} sent you a friend request`,
        { userId: fromUser._id, name: fromUser.name }
      );

      return { message: "Friend request sent successfully" };
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  }

  async respondToFriendRequest(
    userId: string,
    fromUserId: string,
    status: "accepted" | "rejected"
  ) {
    try {
      const [user, fromUser] = await Promise.all([
        User.findById(userId),
        User.findById(fromUserId),
      ]);

      if (!user || !fromUser) {
        throw new Error("User not found");
      }

      // Find and update the friend request
      const requestIndex = user.friendRequests.findIndex(
        (req) => req.from.toString() === fromUserId
      );

      if (requestIndex === -1) {
        throw new Error("Friend request not found");
      }

      if (status === "accepted") {
        // Add each user to the other's friends list
        user.friends.push(fromUserId as any);
        fromUser.friends.push(userId as any);

        // Create notification for accepted request
        await this.notificationService.createNotification(
          fromUserId,
          "FRIEND_ACCEPTED",
          `${user.name} accepted your friend request`,
          { userId: user._id, name: user.name }
        );
      }

      // Remove the request
      user.friendRequests.splice(requestIndex, 1);

      await Promise.all([user.save(), fromUser.save()]);

      return { message: `Friend request ${status}` };
    } catch (error) {
      console.error("Error responding to friend request:", error);
      throw error;
    }
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
