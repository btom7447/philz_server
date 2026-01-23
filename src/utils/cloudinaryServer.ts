import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const deleteFilesFromCloudinary = async (publicIds: string[]) => {
  const results: { public_id: string; result: string | null; error?: any }[] =
    [];

  for (const public_id of publicIds) {
    try {
      const result = await cloudinary.v2.uploader.destroy(public_id, {
        invalidate: true, // remove from CDN cache
        resource_type: "auto", // auto-detect image/video
      });
      results.push({ public_id, result: result.result });
    } catch (err) {
      results.push({ public_id, result: null, error: err });
    }
  }

  return results;
};