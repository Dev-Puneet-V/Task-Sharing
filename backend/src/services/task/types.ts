import { Types } from "mongoose";

export interface TaskBody {
  title: string;
  description: string;
  dueDate?: Date;
  priority?: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "completed";
  tags?: string[];
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  skip?: number;
}

export interface TaskQueryResult {
  tasks: any[];
  total: number;
  hasMore: boolean;
}
