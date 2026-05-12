"use client";

import FileCard from "./FileCard";

/**
 * FileGrid — Grid responsif untuk menampilkan semua file
 * Dengan search filter dan empty state
 */
export default function FileGrid({ files, searchQuery, onDelete, onPreview, loading }) {
  // Filter berdasarkan search
  const filteredFiles = searchQuery
    ? files.filter((f) =>
        f.filename.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  if (loading) {
    return (
      <div className="empty-state">
        <div className="upload-spinner" style={{ margin: "0 auto 16px" }} />
        <p>Memuat file...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📁</div>
        <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 4 }}>
          Belum ada file
        </p>
        <p style={{ fontSize: "0.875rem" }}>
          Upload file pertamamu dengan drag & drop atau paste
        </p>
      </div>
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 4 }}>
          Tidak ditemukan
        </p>
        <p style={{ fontSize: "0.875rem" }}>
          Tidak ada file yang cocok dengan &quot;{searchQuery}&quot;
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {filteredFiles.map((file) => (
        <FileCard
          key={file.key}
          file={file}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}
