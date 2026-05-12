"use client";

import Swal from "sweetalert2";

/**
 * LogbookTable — Tabel data logbook mirip spreadsheet
 * Kolom: No, Hari/Tgl, Jam Mulai, Jam Selesai, Kegiatan, Bukti
 */
export default function LogbookTable({ entries, onDelete, loading }) {
  // Format tanggal: 2026-05-11 → 11/05/2026
  const formatTanggal = (dateStr) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleDelete = async (entry) => {
    const result = await Swal.fire({
      title: "Hapus kegiatan ini?",
      html: `<span style="color:#8888a0">${entry.kegiatan}</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6366f1",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "#1a1a2e",
      color: "#f0f0f5",
      customClass: { popup: "swal-dark-popup" },
    });

    if (result.isConfirmed) {
      await onDelete(entry.id);
      Swal.fire({
        title: "Terhapus!",
        text: "Kegiatan berhasil dihapus.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#1a1a2e",
        color: "#f0f0f5",
      });
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="upload-spinner" style={{ margin: "0 auto 16px" }} />
        <p>Memuat logbook...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <p style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 4 }}>
          Belum ada kegiatan
        </p>
        <p style={{ fontSize: "0.875rem" }}>
          Tambahkan kegiatan harian kamu lewat form di atas
        </p>
      </div>
    );
  }

  // Grouping by tanggal untuk visual lebih rapi
  let currentDate = null;

  return (
    <div className="logbook-table-wrapper">
      <table className="logbook-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>No.</th>
            <th style={{ width: 110 }}>Hari/Tgl.</th>
            <th style={{ width: 90 }}>Jam Mulai</th>
            <th style={{ width: 95 }}>Jam Selesai</th>
            <th>Kegiatan</th>
            <th style={{ width: 200 }}>Bukti</th>
            <th style={{ width: 50 }}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const showDate = entry.tanggal !== currentDate;
            currentDate = entry.tanggal;

            return (
              <tr key={entry.id} className={showDate && idx > 0 ? "new-date-row" : ""}>
                <td className="cell-center">{idx + 1}</td>
                <td className="cell-center">
                  {showDate ? formatTanggal(entry.tanggal) : ""}
                </td>
                <td className="cell-center">{entry.jamMulai}</td>
                <td className="cell-center">{entry.jamSelesai}</td>
                <td>{entry.kegiatan}</td>
                <td>
                  {entry.buktiKey ? (
                    <a
                      href={`/api/file/${entry.buktiKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bukti-link"
                      title={entry.buktiFilename}
                    >
                      <span className="bukti-icon">
                        {getBuktiIcon(entry.buktiFilename)}
                      </span>
                      <span className="bukti-text">
                        {entry.buktiFilename}
                      </span>
                    </a>
                  ) : (
                    <span className="no-bukti">-</span>
                  )}
                </td>
                <td className="cell-center">
                  <button
                    className="btn-delete-row"
                    onClick={() => handleDelete(entry)}
                    title="Hapus kegiatan"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getBuktiIcon(filename) {
  if (!filename) return "📎";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📕";
  if (["doc", "docx"].includes(ext)) return "📄";
  if (["xls", "xlsx"].includes(ext)) return "📊";
  return "📎";
}
