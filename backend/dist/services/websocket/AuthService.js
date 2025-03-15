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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_1 = require("../../utils/auth");
const helpers_1 = require("../../utils/helpers");
const Task_1 = require("../../models/Task");
const mongoose_1 = __importDefault(require("mongoose"));
class AuthService {
    verifyOrigin(origin, allowedOrigins) {
        return __awaiter(this, void 0, void 0, function* () {
            return allowedOrigins.includes(origin);
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
    verifyTaskAccess(userId_1, taskId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, taskId, requiredRole = "shared") {
            try {
                const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
                // Only fetch owner and sharedWith fields for faster query
                const task = yield Task_1.Task.findById(taskId)
                    .select("owner sharedWith")
                    .lean();
                if (!task)
                    return false;
                if (requiredRole === "owner") {
                    return task.owner.equals(userObjectId);
                }
                return (task.owner.equals(userObjectId) ||
                    task.sharedWith.some((id) => id.equals(userObjectId)));
            }
            catch (error) {
                console.error(`Error verifying task access: ${error}`);
                return false;
            }
        });
    }
    verifyRoomAccess(userId_1, roomId_1, roomType_1) {
        return __awaiter(this, arguments, void 0, function* (userId, roomId, roomType, requiredRole = "shared") {
            // For now, we only have task rooms, but this can be extended for other room types
            if (roomType === "TASK") {
                return this.verifyTaskAccess(userId, roomId, requiredRole);
            }
            else if (roomType === "CHAT") {
                // Implement chat room access verification
                // For now, return false as it's not implemented
                return false;
            }
            else if (roomType === "NOTIFICATION") {
                // Users can only access their own notification rooms
                return roomId === userId;
            }
            return false;
        });
    }
    logUnauthorizedAccess(userId, action, resourceId, resourceType) {
        return __awaiter(this, void 0, void 0, function* () {
            // Log unauthorized access attempts for security monitoring
            console.error(`SECURITY: Unauthorized ${action} attempt by user ${userId} on ${resourceType} ${resourceId}`);
        });
    }
}
exports.AuthService = AuthService;
