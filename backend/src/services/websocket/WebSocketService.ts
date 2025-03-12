import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

// Follows singleton pattern
class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  private constructor() {
    const port = parseInt(process.env.WEBSOCKET_PORT || "5001");
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();

    console.log(`WebSocket server starting on port ${port}`);
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
      console.log(
        `WebSocket server is listening on port ${
          process.env.WEBSOCKET_PORT || 5001
        }`
      );
    });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("New client connected");
      this.clients.add(ws);

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients.delete(ws);
      });

      ws.on("message", (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          console.log("Received message:", message);
          // Handle different message types here
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });
    });

    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  // Method to broadcast a message to all connected clients
  public broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

/* we are not exporting directly WebSocketService because we want to follow singleton pattern
if we want to pass more agruments then we can do that by creating a new instance of the class
can do that by creating a new instance of the class */

export default WebSocketService;
