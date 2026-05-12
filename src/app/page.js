"use client";

import { useState, useEffect, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import FileGrid from "@/components/FileGrid";
import Lightbox from "@/components/Lightbox";
import Toast from "@/components/Toast";

export default function HomePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [toast, setToast] = useState(null);

  // ===== LOAD FILES =====
  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      showToast("Gagal memuat file", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ===== CLIPBOARD PASTE (Ctrl+V) =====
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];

      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        await handleUpload(pastedFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // ===== UPLOAD FILES =====
  const handleUpload = async (fileList) => {
    if (uploading || fileList.length === 0) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      fileList.forEach((file) => formData.append("files", file));

      setUploadProgress(30);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const data = await res.json();

      if (data.error) {
        showToast(data.error, "error");
        return;
      }

      setUploadProgress(100);

      const successCount = data.total || 0;
      const failCount = data.failed || 0;

      if (successCount > 0) {
        showToast(
          `${successCount} file berhasil diupload${failCount > 0 ? `, ${failCount} gagal` : ""}`,
          failCount > 0 ? "warning" : "success"
        );
        await loadFiles();
      } else {
        showToast("Tidak ada file yang berhasil diupload", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan saat upload", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== DELETE FILE =====
  const handleDelete = async (key) => {
    try {
      const res = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (data.success) {
        setFiles((prev) => prev.filter((f) => f.key !== key));
        showToast("File berhasil dihapus", "success");
      } else {
        showToast(data.error || "Gagal menghapus file", "error");
      }
    } catch {
      showToast("Gagal menghapus file", "error");
    }
  };

  // ===== TOAST HELPER =====
  const showToast = (message, type = "info") => {
    setToast({ message, type, id: Date.now() });
  };

  // ===== STATS =====
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const formatTotalSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background Glow */}
      <div className="header-glow" />

      {/* Uploading Overlay */}
      {uploading && (
        <div className="upload-overlay">
          <div className="upload-spinner" />
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Mengupload file...</p>
          <div className="progress-bar" style={{ maxWidth: 300 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #f0f0f5, #818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 4,
                }}
              >
                📦 Logbook Storage
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {files.length} file · {formatTotalSize(totalSize)}
              </p>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-text-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Cari file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-files"
              />
            </div>
          </div>
        </header>

        {/* Upload Zone */}
        <section style={{ marginBottom: 32 }}>
          <UploadZone onUpload={handleUpload} uploading={uploading} />
        </section>

        {/* File Grid */}
        <section>
          <FileGrid
            files={files}
            searchQuery={searchQuery}
            onDelete={handleDelete}
            onPreview={setPreviewFile}
            loading={loading}
          />
        </section>
      </main>

      {/* Lightbox */}
      {previewFile && (
        <Lightbox file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
