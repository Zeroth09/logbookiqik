import { NextResponse } from "next/server";
import { uploadFileToR2 } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

// Maksimal ukuran file 50MB
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
 * Upload satu atau banyak file ke R2
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

      // Validasi ukuran
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          name: file.name,
          error: `Ukuran file melebihi batas 50MB`,
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "bin";
      const safeName = sanitizeFilename(file.name.replace(`.${ext}`, ""));
      const uniqueId = uuidv4().split("-")[0];
      const key = `${folder}/${uniqueId}_${safeName}.${ext}`;

      const result = await uploadFileToR2(buffer, key, file.type, {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      });

      results.push({
        ...result,
        // Override dengan proxy URL yang tidak expire
        url: `/api/file/${key}`,
        originalName: file.name,
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
