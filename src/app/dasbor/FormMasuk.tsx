"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Formulir masuk pemilik dasbor. Token diketik sekali, dikirim ke
 * POST /api/auth/login, lalu server menyetel cookie sesi httpOnly —
 * token tidak pernah disimpan di localStorage atau state permanen.
 * Setelah masuk, halaman di-refresh agar Server Component dasbor
 * membaca cookie baru dan menampilkan daftar tautan.
 */
export default function FormMasuk() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [tampil, setTampil] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim() || sibuk) return;
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; pesan: string };
      if (!json.ok) {
        setGalat(json.pesan);
      } else {
        setToken("");
        router.refresh();
      }
    } catch {
      setGalat("Gagal menghubungi server. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <section aria-label="Masuk sebagai pemilik" className="py-10 md:py-14">
      <div className="max-w-md border border-line">
        <div className="border-b border-line px-5 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            area-pemilik
          </p>
        </div>
        <form onSubmit={masuk} className="space-y-4 px-5 py-6">
          <p className="leading-relaxed">
            Daftar tautan hanya bisa dilihat pemiliknya. Masukkan token
            pemilik untuk membuka dasbor.
          </p>
          <div>
            <label
              htmlFor="token-pemilik"
              className="font-mono text-xs text-muted"
            >
              token pemilik
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="token-pemilik"
                type={tampil ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
                placeholder="••••••••"
                className="min-w-0 flex-1 border border-line bg-paper px-3 py-2.5 font-mono text-sm outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={() => setTampil(!tampil)}
                className="shrink-0 border border-line px-3 py-2.5 font-mono text-xs hover:border-ink"
              >
                {tampil ? "sembunyikan" : "lihat"}
              </button>
            </div>
          </div>
          {galat && (
            <p role="alert" className="border-l-2 border-accent pl-3 text-sm">
              {galat}
            </p>
          )}
          <button
            type="submit"
            disabled={sibuk || !token.trim()}
            className="w-full bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95 disabled:opacity-50"
          >
            {sibuk ? "memeriksa…" : "masuk ke dasbor"}
          </button>
          <p className="font-mono text-xs leading-relaxed text-muted">
            Token diatur lewat environment PENDEKIN_OWNER_TOKEN di server —
            tidak pernah ditulis di halaman ini.
          </p>
        </form>
      </div>
    </section>
  );
}
