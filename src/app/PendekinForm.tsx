"use client";

import { useState } from "react";
import Link from "next/link";

type Keadaan = "siap" | "mengirim" | "selesai";

type HasilApi =
  | { ok: true; data: { kode: string; url: string; judul: string | null } }
  | { ok: false; kode: string; pesan: string };

/**
 * Formulir pembuatan shortlink di halaman utama. Mengirim ke POST /api/links
 * dan menampilkan hasil tautan pendeknya di bawah formulir.
 *
 * Membuat tautan wajib masuk (sejak sistem akun): pengunjung yang
 * belum masuk melihat panel ajakan daftar/masuk, bukan formulir,
 * karena server menolak pembuatan tanpa sesi (401).
 */
export default function PendekinForm({
  penggunaEmail,
}: {
  penggunaEmail: string | null;
}) {
  const [url, setUrl] = useState("");
  const [kode, setKode] = useState("");
  const [keadaan, setKeadaan] = useState<Keadaan>("siap");
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<string | null>(null);
  const [tersalin, setTersalin] = useState(false);

  /** Salin tautan pendek: Clipboard API, fallback ke textarea bila ditolak. */
  async function salin() {
    if (!hasil) return;
    try {
      await navigator.clipboard.writeText(hasil);
    } catch {
      const area = document.createElement("textarea");
      area.value = hasil;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setTersalin(true);
    window.setTimeout(() => setTersalin(false), 2000);
  }

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
    setTersalin(false);
    setKeadaan("siap");
  }

  if (!penggunaEmail) {
    return (
      <div className="border border-line md:ml-24">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            pendekkan
          </p>
          <p className="font-mono text-[11px] text-muted">perlu akun</p>
        </div>
        <div className="space-y-4 px-5 py-6">
          <p className="max-w-xl leading-relaxed">
            Buat akun dulu, lalu masuk. Tautan yang kamu buat tercatat
            atas nama akunmu dan terkumpul di dasbormu, lengkap dengan
            statistik kliknya.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/daftar"
              className="bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95"
            >
              daftar akun gratis
            </Link>
            <Link
              href="/masuk"
              className="border border-ink px-5 py-3 font-mono text-sm hover:bg-ink hover:text-paper"
            >
              masuk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-line md:ml-24">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          pendekkan
        </p>
        <p className="font-mono text-[11px] text-muted">
          masuk sebagai {penggunaEmail}
        </p>
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
            <button
              type="button"
              onClick={salin}
              className="mt-4 border border-ink px-4 py-2 font-mono text-xs hover:bg-ink hover:text-paper"
            >
              {tersalin ? "tersalin" : "salin tautan"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
