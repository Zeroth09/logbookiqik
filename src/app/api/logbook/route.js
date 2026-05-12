import { NextResponse } from "next/server";
import { uploadFileToR2, getFileFromR2 } from "@/lib/r2";

const LOGBOOK_KEY = "logbook/entries.json";

/**
 * Ambil data logbook dari R2
 */
async function getLogbookData() {
  try {
    const response = await getFileFromR2(LOGBOOK_KEY);
    const bodyString = await response.Body.transformToString("utf-8");
    return JSON.parse(bodyString);
  } catch (error) {
    // File belum ada = data kosong
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Simpan data logbook ke R2
 */
async function saveLogbookData(entries) {
  const buffer = Buffer.from(JSON.stringify(entries, null, 2), "utf-8");
  await uploadFileToR2(buffer, LOGBOOK_KEY, "application/json", {
    updatedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/logbook — Ambil semua entries
 */
export async function GET() {
  try {
    const entries = await getLogbookData();

    // Sort by tanggal + jam mulai
    entries.sort((a, b) => {
      const dateA = `${a.tanggal} ${a.jamMulai}`;
      const dateB = `${b.tanggal} ${b.jamMulai}`;
      return dateA.localeCompare(dateB);
    });

    return NextResponse.json({ entries, total: entries.length });
  } catch (error) {
    console.error("Get logbook error:", error);
    return NextResponse.json({ error: "Gagal memuat data logbook" }, { status: 500 });
  }
}

/**
 * POST /api/logbook — Tambah entry baru
 * Body: { tanggal, jamMulai, jamSelesai, kegiatan, buktiKey?, buktiFilename? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { tanggal, jamMulai, jamSelesai, kegiatan, buktiKey, buktiFilename } = body;

    // Validasi input
    if (!tanggal || !jamMulai || !jamSelesai || !kegiatan) {
      return NextResponse.json(
        { error: "Tanggal, jam mulai, jam selesai, dan kegiatan wajib diisi" },
        { status: 400 }
      );
    }

    const entries = await getLogbookData();

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tanggal,
      jamMulai,
      jamSelesai,
      kegiatan: kegiatan.trim(),
      buktiKey: buktiKey || null,
      buktiFilename: buktiFilename || null,
      createdAt: new Date().toISOString(),
    };

    entries.push(newEntry);
    await saveLogbookData(entries);

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error) {
    console.error("Add logbook error:", error);
    return NextResponse.json({ error: "Gagal menambah entry logbook" }, { status: 500 });
  }
}

/**
 * DELETE /api/logbook — Hapus entry by ID
 * Body: { id }
 */
export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID entry tidak ditemukan" }, { status: 400 });
    }

    const entries = await getLogbookData();
    const filtered = entries.filter((e) => e.id !== id);

    if (filtered.length === entries.length) {
      return NextResponse.json({ error: "Entry tidak ditemukan" }, { status: 404 });
    }

    await saveLogbookData(filtered);

    return NextResponse.json({ success: true, message: "Entry berhasil dihapus" });
  } catch (error) {
    console.error("Delete logbook error:", error);
    return NextResponse.json({ error: "Gagal menghapus entry" }, { status: 500 });
  }
}
