"use client";

import { useState } from "react";
import { salinTeks } from "@/lib/salin";

/**
 * Tombol salin kecil untuk dasbor. Label berubah menjadi "tersalin"
 * selama 2 detik sebagai umpan balik.
 */
export default function TombolSalin({ teks }: { teks: string }) {
  const [tersalin, setTersalin] = useState(false);

  async function klik() {
    await salinTeks(teks);
    setTersalin(true);
    window.setTimeout(() => setTersalin(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={klik}
      className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink"
    >
      {tersalin ? "tersalin" : "salin"}
    </button>
  );
}
