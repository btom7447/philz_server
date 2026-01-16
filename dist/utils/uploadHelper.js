"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFilesToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("./cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
];
const uploadFilesToCloudinary = async (files, folder, subfolder) => {
    const results = [];
    const failed = [];
    const cloudFolder = subfolder ? `${folder}/${subfolder}` : folder;
    const uploadFile = (file) => {
        return new Promise((resolve, reject) => {
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return reject({ name: file.originalname, error: "Invalid file type" });
            }
            const type = file.mimetype.startsWith("video") ? "video" : "image";
            const timestamp = Date.now();
            const publicId = `${cloudFolder}/${timestamp}-${file.originalname}`;
            const stream = cloudinary_1.default.uploader.upload_stream({
                folder: cloudFolder,
                resource_type: type,
                public_id: `${timestamp}-${file.originalname}`,
                eager: type === "video"
                    ? [{ width: 300, height: 200, crop: "scale" }]
                    : undefined,
            }, (error, result) => {
                if (error) {
                    reject({ name: file.originalname, error: error.message });
                }
                else {
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        type,
                        originalName: file.originalname,
                    });
                }
            });
            streamifier_1.default.createReadStream(file.buffer).pipe(stream);
        });
    };
    await Promise.all(files.map(async (file) => {
        try {
            const uploaded = await uploadFile(file);
            results.push(uploaded);
        }
        catch (err) {
            failed.push(err);
        }
    }));
    return { uploaded: results, failed };
};
exports.uploadFilesToCloudinary = uploadFilesToCloudinary;
