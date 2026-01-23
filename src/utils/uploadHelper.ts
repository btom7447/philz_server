import { Express } from "express";
import cloudinary from "./cloudinary";
import streamifier from "streamifier";

type UploadFileResult = {
  url: string;
  public_id: string;
  type: "image" | "video";
  originalname: string; // <- matches Multer
  fieldName: string; // <- new, keeps track of the original FormData field
};

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

export const uploadFilesToCloudinary = async (
  files: Express.Multer.File[],
  folder: string,
  subfolder?: string
): Promise<{ uploaded: UploadFileResult[]; failed: any[] }> => {
  const results: UploadFileResult[] = [];
  const failed: any[] = [];

  const cloudFolder = subfolder ? `${folder}/${subfolder}` : folder;

  const uploadFile = (file: Express.Multer.File) => {
    return new Promise<UploadFileResult>((resolve, reject) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return reject({ name: file.originalname, error: "Invalid file type" });
      }

      const type = file.mimetype.startsWith("video") ? "video" : "image";
      const timestamp = Date.now();
      const publicId = `${cloudFolder}/${timestamp}-${file.originalname}`;

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: cloudFolder,
          resource_type: type,
          public_id: `${timestamp}-${file.originalname}`,
          eager:
            type === "video"
              ? [{ width: 300, height: 200, crop: "scale" }]
              : undefined,
        },
        (error, result) => {
          if (error) {
            reject({ name: file.originalname, error: error.message });
          } else {
            resolve({
              url: result!.secure_url,
              public_id: result!.public_id,
              type,
              originalname: file.originalname,
              fieldName: file.fieldname, // <- important for controller separation
            });
          }
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  };

  await Promise.all(
    files.map(async (file) => {
      try {
        const uploaded = await uploadFile(file);
        results.push(uploaded);
      } catch (err) {
        failed.push(err);
      }
    })
  );

  return { uploaded: results, failed };
};