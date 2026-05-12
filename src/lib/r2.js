import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 Client - S3-compatible storage
 * R2 endpoint BUKAN public URL. Akses file harus via signed URL atau proxy.
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

/**
 * Upload file ke R2
 */
export async function uploadFileToR2(fileBuffer, key, contentType, metadata = {}) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2Client.send(command);

  // Generate signed URL untuk akses file setelah upload
  const url = await getSignedUrlForFile(key);

  return {
    key,
    url,
    size: fileBuffer.length,
    contentType,
  };
}

/**
 * List semua file di R2 bucket dengan signed URLs
 */
export async function listFilesFromR2(prefix = "", maxKeys = 100) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix || undefined,
    MaxKeys: maxKeys,
  });

  const response = await r2Client.send(command);
  
  // Generate signed URL untuk setiap file
  const files = await Promise.all(
    (response.Contents || []).map(async (obj) => {
      const signedUrl = await getSignedUrlForFile(obj.Key);
      return {
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
        url: signedUrl,
      };
    })
  );

  return files;
}

/**
 * Hapus file dari R2
 */
export async function deleteFileFromR2(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await r2Client.send(command);
  return { success: true, key };
}

/**
 * Generate signed URL untuk akses temporary (1 jam)
 * Ini solusi karena R2 S3 endpoint butuh auth — bukan public URL
 */
export async function getSignedUrlForFile(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Get file sebagai stream untuk proxy
 */
export async function getFileFromR2(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const response = await r2Client.send(command);
  return response;
}
