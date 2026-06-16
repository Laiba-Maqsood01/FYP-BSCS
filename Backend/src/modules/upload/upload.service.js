import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config/config.js";

// Configure Cloudinary once at module load
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Generate a signed upload signature for one image.
 * The frontend uses these params to POST directly to Cloudinary —
 * the binary never passes through our server.
 *
 * @param {string} folder  - e.g. "listings" or "inspection-reports"
 * @returns {{ signature, timestamp, folder, api_key, cloud_name }}
 */

// Generating signs for pdf and images
export function generateSignature(folder = "listings", resourceType = "image") {
  const timestamp = Math.round(Date.now() / 1000);

  // Params that must be signed — must match exactly what the frontend sends
  const paramsToSign = {
    folder,
    timestamp,
  };

  // Cloudinary signature: SHA-1 of sorted key=value pairs + api_secret
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    config.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    resource_type: resourceType,
    api_key: config.CLOUDINARY_API_KEY,
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
  };
}


/**
 * Delete resources from Cloudinary by their public_ids.
 *
 * @param {string[]} fileIds       - array of Cloudinary public_ids
 * @param {"image"|"raw"} resourceType - "image" for photos, "raw" for PDFs
 */

export async function deleteFiles(fileIds = [], resourceType = "image") {
  if (!fileIds || fileIds.length === 0) return;

  await cloudinary.api.delete_resources(fileIds, {
    resource_type: resourceType,
  });
}

// Convenience wrapper for listing images
export async function deleteImages(fileIds = []) {
  return deleteFiles(fileIds, "image");
}

/**
 * Validate that a Cloudinary URL belongs to our account.
 * Prevents users submitting arbitrary external URLs into the images array.
 *
 * @param {string} url
 * @returns {boolean}
 */

export function isValidCloudinaryUrl(url) {
  if (!url || typeof url !== "string") return false;
  const expected = `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/`;
  return url.startsWith(expected);
}
