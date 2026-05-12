"use client";

import { useState, useEffect } from "react";

/**
 * Toast — Notifikasi popup di pojok kanan bawah
 * Auto-dismiss setelah 3 detik
 */
export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span style={{ marginRight: 8 }}>
        {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
      </span>
      {message}
    </div>
  );
}
