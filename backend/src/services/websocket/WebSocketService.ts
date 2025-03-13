import WebSocket, { WebSocketServer } from "ws";
import config from "../../config";
import { verifyToken } from "../../utils/auth";
import { cookieParse } from "../../utils/helpers";

interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  connectedAt: Date;
  activeRooms: Set<string>;
}

interface WebSocketMessage {
  type: "JOIN_TASK" | "LEAVE_TASK" | "TASK_UPDATE";
  payload: Record<string, any>;
}

// Follows singleton pattern
class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient>;

  private constructor() {
    this.clients = new Map();
    this.wss = new WebSocketServer(
      {
        port: config.wsPort as unknown as number,
        verifyClient: async (info, cb) => {
          try {
            // Origin verification
            const originValid = await this.verifyOrigin(info.origin);
            if (!originValid) {
              cb(false, 403, "Origin not allowed");
              return;
            }

            // Authentication
            const userId = await this.authenticateClient(
              info.req.headers.cookie
            );
            if (!userId) {
              cb(false, 401, "Unauthorized");
              return;
            }

            // Attach userId to request for later use
            (info.req as any).userId = userId;
            // cb(true);
          } catch (error) {
            console.error("WebSocket verification error:", error);
            cb(false, 500, "Internal server error");
          }
        },
      },
      () => {
        console.log(`WebSocket server starting on port ${config.wsPort}`);
      }
    );
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

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public getWss() {
    return this.wss;
  }

  public connect() {
    this.wss.on("listening", () => {
      console.log(`WebSocket server is listening on port ${config.wsPort}`);
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

    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  private handleMessage(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (!client) {
      console.error(`No client found for userId: ${userId}`);
      return;
    }

    switch (message.type) {
      case "JOIN_TASK":
        client.activeRooms.add(message.payload.taskId);
        break;
      case "LEAVE_TASK":
        client.activeRooms.delete(message.payload.taskId);
        break;
      default:
        console.log(`Unhandled message type: ${message.type}`);
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
}

/* we are not exporting directly WebSocketService because we want to follow singleton pattern
if we want to pass more agruments then we can do that by creating a new instance of the class
can do that by creating a new instance of the class */

export default WebSocketService;
