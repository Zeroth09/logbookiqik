import sharp from "sharp";

// Target ukuran file ~150KB
const TARGET_SIZE_KB = 150;
const TARGET_SIZE_BYTES = TARGET_SIZE_KB * 1024;

// Tipe gambar yang bisa dikompresi
const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"];

/**
 * Kompresi gambar secara otomatis agar tidak melebihi target size.
 * Menggunakan strategi: resize + turunkan quality secara bertahap.
 * 
 * Non-image files langsung dikembalikan tanpa perubahan.
 * 
 * @param {Buffer} buffer - File content
 * @param {string} contentType - MIME type
 * @returns {{ buffer: Buffer, contentType: string, compressed: boolean }}
 */
export async function compressImage(buffer, contentType) {
  // Skip kalau bukan gambar
  if (!COMPRESSIBLE_TYPES.includes(contentType)) {
    return { buffer, contentType, compressed: false };
  }

  // Skip kalau sudah kecil
  if (buffer.length <= TARGET_SIZE_BYTES) {
    return { buffer, contentType, compressed: false };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    // Semua gambar di-convert ke WebP (rasio kompresi terbaik)
    const outputType = "webp";
    const outputMime = "image/webp";

    // Strategi: coba beberapa kombinasi resize + quality
    // Mulai dari quality tinggi lalu turunkan sampai target tercapai
    const attempts = [
      { maxWidth: width, quality: 80 },
      { maxWidth: Math.min(width, 1920), quality: 75 },
      { maxWidth: Math.min(width, 1600), quality: 70 },
      { maxWidth: Math.min(width, 1280), quality: 60 },
      { maxWidth: Math.min(width, 1024), quality: 50 },
      { maxWidth: Math.min(width, 800), quality: 40 },
      { maxWidth: Math.min(width, 640), quality: 35 },
    ];

    for (const attempt of attempts) {
      let pipeline = sharp(buffer);

      // Resize hanya kalau lebar melebihi maxWidth
      if (width > attempt.maxWidth) {
        pipeline = pipeline.resize(attempt.maxWidth, null, {
          withoutEnlargement: true,
          fit: "inside",
        });
      }

      const result = await pipeline
        .webp({ quality: attempt.quality })
        .toBuffer();

      if (result.length <= TARGET_SIZE_BYTES) {
        return {
          buffer: result,
          contentType: outputMime,
          compressed: true,
          originalSize: buffer.length,
          compressedSize: result.length,
          quality: attempt.quality,
          newExtension: outputType,
        };
      }
    }

    // Fallback: kompresi paling agresif
    const fallback = await sharp(buffer)
      .resize(640, null, { withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 25 })
      .toBuffer();

    return {
      buffer: fallback,
      contentType: outputMime,
      compressed: true,
      originalSize: buffer.length,
      compressedSize: fallback.length,
      quality: 25,
      newExtension: outputType,
    };
  } catch (error) {
    // Kalau kompresi gagal, kembalikan file asli
    console.error("Compression error:", error.message);
    return { buffer, contentType, compressed: false };
  }
}

/**
 * Format ukuran file ke human readable
 */
export function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
