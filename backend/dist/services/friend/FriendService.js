"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendService = void 0;
const mongoose_1 = require("mongoose");
const User_1 = require("../../models/User");
class FriendService {
    sendFriendRequest(fromUserId, targetEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const friend = yield User_1.User.findOne({ email: targetEmail });
            if (!friend) {
                throw new Error("User not found");
            }
            if (((_a = friend._id) === null || _a === void 0 ? void 0 : _a.toString()) === fromUserId) {
                throw new Error("Cannot send friend request to yourself");
            }
            // Check if already friends
            const currentUser = yield User_1.User.findById(fromUserId);
            if (!currentUser) {
                throw new Error("Current user not found");
            }
            if ((_b = currentUser.friends) === null || _b === void 0 ? void 0 : _b.includes(friend._id)) {
                throw new Error("Already friends with this user");
            }
            // Check if request already exists
            const existingRequest = friend.friendRequests.find((request) => request.from.toString() === fromUserId);
            if (existingRequest) {
                throw new Error("Friend request already sent");
            }
            const existingSentRequest = friend.sentFriendRequests.find((request) => request.to.toString() === fromUserId);
            if (existingSentRequest) {
                throw new Error("Friend request already sent");
            }
            friend.friendRequests.push({
                from: new mongoose_1.Types.ObjectId(fromUserId),
                status: "pending",
            });
            yield User_1.User.findByIdAndUpdate(fromUserId, {
                sentFriendRequests: [
                    ...(currentUser.sentFriendRequests || []),
                    {
                        to: friend._id,
                        status: "pending",
                    },
                ],
            });
            yield friend.save();
            return { message: "Friend request sent successfully" };
        });
    }
    respondToFriendRequest(userId, fromUserId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield User_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const request = (_a = user.friendRequests) === null || _a === void 0 ? void 0 : _a.find((request) => request.from.toString() === fromUserId && request.status === "pending");
            if (!request) {
                throw new Error("Friend request not found");
            }
            yield User_1.User.findByIdAndUpdate(userId, Object.assign({ $pull: { friendRequests: { from: fromUserId } } }, (status === "accepted" && { $push: { friends: fromUserId } })));
            yield User_1.User.findByIdAndUpdate(fromUserId, Object.assign({ $pull: { sentFriendRequests: { to: userId } } }, (status === "accepted" && { $push: { friends: userId } })));
            return { message: `Friend request ${status}` };
        });
    }
    getFriendRequests(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findById(userId).populate("friendRequests.from", "_id name email");
            if (!user) {
                throw new Error("User not found");
            }
            return user.friendRequests;
        });
    }
    getFriendsList(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findById(userId).populate("friends", "_id name email");
            if (!user) {
                throw new Error("User not found");
            }
            return user.friends;
        });
    }
    searchPotentialFriends(userId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = yield User_1.User.findById(userId);
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
            const potentialFriends = yield User_1.User.find({
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
                    message: "No matching users found or they might already be your friends",
                    users: [],
                };
            }
            return {
                message: "Potential friends found successfully",
                users: potentialFriends,
            };
        });
    }
    getCurrentFriends(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findById(userId).populate("friends");
            if (!user) {
                throw new Error("User not found");
            }
            return user.friends.filter((friend) => friend !== null);
        });
    }
    removeFriend(userId, friendId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [user, friend] = yield Promise.all([
                User_1.User.findById(userId),
                User_1.User.findById(friendId),
            ]);
            if (!user || !friend) {
                throw new Error("Friend not found");
            }
            // Remove friend from both users' friend lists
            user.friends = user.friends.filter((id) => id.toString() !== friendId);
            friend.friends = friend.friends.filter((id) => id.toString() !== userId);
            yield Promise.all([user.save(), friend.save()]);
            return { message: "Friend removed successfully" };
        });
    }
}
exports.FriendService = FriendService;
exports.default = FriendService;
