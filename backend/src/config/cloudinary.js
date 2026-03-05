/**
 * Cloudinary configuration.
 *
 * Required .env vars:
 *   CLOUDINARY_CLOUD_NAME   — your cloud name  (e.g. dq12abc34)
 *   CLOUDINARY_API_KEY      — API key
 *   CLOUDINARY_API_SECRET   — API secret  (keep server-side only)
 *
 * Usage:
 *   const { cloudinary, uploadFromBuffer, destroy } = require('./config/cloudinary');
 */

const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload a Buffer to Cloudinary.
 *
 * @param {Buffer} buffer
 * @param {object} options  — any Cloudinary upload options
 *                            e.g. { resource_type: 'video', folder: 'verto/videos' }
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadFromBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(new Error(err.message || 'Cloudinary upload failed'));
      resolve(result);
    });
    stream.end(buffer);
  });
}

/**
 * Delete a resource from Cloudinary.
 * Best-effort: does not throw on failure.
 *
 * @param {string} publicId
 * @param {'image'|'video'} resourceType
 */
async function destroy(publicId, resourceType = 'video') {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // best-effort delete — ignore errors
  }
}

module.exports = { cloudinary, uploadFromBuffer, destroy };
