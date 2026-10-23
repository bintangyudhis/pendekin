"use client";

import { useState } from "react";

type Keadaan = "siap" | "mengirim" | "selesai";

type HasilApi =
  | { ok: true; data: { kode: string; url: string; judul: string | null } }
  | { ok: false; kode: string; pesan: string };

/**
 * Formulir pembuatan shortlink di halaman utama. Mengirim ke POST /api/links
 * dan menampilkan hasil tautan pendeknya di bawah formulir.
 */
export default function PendekinForm() {
  const [url, setUrl] = useState("");
  const [kode, setKode] = useState("");
  const [keadaan, setKeadaan] = useState<Keadaan>("siap");
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<string | null>(null);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (keadaan === "mengirim") return;
    setKeadaan("mengirim");
    setGalat(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          kode: kode.trim() ? kode.trim() : undefined,
        }),
      });
      const json = (await res.json()) as HasilApi;
      if (!json.ok) {
        setGalat(json.pesan);
        setKeadaan("siap");
        return;
      }
      setHasil(`${window.location.origin}/${json.data.kode}`);
      setKeadaan("selesai");
    } catch {
      setGalat("Gagal menghubungi server. Periksa koneksimu lalu coba lagi.");
      setKeadaan("siap");
    }
  }

  function ulang() {
    setUrl("");
    setKode("");
    setHasil(null);
    setGalat(null);
    setKeadaan("siap");
  }

  return (
    <div className="border border-line md:ml-24">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          pendekkan
        </p>
        <p className="font-mono text-[11px] text-muted">post /api/links</p>
      </div>

      <form onSubmit={kirim} className="space-y-5 px-5 py-6">
        <div>
          <label
            htmlFor="tautan-panjang"
            className="font-mono text-xs uppercase tracking-[0.15em] text-muted"
          >
            tautan-panjang
          </label>
          <input
            id="tautan-panjang"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://contoh.com/artikel/yang/sangat/panjang"
            disabled={keadaan === "mengirim"}
            className="mt-2 w-full border-b-2 border-line bg-transparent pb-2 font-mono text-sm outline-none placeholder:text-muted/60 focus:border-accent disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="kode-custom"
            className="font-mono text-xs uppercase tracking-[0.15em] text-muted"
          >
            kode-custom <span className="normal-case">(opsional)</span>
          </label>
          <input
            id="kode-custom"
            type="text"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            placeholder="mis. promo-okt — kosongkan untuk acak"
            disabled={keadaan === "mengirim"}
            pattern="[A-Za-z0-9_-]{3,32}"
            title="3–32 karakter: huruf, angka, strip, underscore"
            className="mt-2 w-full border-b-2 border-line bg-transparent pb-2 font-mono text-sm outline-none placeholder:text-muted/60 focus:border-accent disabled:opacity-50"
          />
        </div>

        {galat && (
          <p role="alert" className="border-l-2 border-accent pl-3 text-sm">
            {galat}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={keadaan === "mengirim" || !url.trim()}
            className="bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {keadaan === "mengirim" ? "Memendekkan…" : "Pendekkan tautan"}
          </button>
          {keadaan === "selesai" && (
            <button
              type="button"
              onClick={ulang}
              className="border border-line px-5 py-3 font-mono text-sm hover:border-ink"
            >
              pendekkan lagi
            </button>
          )}
        </div>

        {hasil && (
          <div className="border-t border-line pt-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              hasil
            </p>
            <a
              href={hasil}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block font-mono text-xl font-semibold tracking-tight text-accent underline-offset-4 hover:underline md:text-2xl"
            >
              {hasil.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </form>
    </div>
  );
}
