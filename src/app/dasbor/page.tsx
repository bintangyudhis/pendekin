import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import BilahAtas from "../BilahAtas";
import IsiDasbor from "./IsiDasbor";

export const metadata: Metadata = {
  title: "Dasbor — Pendekin",
  description:
    "Dasbor pemilik: daftar tautan pendek beserta jumlah kliknya — hanya bisa dibuka dengan token pemilik.",
};

/** Pengganti saat isi dinamis dasbor sedang di-streaming. */
function MemuatDasbor() {
  return (
    <div aria-busy="true">
      <section aria-label="Ringkasan" className="border-y border-line">
        <p className="px-4 py-5 font-mono text-xs text-muted md:px-6 md:py-6">
          Memuat angka…
        </p>
      </section>
      <section aria-label="Daftar tautan" className="py-10 md:py-14">
        <p className="font-mono text-xs text-muted">Memuat daftar tautan…</p>
      </section>
    </div>
  );
}

export default function Dasbor() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <BilahAtas
        navigasi={[
          { href: "/", label: "beranda" },
          { href: "/dasbor", label: "dasbor", aktif: true },
        ]}
      />

      <main className="mx-auto max-w-5xl px-5 md:px-8">
        <section className="py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            dasbor
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Semua tautan, terpantau.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Daftar tautan pendek yang pernah dibuat — salin tautannya,
            tampilkan kode QR-nya, buka statistik kliknya, atau nonaktifkan
            yang sudah tidak dipakai. Halaman ini hanya untuk pemilik:
            pengunjung lain hanya melihat formulir masuk.
          </p>
        </section>

        {/* Isi dinamis (baca database) di-streaming terpisah agar cangkang
            halaman tetap bisa di-prerender. */}
        <Suspense fallback={<MemuatDasbor />}>
          <IsiDasbor />
        </Suspense>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 md:px-8">
          <p className="font-mono text-xs text-muted">
            pendekin — dasbor pemilik tautan
          </p>
          <Link
            href="/"
            className="font-mono text-xs text-muted underline underline-offset-4 hover:text-ink"
          >
            ← kembali ke beranda
          </Link>
        </div>
      </footer>
    </div>
  );
}
