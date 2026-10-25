"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Tombol keluar: memanggil POST /api/auth/logout lalu me-refresh dasbor. */
export default function TombolKeluar() {
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);

  async function keluar() {
    if (sibuk) return;
    setSibuk(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie mungkin sudah kedaluwarsa — refresh tetap mengembalikan
      // dasbor ke formulir masuk.
    } finally {
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={keluar}
      disabled={sibuk}
      className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink disabled:opacity-50"
    >
      {sibuk ? "keluar…" : "keluar"}
    </button>
  );
}
