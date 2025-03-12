import { Types } from "mongoose";

export interface FriendRequest {
  from: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
}

export interface SentFriendRequest {
  to: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
}

export interface FriendSearchFilters {
  query: string;
  limit?: number;
}

export interface FriendSearchResult {
  message: string;
  users: any[];
}
