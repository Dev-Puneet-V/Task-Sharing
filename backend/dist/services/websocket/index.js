"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const config_1 = __importDefault(require("../../config"));
class WebSocketService {
    constructor() {
        this.wss = new ws_1.WebSocketServer({
            port: config_1.default.wsPort,
        });
    }
    initialize() { }
}
