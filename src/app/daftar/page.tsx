import type { Metadata } from "next";
import Link from "next/link";
import BilahAtas from "../BilahAtas";
import FormDaftar from "./FormDaftar";

export const metadata: Metadata = {
  title: "Daftar — Pendekin",
  description:
    "Buat akun pendekin gratis: buat tautan pendek dan pantau kliknya dari dasbormu sendiri.",
};

export default function HalamanDaftar() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <BilahAtas
        navigasi={[
          { href: "/", label: "beranda" },
          { href: "/masuk", label: "masuk" },
          { href: "/dasbor", label: "dasbor" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-5 md:px-8">
        <section className="py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            akun
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Buat akun, tautanmu tercatat rapi.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Satu akun untuk semua tautan pendekmu. Setiap tautan yang
            kamu buat masuk ke dasbormu sendiri, lengkap dengan jumlah
            klik dan grafik hariannya.
          </p>
          <div className="mt-8">
            <FormDaftar />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 md:px-8">
          <p className="font-mono text-xs text-muted">
            pendekin — daftar akun
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
