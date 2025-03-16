import mongoose, { Document, Schema } from "mongoose";

interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | "TASK_SHARED"
    | "TASK_UNSHARED"
    | "TASK_DELETED"
    | "TASK_UPDATED"
    | "FRIEND_REQUEST"
    | "FRIEND_ACCEPTED";
  message: string;
  isRead: boolean;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "TASK_SHARED",
        "TASK_UNSHARED",
        "TASK_DELETED",
        "TASK_UPDATED",
        "FRIEND_REQUEST",
        "FRIEND_ACCEPTED",
      ],
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
export type { INotification };
