"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Follows singleton pattern
class WebSocketService {
    constructor() {
        const port = parseInt(process.env.WEBSOCKET_PORT || "5001");
        this.wss = new ws_1.WebSocketServer({ port });
        this.clients = new Set();
        console.log(`WebSocket server starting on port ${port}`);
    }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    getWss() {
        return this.wss;
    }
    connect() {
        this.wss.on("listening", () => {
            console.log(`WebSocket server is listening on port ${process.env.WEBSOCKET_PORT || 5001}`);
        });
        this.wss.on("connection", (ws) => {
            console.log("New client connected");
            this.clients.add(ws);
            ws.on("error", (error) => {
                console.error("WebSocket error:", error);
            });
            ws.on("close", () => {
                console.log("Client disconnected");
                this.clients.delete(ws);
            });
            ws.on("message", (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log("Received message:", message);
                    // Handle different message types here
                }
                catch (error) {
                    console.error("Error parsing message:", error);
                }
            });
        });
        this.wss.on("error", (error) => {
            console.error("WebSocket server error:", error);
        });
    }
    // Method to broadcast a message to all connected clients
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(messageStr);
            }
        });
    }
}
/* we are not exporting directly WebSocketService because we want to follow singleton pattern
if we want to pass more agruments then we can do that by creating a new instance of the class
can do that by creating a new instance of the class */
exports.default = WebSocketService;
