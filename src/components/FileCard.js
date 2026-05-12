"use client";

import { useState } from "react";
import Swal from "sweetalert2";

/**
 * FileCard — Card individu untuk setiap file
 * Tombol copy link & hapus selalu tampil di bawah card
 */
export default function FileCard({ file, onDelete, onPreview }) {
  const [copied, setCopied] = useState(false);

  const isImage = file.type === "image";

  // ===== COPY LINK =====
  const handleCopyUrl = async (e) => {
    e.stopPropagation();
    try {
      // Buat full URL (termasuk domain)
      const fullUrl = `${window.location.origin}${file.url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}${file.url}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ===== DELETE dengan SweetAlert =====
  const handleDelete = async (e) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: "Hapus file ini?",
      text: file.filename,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6366f1",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "#1a1a2e",
      color: "#f0f0f5",
      customClass: {
        popup: "swal-dark-popup",
        title: "swal-dark-title",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
      },
    });

    if (result.isConfirmed) {
      try {
        await onDelete(file.key);
        Swal.fire({
          title: "Terhapus!",
          text: "File berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: "#1a1a2e",
          color: "#f0f0f5",
        });
      } catch {
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan saat menghapus.",
          icon: "error",
          background: "#1a1a2e",
          color: "#f0f0f5",
        });
      }
    }
  };

  const handleClick = () => {
    if (isImage && onPreview) {
      onPreview(file);
    } else {
      window.open(file.url, "_blank");
    }
  };

  const getTypeIcon = () => {
    switch (file.type) {
      case "image": return "🖼️";
      case "document": return "📄";
      case "video": return "🎬";
      case "audio": return "🎵";
      case "archive": return "📦";
      default: return "📎";
    }
  };

  return (
    <div className="file-card">
      {/* Clickable Preview Area */}
      <div
        onClick={handleClick}
        style={{ cursor: isImage ? "zoom-in" : "pointer" }}
      >
        <div className="file-card-preview">
          {isImage ? (
            <img
              src={file.url}
              alt={file.filename}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `<span style="font-size:40px">${getTypeIcon()}</span>`;
              }}
            />
          ) : (
            <span style={{ fontSize: 40 }}>{getTypeIcon()}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="file-card-body">
        <div className="file-card-name" title={file.filename}>
          {file.filename}
        </div>
        <div className="file-card-meta">
          <span className={`file-type-badge ${file.type}`}>
            {file.extension}
          </span>
          <span>{file.sizeFormatted}</span>
        </div>

        {/* Action Buttons — selalu tampil */}
        <div className="file-card-buttons">
          <button
            className="btn-action btn-copy"
            onClick={handleCopyUrl}
            title="Salin link file"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
          <button
            className="btn-action btn-delete"
            onClick={handleDelete}
            title="Hapus file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
}
