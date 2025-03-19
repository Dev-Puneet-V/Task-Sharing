import WebSocket, { WebSocketServer } from "ws";
import config from "../../config";
import { verifyToken } from "../../utils/auth";
import { cookieParse } from "../../utils/helpers";
import TaskService from "../task/TaskService";
import { Server } from "http";

interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  connectedAt: Date;
  activeRooms: Set<string>;
}

interface WebSocketMessage {
  type: "JOIN_ROOM" | "LEAVE_ROOM" | "TASK_UPDATE" | "NOTIFICATION";
  payload: Record<string, any>;
}

// Follows singleton pattern
class WebSocketService {
  private static instance: WebSocketService | null = null;
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient>;
  private taskService: TaskService | null = null;

  private constructor(server: Server) {
    this.clients = new Map();
    this.wss = new WebSocketServer({
      server,
      verifyClient: async (info, cb) => {
        try {
          // Origin verification
          const originValid = await this.verifyOrigin(info.origin);
          if (!originValid) {
            cb(false, 403, "Origin not allowed");
            return;
          }

          // Authentication
          const userId = await this.authenticateClient(info.req.headers.cookie);
          if (!userId) {
            cb(false, 401, "Unauthorized");
            return;
          }

          // Attach userId to request for later use
          (info.req as any).userId = userId;
          cb(true);
        } catch (error) {
          console.error("WebSocket verification error:", error);
          cb(false, 500, "Internal server error");
        }
      },
    });
  }

  private getTaskService(): TaskService {
    if (!this.taskService) {
      this.taskService = new TaskService();
    }
    return this.taskService;
  }

  private async verifyOrigin(origin: string): Promise<boolean> {
    return config.allowedOrigins.includes(origin);
  }

  private async authenticateClient(
    cookieHeader?: string
  ): Promise<string | null> {
    if (!cookieHeader) return null;

    const parsedCookie = cookieParse(cookieHeader);
    if (!parsedCookie?.token) return null;

    return await verifyToken(parsedCookie.token);
  }

  public static getInstance(server?: Server): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance!;
  }

  public getWss() {
    return this.wss;
  }

  public connect() {
    this.wss.on("listening", () => {
      console.log(`WebSocket server is listening on port ${config.port}`);
    });

    this.wss.on("connection", (ws: WebSocket, request: any) => {
      const userId = request.userId;
      console.log(`New client connected: ${userId}`);

      this.addClient(ws, userId);

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });

      ws.on("close", () => {
        console.log(`Client disconnected: ${userId}`);
        this.removeClient(userId);
      });

      ws.on("message", (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(userId, message);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });
    });

    this.wss.on("error", (error: any) => {
      console.error("WebSocket server error:", error);
    });
  }

  private async handleMessage(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (!client) {
      console.error(`No client found for userId: ${userId}`);
      return;
    }

    const taskService = this.getTaskService();

    try {
      switch (message.type) {
        case "JOIN_ROOM": {
          const roomId = message?.payload?.roomId;
          if (!roomId) break;

          if (message?.payload?.roomType === "TASK") {
            const rights = await taskService.getRights(userId, roomId);
            if (!(rights?.isAdmin || rights?.isShared)) break;
          }
          client.activeRooms.add(roomId);
          break;
        }

        case "LEAVE_ROOM": {
          const roomId = message?.payload?.roomId;
          if (!roomId) break;

          if (message?.payload?.roomType === "TASK") {
            const rights = await taskService.getRights(userId, roomId);
            if (!(rights?.isAdmin || rights?.isShared)) break;
          }
          client.activeRooms.delete(roomId);
          break;
        }

        case "UPDATE_ROOM": {
          const { updateType, updates, roomId } = message?.payload || {};
          if (!updates?._id || !updateType) break;

          const rights = await taskService.getRights(userId, updates._id);

          switch (updateType) {
            case "TASK_UPDATE": {
              if (
                rights?.isAdmin ||
                (rights?.isShared && updates?.isStatusChanged)
              ) {
                this.broadcastToTask(updates._id, {
                  type: "TASK_UPDATE",
                  payload: updates,
                });
              }
              break;
            }

            case "SHARE_TASK": {
              if (rights?.isAdmin) {
                this.addToClient(userId, updates._id);
                this.broadcastToTask(updates._id, {
                  type: "SHARE_TASK",
                  payload: updates,
                });
              }
              break;
            }

            case "UNSHARE_TASK": {
              if (rights?.isAdmin) {
                this.broadcastToTask(updates._id, {
                  type: "UNSHARE_TASK",
                  payload: updates,
                });
                this.removeFromClient(userId, updates._id);
              }
              break;
            }
          }
          break;
        }

        default:
          console.log(`Unhandled message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  private addClient(ws: WebSocket, userId: string) {
    const client: WebSocketClient = {
      ws,
      userId,
      connectedAt: new Date(),
      activeRooms: new Set(),
    };
    this.clients.set(userId, client);
  }

  private removeClient(userId: string) {
    this.clients.delete(userId);
  }

  private async removeFromClient(userId: string, roomId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.activeRooms.delete(roomId);
    }
  }

  private addToClient(userId: string, roomId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.activeRooms.add(roomId);
    }
  }

  public broadcastToTask(taskId: string, message: any) {
    for (const [userId, client] of this.clients) {
      if (
        client.activeRooms.has(taskId) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  public sendToUser(userId: string, type: string, payload: any) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify({ type, payload }));
      } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
      }
    }
  }
}

/* we are not exporting directly WebSocketService because we want to follow singleton pattern
if we want to pass more agruments then we can do that by creating a new instance of the class
can do that by creating a new instance of the class */

export default WebSocketService;
