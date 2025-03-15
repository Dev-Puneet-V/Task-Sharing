"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const ws_1 = __importDefault(require("ws"));
class RoomManager {
    constructor() {
        this.clients = new Map();
        this.roomToClients = new Map();
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
        const client = this.clients.get(userId);
        if (client) {
            // Remove client from all their rooms
            client.activeRooms.forEach((roomId) => {
                const roomClients = this.roomToClients.get(roomId);
                if (roomClients) {
                    roomClients.delete(userId);
                    if (roomClients.size === 0) {
                        this.roomToClients.delete(roomId);
                    }
                }
            });
        }
        this.clients.delete(userId);
    }
    getClient(userId) {
        return this.clients.get(userId);
    }
    addToRoom(userId, roomId) {
        const client = this.clients.get(userId);
        if (client) {
            client.activeRooms.add(roomId);
            // Update room-to-clients mapping
            let roomClients = this.roomToClients.get(roomId);
            if (!roomClients) {
                roomClients = new Set();
                this.roomToClients.set(roomId, roomClients);
            }
            roomClients.add(userId);
        }
    }
    removeFromRoom(userId, roomId) {
        const client = this.clients.get(userId);
        if (client) {
            client.activeRooms.delete(roomId);
            // Update room-to-clients mapping
            const roomClients = this.roomToClients.get(roomId);
            if (roomClients) {
                roomClients.delete(userId);
                if (roomClients.size === 0) {
                    this.roomToClients.delete(roomId);
                }
            }
        }
    }
    deleteRoom(roomId) {
        const roomClients = this.roomToClients.get(roomId);
        if (roomClients) {
            // Remove room from each client's activeRooms
            roomClients.forEach((userId) => {
                const client = this.clients.get(userId);
                if (client) {
                    client.activeRooms.delete(roomId);
                }
            });
            // Delete the room entry
            this.roomToClients.delete(roomId);
            console.log(`Room ${roomId} has been deleted and cleaned up`);
        }
    }
    broadcastToRoom(roomId, message) {
        const roomClients = this.roomToClients.get(roomId);
        if (roomClients) {
            roomClients.forEach((userId) => {
                const client = this.clients.get(userId);
                if (client && client.ws.readyState === ws_1.default.OPEN) {
                    client.ws.send(JSON.stringify(message));
                }
            });
        }
    }
    getAllClients() {
        return this.clients;
    }
}
exports.RoomManager = RoomManager;
