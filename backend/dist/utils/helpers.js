"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieParse = void 0;
const cookieParse = (cookie, cb) => {
    try {
        if (!cookie || !cookie.trim()) {
            throw new Error("No cookie found");
        }
        const parsedCookies = {};
        cookie.split("; ").forEach((token) => {
            const [key, value] = token.split("=");
            if (key && value) {
                parsedCookies[key.trim()] = value.trim();
            }
        });
        cb === null || cb === void 0 ? void 0 : cb(true, parsedCookies);
        return parsedCookies;
    }
    catch (error) {
        cb === null || cb === void 0 ? void 0 : cb(false, null);
        return null;
    }
};
exports.cookieParse = cookieParse;
