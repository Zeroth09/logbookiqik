"use client";

import { useCallback, useRef, useState } from "react";

/**
 * UploadZone — Area drag & drop + clipboard paste
 * Mendukung: drag file, klik browse, Ctrl+V paste screenshot/file
 */
export default function UploadZone({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (files) => {
      if (files.length > 0 && onUpload) {
        onUpload(Array.from(files));
      }
    },
    [onUpload]
  );

  // ===== DRAG & DROP =====
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    handleFiles(e.dataTransfer.files);
  };

  // ===== FILE INPUT =====
  const handleFileInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = ""; // Reset supaya bisa upload file yang sama
  };

  const handleClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload area - klik, drag file, atau paste dari clipboard"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInput}
        style={{ display: "none" }}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.mp4,.webm,.mp3,.wav"
      />

      <div className="upload-zone-icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      {dragging ? (
        <div>
          <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-accent-hover)" }}>
            Lepaskan file di sini
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 4 }}>
            File akan langsung diupload
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 4 }}>
            Drag & drop file di sini
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: 12 }}>
            atau klik untuk browse file dari perangkat
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span className="clipboard-hint">
              <span className="kbd">Ctrl</span>+<span className="kbd">V</span> paste screenshot
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
