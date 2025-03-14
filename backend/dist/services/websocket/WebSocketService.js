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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const config_1 = __importDefault(require("../../config"));
const auth_1 = require("../../utils/auth");
const helpers_1 = require("../../utils/helpers");
// Follows singleton pattern
class WebSocketService {
    constructor() {
        this.clients = new Map();
        this.wss = new ws_1.WebSocketServer({
            port: config_1.default.wsPort,
            verifyClient: (info, cb) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Origin verification
                    const originValid = yield this.verifyOrigin(info.origin);
                    if (!originValid) {
                        cb(false, 403, "Origin not allowed");
                        return;
                    }
                    // Authentication
                    const userId = yield this.authenticateClient(info.req.headers.cookie);
                    if (!userId) {
                        cb(false, 401, "Unauthorized");
                        return;
                    }
                    // Attach userId to request for later use
                    info.req.userId = userId;
                    cb(true);
                }
                catch (error) {
                    console.error("WebSocket verification error:", error);
                    cb(false, 500, "Internal server error");
                }
            }),
        }, () => {
            console.log(`WebSocket server starting on port ${config_1.default.wsPort}`);
        });
    }
    verifyOrigin(origin) {
        return __awaiter(this, void 0, void 0, function* () {
            return config_1.default.allowedOrigins.includes(origin);
        });
    }
    authenticateClient(cookieHeader) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!cookieHeader)
                return null;
            const parsedCookie = (0, helpers_1.cookieParse)(cookieHeader);
            if (!(parsedCookie === null || parsedCookie === void 0 ? void 0 : parsedCookie.token))
                return null;
            return yield (0, auth_1.verifyToken)(parsedCookie.token);
        });
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
            console.log(`WebSocket server is listening on port ${config_1.default.wsPort}`);
        });
        this.wss.on("connection", (ws, request) => {
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
            ws.on("message", (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(userId, message);
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
    handleMessage(userId, message) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const client = this.clients.get(userId);
        if (!client) {
            console.error(`No client found for userId: ${userId}`);
            return;
        }
        switch (message.type) {
            case "JOIN_ROOM":
                if ((_a = message === null || message === void 0 ? void 0 : message.payload) === null || _a === void 0 ? void 0 : _a.roomId) {
                    client.activeRooms.add(message.payload.roomId);
                }
                break;
            case "LEAVE_ROOM":
                if ((_b = message === null || message === void 0 ? void 0 : message.payload) === null || _b === void 0 ? void 0 : _b.roomId) {
                    client.activeRooms.delete(message.payload.roomId);
                }
                break;
            case "UPDATE_ROOM":
                if (((_c = message === null || message === void 0 ? void 0 : message.payload) === null || _c === void 0 ? void 0 : _c.updateType) === "TASK_UPDATE" &&
                    ((_e = (_d = message === null || message === void 0 ? void 0 : message.payload) === null || _d === void 0 ? void 0 : _d.updates) === null || _e === void 0 ? void 0 : _e._id)) {
                    this.broadcastToTask(message.payload.updates._id, {
                        type: "TASK_UPDATE",
                        payload: message.payload.updates,
                    });
                }
                else if (((_f = message === null || message === void 0 ? void 0 : message.payload) === null || _f === void 0 ? void 0 : _f.updateType) === "UNSHARE_TASK" &&
                    ((_h = (_g = message === null || message === void 0 ? void 0 : message.payload) === null || _g === void 0 ? void 0 : _g.updates) === null || _h === void 0 ? void 0 : _h._id)) {
                    this.broadcastToTask(message.payload.updates._id, {
                        type: "UNSHARE_TASK",
                        payload: message.payload.updates,
                    });
                    this.removeFromClient(userId, message.payload.updates._id);
                }
                else if (((_j = message === null || message === void 0 ? void 0 : message.payload) === null || _j === void 0 ? void 0 : _j.updateType) === "SHARE_TASK" &&
                    ((_l = (_k = message === null || message === void 0 ? void 0 : message.payload) === null || _k === void 0 ? void 0 : _k.updates) === null || _l === void 0 ? void 0 : _l._id)) {
                    console.log("TASK FJFJ", message.payload);
                    this.addToClient(userId, message.payload.updates._id);
                    this.broadcastToTask(message.payload.updates._id, {
                        type: "SHARE_TASK",
                        payload: message.payload.updates,
                    });
                }
                break;
            default:
                console.log(`Unhandled message type: ${message.type}`);
        }
    }
    addClient(ws, userId) {
        const client = {
            ws,
            userId,
            connectedAt: new Date(),
            activeRooms: new Set(),
        };
        this.clients.set(userId, client);
    }
    removeClient(userId) {
        this.clients.delete(userId);
    }
    removeFromClient(userId, roomId) {
        const client = this.clients.get(userId);
        if (client) {
            client.activeRooms.delete(roomId);
        }
    }
    addToClient(userId, roomId) {
        const client = this.clients.get(userId);
        if (client) {
            client.activeRooms.add(roomId);
        }
    }
    broadcastToTask(taskId, message) {
        for (const [userId, client] of this.clients) {
            if (client.activeRooms.has(taskId) &&
                client.ws.readyState === ws_1.default.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        }
    }
}
/* we are not exporting directly WebSocketService because we want to follow singleton pattern
if we want to pass more agruments then we can do that by creating a new instance of the class
can do that by creating a new instance of the class */
exports.default = WebSocketService;
