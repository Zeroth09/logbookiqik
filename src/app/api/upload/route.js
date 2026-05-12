import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";
import { compressImage, formatSize } from "@/lib/compress";
import { v4 as uuidv4 } from "uuid";

// Maksimal ukuran file 50MB (sebelum kompresi)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Extensi yang diizinkan
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  "application/zip", "application/x-rar-compressed",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/wav",
];

/**
 * Sanitasi nama file — hapus karakter berbahaya
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 100);
}

/**
 * POST /api/upload
 * Upload file ke R2 — gambar otomatis dikompresi ke ~150KB (WebP)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const folder = formData.get("folder") || "uploads";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada file yang dikirim" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      // Validasi tipe file
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push({
          name: file.name,
          error: `Tipe file "${file.type}" tidak diizinkan`,
        });
        continue;
      }

      // Validasi ukuran (sebelum kompresi)
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          name: file.name,
          error: `Ukuran file melebihi batas 50MB`,
        });
        continue;
      }

      let buffer = Buffer.from(await file.arrayBuffer());
      let contentType = file.type;
      const originalSize = buffer.length;

      // Kompresi otomatis untuk gambar
      const compressed = await compressImage(buffer, contentType);
      buffer = compressed.buffer;
      contentType = compressed.contentType;

      // Tentukan ekstensi file final
      const originalExt = file.name.split(".").pop() || "bin";
      const finalExt = compressed.compressed ? compressed.newExtension : originalExt;
      const safeName = sanitizeFilename(file.name.replace(`.${originalExt}`, ""));
      const uniqueId = uuidv4().split("-")[0];
      const key = `${folder}/${uniqueId}_${safeName}.${finalExt}`;

      const result = await uploadFileToR2(buffer, key, contentType, {
        originalName: file.name,
        originalSize: String(originalSize),
        compressed: String(compressed.compressed),
        uploadedAt: new Date().toISOString(),
      });

      results.push({
        ...result,
        url: `/api/file/${key}`,
        originalName: file.name,
        originalSize,
        finalSize: buffer.length,
        compressed: compressed.compressed,
        savings: compressed.compressed
          ? `${formatSize(originalSize)} → ${formatSize(buffer.length)}`
          : null,
      });
    }

    return NextResponse.json({
      uploaded: results,
      errors,
      total: results.length,
      failed: errors.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengupload file. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
