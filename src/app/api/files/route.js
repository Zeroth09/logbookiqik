import { NextResponse } from "next/server";
import { listFilesFromR2, deleteFileFromR2 } from "@/lib/r2";

/**
 * GET /api/files
 * List semua file dari R2, dengan proxy URL sebagai akses
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    const files = await listFilesFromR2(prefix, limit);

    // Filter: sembunyikan file internal sistem (logbook data, dll)
    const HIDDEN_PREFIXES = ["logbook/"];
    const publicFiles = files.filter(
      (file) => !HIDDEN_PREFIXES.some((p) => file.key.startsWith(p))
    );

    // Enrich data: ganti signed URL dengan proxy URL yang lebih bersih
    const enrichedFiles = publicFiles.map((file) => {
      const ext = file.key.split(".").pop()?.toLowerCase() || "";
      const filename = file.key.split("/").pop() || file.key;

      return {
        ...file,
        // Gunakan proxy URL yang tidak expire
        url: `/api/file/${file.key}`,
        filename,
        extension: ext,
        type: getFileCategory(ext),
        sizeFormatted: formatFileSize(file.size),
      };
    });

    return NextResponse.json({
      files: enrichedFiles,
      total: enrichedFiles.length,
    });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files
 * Hapus file dari R2
 */
export async function DELETE(request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "Key file tidak ditemukan" },
        { status: 400 }
      );
    }

    await deleteFileFromR2(key);

    return NextResponse.json({
      success: true,
      message: "File berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus file" },
      { status: 500 }
    );
  }
}

/**
 * Kategorikan file berdasarkan ekstensi
 */
function getFileCategory(ext) {
  const categories = {
    image: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"],
    document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"],
    video: ["mp4", "webm", "avi", "mov"],
    audio: ["mp3", "wav", "ogg", "m4a"],
    archive: ["zip", "rar", "7z", "tar", "gz"],
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) return category;
  }

  return "other";
}

/**
 * Format ukuran file ke human-readable
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
