"use client";

/**
 * Lightbox — Preview gambar fullscreen
 * Klik overlay atau tekan Escape untuk menutup
 */
export default function Lightbox({ file, onClose }) {
  if (!file) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Preview gambar"
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={file.url} alt={file.filename} />
      </div>
    </div>
  );
}
