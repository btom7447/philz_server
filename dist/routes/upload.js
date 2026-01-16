"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const uploadHelper_1 = require("../utils/uploadHelper");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload multiple images/videos
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: files
 *         type: file
 *         required: true
 *         description: Files to upload (images or videos)
 *       - in: formData
 *         name: folder
 *         type: string
 *         required: true
 *         description: Main folder (e.g., properties, testimonials)
 *       - in: formData
 *         name: subfolder
 *         type: string
 *         required: false
 *         description: Optional subfolder (e.g., images, videos)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid file or request
 *       500:
 *         description: Upload failed
 */
router.post("/", upload_1.upload.array("files"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const files = req.files;
        const { folder, subfolder } = req.body;
        if (!folder) {
            return res.status(400).json({ message: "Folder is required" });
        }
        const { uploaded, failed } = await (0, uploadHelper_1.uploadFilesToCloudinary)(files, folder, subfolder);
        res.status(200).json({
            message: "Files processed",
            uploaded,
            failed: failed.length > 0 ? failed : undefined,
        });
    }
    catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
});
exports.default = router;
