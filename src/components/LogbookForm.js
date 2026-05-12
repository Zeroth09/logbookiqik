"use client";

import { useState, useEffect } from "react";

/**
 * LogbookForm — Form pengisian logbook
 * Fields: Tanggal, Jam Mulai, Jam Selesai, Kegiatan, Bukti (pilih dari storage)
 */
export default function LogbookForm({ onSubmit, storageFiles, submitting }) {
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [buktiKey, setBuktiKey] = useState("");
  const [buktiFilename, setBuktiFilename] = useState("");
  const [showFilePicker, setShowFilePicker] = useState(false);

  // Default tanggal = hari ini
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTanggal(today);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tanggal || !jamMulai || !jamSelesai || !kegiatan.trim()) return;

    await onSubmit({
      tanggal,
      jamMulai,
      jamSelesai,
      kegiatan: kegiatan.trim(),
      buktiKey: buktiKey || null,
      buktiFilename: buktiFilename || null,
    });

    // Reset form (kecuali tanggal — biasa isi beberapa sekaligus)
    setJamMulai("");
    setJamSelesai("");
    setKegiatan("");
    setBuktiKey("");
    setBuktiFilename("");
  };

  const handleSelectBukti = (file) => {
    setBuktiKey(file.key);
    setBuktiFilename(file.filename);
    setShowFilePicker(false);
  };

  const handleClearBukti = () => {
    setBuktiKey("");
    setBuktiFilename("");
  };

  return (
    <form onSubmit={handleSubmit} className="logbook-form">
      <h3 className="logbook-form-title">Tambah Kegiatan</h3>

      <div className="logbook-form-grid">
        {/* Tanggal */}
        <div className="form-group">
          <label className="form-label" htmlFor="lb-tanggal">Hari/Tgl.</label>
          <input
            type="date"
            id="lb-tanggal"
            className="form-input"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
          />
        </div>

        {/* Jam Mulai */}
        <div className="form-group">
          <label className="form-label" htmlFor="lb-jam-mulai">Jam Mulai</label>
          <input
            type="time"
            id="lb-jam-mulai"
            className="form-input"
            value={jamMulai}
            onChange={(e) => setJamMulai(e.target.value)}
            required
          />
        </div>

        {/* Jam Selesai */}
        <div className="form-group">
          <label className="form-label" htmlFor="lb-jam-selesai">Jam Selesai</label>
          <input
            type="time"
            id="lb-jam-selesai"
            className="form-input"
            value={jamSelesai}
            onChange={(e) => setJamSelesai(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Uraian Kegiatan */}
      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label" htmlFor="lb-kegiatan">Uraian Kegiatan</label>
        <input
          type="text"
          id="lb-kegiatan"
          className="form-input"
          placeholder="Contoh: Rekap Data Akreditasi"
          value={kegiatan}
          onChange={(e) => setKegiatan(e.target.value)}
          required
          autoComplete="off"
        />
      </div>

      {/* Bukti */}
      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label">Bukti (opsional)</label>
        {buktiFilename ? (
          <div className="bukti-selected">
            <span className="bukti-filename">📎 {buktiFilename}</span>
            <button
              type="button"
              className="bukti-clear"
              onClick={handleClearBukti}
              title="Hapus bukti"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-pick-file"
            onClick={() => setShowFilePicker(!showFilePicker)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Pilih dari Storage
          </button>
        )}

        {/* File Picker Dropdown */}
        {showFilePicker && (
          <div className="file-picker-dropdown">
            {storageFiles.length === 0 ? (
              <div className="file-picker-empty">
                Belum ada file di storage. Upload dulu di halaman Storage.
              </div>
            ) : (
              storageFiles.map((file) => (
                <button
                  key={file.key}
                  type="button"
                  className="file-picker-item"
                  onClick={() => handleSelectBukti(file)}
                >
                  <span className="file-picker-icon">
                    {file.type === "image" ? "🖼️" : file.type === "document" ? "📄" : "📎"}
                  </span>
                  <span className="file-picker-name">{file.filename}</span>
                  <span className="file-picker-size">{file.sizeFormatted}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn-submit-logbook"
        disabled={submitting || !tanggal || !jamMulai || !jamSelesai || !kegiatan.trim()}
      >
        {submitting ? (
          <>
            <span className="upload-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Menyimpan...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Kegiatan
          </>
        )}
      </button>
    </form>
  );
}
