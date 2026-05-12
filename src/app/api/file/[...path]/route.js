import { NextResponse } from "next/server";
import { getFileFromR2 } from "@/lib/r2";

/**
 * GET /api/file/[...path]
 * Proxy akses file dari R2 — URL ini bisa dishare tanpa expire
 * Contoh: /api/file/uploads/abc123_foto.png
 */
export async function GET(request, { params }) {
  try {
    const pathSegments = (await params).path;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: "Path file tidak valid" }, { status: 400 });
    }

    const key = pathSegments.join("/");

    const response = await getFileFromR2(key);

    // Stream response body ke client
    const headers = new Headers();
    if (response.ContentType) headers.set("Content-Type", response.ContentType);
    if (response.ContentLength) headers.set("Content-Length", String(response.ContentLength));
    
    // Cache di browser 1 jam, CDN 1 hari
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");

    return new Response(response.Body, { status: 200, headers });
  } catch (error) {
    console.error("File proxy error:", error);

    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal memuat file" }, { status: 500 });
  }
}
