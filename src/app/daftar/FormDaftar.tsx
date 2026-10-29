"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Formulir daftar akun. Dikirim ke POST /api/auth/daftar, server
 * menyimpan kata sandi sebagai hash dan langsung membuat sesi,
 * jadi setelah daftar pengguna langsung diarahkan ke dasbor.
 * Pengecekan ulangi kata sandi hanya di klien untuk kenyamanan,
 * aturan resminya tetap ditegakkan di server.
 */
export default function FormDaftar() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    if (sibuk) return;
    if (kataSandi !== ulangi) {
      setGalat("Ulangi kata sandi belum sama dengan kata sandi di atasnya.");
      return;
    }
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch("/api/auth/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim() ? nama.trim() : undefined,
          email: email.trim(),
          kataSandi,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; pesan: string };
      if (!json.ok) {
        setGalat(json.pesan);
      } else {
        router.push("/dasbor");
        router.refresh();
      }
    } catch {
      setGalat("Gagal menghubungi server. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="max-w-md border border-line">
      <div className="border-b border-line px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          daftar
        </p>
      </div>
      <form onSubmit={daftar} className="space-y-4 px-5 py-6">
        <div>
          <label htmlFor="nama-daftar" className="font-mono text-xs text-muted">
            nama <span className="normal-case">(opsional)</span>
          </label>
          <input
            id="nama-daftar"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="name"
            maxLength={60}
            placeholder="Namamu"
            className="mt-2 w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="email-daftar" className="font-mono text-xs text-muted">
            email
          </label>
          <input
            id="email-daftar"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="kamu@contoh.com"
            className="mt-2 w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="sandi-daftar" className="font-mono text-xs text-muted">
            kata sandi
          </label>
          <input
            id="sandi-daftar"
            type="password"
            required
            minLength={8}
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            autoComplete="new-password"
            placeholder="minimal 8 karakter"
            className="mt-2 w-full border border-line bg-paper px-3 py-2.5 font-mono text-sm outline-none focus:border-ink"
          />
        </div>
        <div>
          <label
            htmlFor="sandi-ulangi"
            className="font-mono text-xs text-muted"
          >
            ulangi kata sandi
          </label>
          <input
            id="sandi-ulangi"
            type="password"
            required
            value={ulangi}
            onChange={(e) => setUlangi(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className="mt-2 w-full border border-line bg-paper px-3 py-2.5 font-mono text-sm outline-none focus:border-ink"
          />
        </div>
        {galat && (
          <p role="alert" className="border-l-2 border-accent pl-3 text-sm">
            {galat}
          </p>
        )}
        <button
          type="submit"
          disabled={sibuk || !email.trim() || kataSandi.length < 8 || !ulangi}
          className="w-full bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95 disabled:opacity-50"
        >
          {sibuk ? "membuat akun…" : "buat akun dan masuk"}
        </button>
        <p className="font-mono text-xs leading-relaxed text-muted">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-ink underline underline-offset-4">
            masuk di sini
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
