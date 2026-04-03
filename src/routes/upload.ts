import { Router } from "express";
import { upload } from "../middleware/upload";
import { protect } from "../middleware/auth";
import cloudinary from "../utils/cloudinary";

const router = Router();

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

router.post(
  "/",
  protect,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "floorPlans", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;

      const uploadOne = (
        file: Express.Multer.File,
        folder: string,
        resource_type: "image" | "video",
      ) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder,
                resource_type,
              },
              (err, result) => {
                if (err || !result) return reject(err);
                resolve({
                  url: result.secure_url,
                  public_id: result.public_id,
                  resource_type,
                });
              },
            )
            .end(file.buffer);
        });
      };

      const uploads: any[] = [];

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
          .map((r: any) => r.value),
        failed: results
          .filter((r) => r.status === "rejected")
          .map((r: any) => r.reason),
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
  },
);

export default router;
