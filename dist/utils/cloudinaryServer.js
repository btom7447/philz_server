"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFilesFromCloudinary = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
// Configure Cloudinary
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const deleteFilesFromCloudinary = async (publicIds) => {
    const results = [];
    for (const public_id of publicIds) {
        try {
            const result = await cloudinary_1.default.v2.uploader.destroy(public_id, {
                invalidate: true, // remove from CDN cache
                resource_type: "auto", // auto-detect image/video
            });
            results.push({ public_id, result: result.result });
        }
        catch (err) {
            results.push({ public_id, result: null, error: err });
        }
    }
    return results;
};
exports.deleteFilesFromCloudinary = deleteFilesFromCloudinary;
