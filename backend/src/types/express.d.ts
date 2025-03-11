import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        friends?: Types.ObjectId[];
        friendRequests?: Array<{
          from: Types.ObjectId;
          status: string;
        }>;
      };
      token?: string;
    }
  }
}
