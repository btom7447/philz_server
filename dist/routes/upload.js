"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const auth_1 = require("../middleware/auth");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload multiple images/videos (requires auth)
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid file or request
 */
router.post("/", auth_1.protect, upload_1.upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "floorPlans", maxCount: 5 },
]), async (req, res) => {
    try {
        const files = req.files;
        const uploadOne = (file, folder, resource_type) => {
            return new Promise((resolve, reject) => {
                cloudinary_1.default.uploader
                    .upload_stream({
                    folder,
                    resource_type,
                }, (err, result) => {
                    if (err || !result)
                        return reject(err);
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        resource_type,
                    });
                })
                    .end(file.buffer);
            });
        };
        const uploads = [];
        for (const file of files.images || []) {
            uploads.push(uploadOne(file, "properties/images", "image"));
        }
        for (const file of files.videos || []) {
            uploads.push(uploadOne(file, "properties/videos", "video"));
        }
        for (const file of files.floorPlans || []) {
            uploads.push(uploadOne(file, "properties/floor-plans", "image"));
        }
        const results = await Promise.allSettled(uploads);
        res.status(200).json({
            uploaded: results
                .filter((r) => r.status === "fulfilled")
                .map((r) => r.value),
            failed: results
                .filter((r) => r.status === "rejected")
                .map((r) => r.reason),
        });
    }
    catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
});
exports.default = router;
