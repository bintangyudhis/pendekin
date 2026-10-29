"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Formulir masuk akun. Email + kata sandi dikirim ke POST
 * /api/auth/login, server membalas dengan cookie sesi httpOnly.
 * Kata sandi tidak disimpan di mana pun di sisi klien. Setelah masuk,
 * pengguna diarahkan ke dasbornya.
 */
export default function FormMasukAkun() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (sibuk || !email.trim() || !kataSandi) return;
    setSibuk(true);
    setGalat(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), kataSandi }),
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
          masuk
        </p>
      </div>
      <form onSubmit={masuk} className="space-y-4 px-5 py-6">
        <div>
          <label htmlFor="email-masuk" className="font-mono text-xs text-muted">
            email
          </label>
          <input
            id="email-masuk"
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
          <label
            htmlFor="sandi-masuk"
            className="font-mono text-xs text-muted"
          >
            kata sandi
          </label>
          <input
            id="sandi-masuk"
            type="password"
            required
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            autoComplete="current-password"
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
          disabled={sibuk || !email.trim() || !kataSandi}
          className="w-full bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95 disabled:opacity-50"
        >
          {sibuk ? "memeriksa…" : "masuk ke dasbor"}
        </button>
        <p className="font-mono text-xs leading-relaxed text-muted">
          Belum punya akun?{" "}
          <Link href="/daftar" className="text-ink underline underline-offset-4">
            daftar dulu
          </Link>
          , gratis.
        </p>
      </form>
    </div>
  );
}
