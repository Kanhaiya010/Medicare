import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// to upload files to cloudinary
export async function uploadToCloudinary(filePath, folder = "Doctor") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });

    // remove local temp file after upload, but do not fail request if cleanup fails
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupErr) {
      console.warn(
        "Local upload temp cleanup failed:",
        cleanupErr?.message || cleanupErr,
      );
    }
    return result;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    // best-effort temp file cleanup on failed uploads as well
    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore cleanup failures here
    }
    throw err;
  }
}

export async function deleteFromCloudinary(publicId) {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw err;
  }
}

export default cloudinary;
