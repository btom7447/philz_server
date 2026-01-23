import { Router } from "express";
import { upload } from "../middleware/upload";
import { uploadFilesToCloudinary } from "../utils/uploadHelper";

const router = Router();

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

// Handle multiple fields at once
router.post("/", upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
  { name: "floorPlans", maxCount: 5 }
]), async (req, res) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]>;

    const allFiles = [
      ...(files.images || []),
      ...(files.videos || []),
      ...(files.floorPlans || []),
    ];

    const folder = req.body.folder || "properties";
    const { uploaded, failed } = await uploadFilesToCloudinary(allFiles, folder);

    res.status(200).json({
      message: "Files processed",
      uploaded,
      failed: failed.length ? failed : undefined,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

export default router;