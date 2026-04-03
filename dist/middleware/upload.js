"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const ALLOWED_IMAGE_MIMES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
];
const ALLOWED_VIDEO_MIMES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
];
const ALLOWED_MIMES = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES];
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} is not allowed. Accepted: images (jpeg, png, gif, webp, avif) and videos (mp4, webm, mov).`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter,
});
