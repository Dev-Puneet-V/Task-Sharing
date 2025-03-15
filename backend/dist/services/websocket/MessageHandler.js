"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
class MessageHandler {
    constructor(roomManager, authService) {
        this.roomManager = roomManager;
        this.authService = authService;
    }
    handleMessage(userId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this.roomManager.getClient(userId);
            if (!client) {
                console.error(`No client found for userId: ${userId}`);
                return;
            }
            try {
                switch (message.type) {
                    case "JOIN_ROOM":
                        yield this.handleJoinRoom(userId, message);
                        break;
                    case "LEAVE_ROOM":
                        this.handleLeaveRoom(userId, message);
                        break;
                    case "TASK_UPDATE":
                        yield this.handleTaskUpdate(userId, message);
                        break;
                    default:
                        console.log(`Unhandled message type: ${message.type}`);
                }
            }
            catch (error) {
                console.error(`Error handling WebSocket message: ${error}`);
            }
        });
    }
    handleJoinRoom(userId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!((_a = message === null || message === void 0 ? void 0 : message.payload) === null || _a === void 0 ? void 0 : _a.roomId) || !((_b = message === null || message === void 0 ? void 0 : message.payload) === null || _b === void 0 ? void 0 : _b.roomType)) {
                console.error(`Invalid JOIN_ROOM message from user ${userId}: Missing roomId or roomType`);
                return;
            }
            const { roomId, roomType } = message.payload;
            const roomTypeEnum = roomType;
            // Verify if user has access to this room
            const hasAccess = yield this.authService.verifyRoomAccess(userId, roomId, roomTypeEnum);
            if (!hasAccess) {
                yield this.authService.logUnauthorizedAccess(userId, "JOIN_ROOM", roomId, roomTypeEnum);
                return;
            }
            this.roomManager.addToRoom(userId, roomId);
            console.log(`User ${userId} joined ${roomTypeEnum} room ${roomId}`);
        });
    }
    handleLeaveRoom(userId, message) {
        var _a;
        if (!((_a = message === null || message === void 0 ? void 0 : message.payload) === null || _a === void 0 ? void 0 : _a.roomId)) {
            console.error(`Invalid LEAVE_ROOM message from user ${userId}: Missing roomId`);
            return;
        }
        const { roomId } = message.payload;
        this.roomManager.removeFromRoom(userId, roomId);
        console.log(`User ${userId} left room ${roomId}`);
    }
    handleTaskUpdate(userId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!((_a = message === null || message === void 0 ? void 0 : message.payload) === null || _a === void 0 ? void 0 : _a.updateType) || !((_c = (_b = message === null || message === void 0 ? void 0 : message.payload) === null || _b === void 0 ? void 0 : _b.updates) === null || _c === void 0 ? void 0 : _c._id)) {
                console.error(`Invalid TASK_UPDATE message from user ${userId}: Missing updateType or updates._id`);
                return;
            }
            const taskId = message.payload.updates._id;
            const updateType = message.payload.updateType;
            // All update operations require owner access
            const hasAccess = yield this.authService.verifyTaskAccess(userId, taskId, "owner");
            if (!hasAccess) {
                yield this.authService.logUnauthorizedAccess(userId, updateType, taskId, "TASK");
                return;
            }
            switch (updateType) {
                case "TASK_UPDATE":
                    this.roomManager.broadcastToRoom(taskId, {
                        type: "TASK_UPDATE",
                        payload: message.payload.updates,
                    });
                    break;
                case "UNSHARE_TASK":
                    this.roomManager.broadcastToRoom(taskId, {
                        type: "UNSHARE_TASK",
                        payload: message.payload.updates,
                    });
                    this.roomManager.removeFromRoom(userId, taskId);
                    break;
                case "SHARE_TASK":
                    this.roomManager.addToRoom(userId, taskId);
                    this.roomManager.broadcastToRoom(taskId, {
                        type: "SHARE_TASK",
                        payload: message.payload.updates,
                    });
                    break;
                case "DELETE_TASK":
                    this.roomManager.broadcastToRoom(taskId, {
                        type: "DELETE_TASK",
                        payload: message.payload.updates,
                    });
                    // Add a small delay before deleting the room to ensure all clients receive the message
                    setTimeout(() => {
                        this.roomManager.deleteRoom(taskId);
                    }, 1000); // 1 second delay
                    break;
                default:
                    console.log(`Unhandled update type: ${updateType}`);
            }
        });
    }
}
exports.MessageHandler = MessageHandler;
