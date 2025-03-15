import WebSocket, { WebSocketServer } from "ws";
import config from "../../config";

class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer;
  constructor() {
      this.wss = new WebSocketServer({
        port: config.wsPort as unknown as number,
      });
  }

    initialize() { }
}
