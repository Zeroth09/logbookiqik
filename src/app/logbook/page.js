"use client";

import { useState, useEffect, useCallback } from "react";
import LogbookForm from "@/components/LogbookForm";
import LogbookTable from "@/components/LogbookTable";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function LogbookPage() {
  const [entries, setEntries] = useState([]);
  const [storageFiles, setStorageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // ===== LOAD LOGBOOK ENTRIES =====
  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/logbook");
      const data = await res.json();
      if (data.entries) setEntries(data.entries);
    } catch {
      showToast("Gagal memuat logbook", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== LOAD STORAGE FILES (untuk pilih bukti) =====
  const loadStorageFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) setStorageFiles(data.files);
    } catch {
      // Tidak critical, cukup log
      console.error("Gagal memuat file storage");
    }
  }, []);

  useEffect(() => {
    loadEntries();
    loadStorageFiles();
  }, [loadEntries, loadStorageFiles]);

  // ===== ADD ENTRY =====
  const handleAddEntry = async (entryData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Kegiatan berhasil ditambahkan", "success");
        await loadEntries();
      } else {
        showToast(data.error || "Gagal menambah kegiatan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== DELETE ENTRY =====
  const handleDeleteEntry = async (id) => {
    try {
      const res = await fetch("/api/logbook", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        showToast(data.error || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Gagal menghapus kegiatan", "error");
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type, id: Date.now() });
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div className="header-glow" />

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
                📋 Logbook Kegiatan
              </h1>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {entries.length} kegiatan tercatat
              </p>
            </div>

            {/* Nav */}
            <Link href="/" className="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Storage
            </Link>
          </div>
        </header>

        {/* Form */}
        <section style={{ marginBottom: 32 }}>
          <LogbookForm
            onSubmit={handleAddEntry}
            storageFiles={storageFiles}
            submitting={submitting}
          />
        </section>

        {/* Table */}
        <section>
          <LogbookTable
            entries={entries}
            onDelete={handleDeleteEntry}
            loading={loading}
          />
        </section>
      </main>

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
