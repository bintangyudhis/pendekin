import type { Metadata } from "next";
import Link from "next/link";
import BilahAtas from "../BilahAtas";
import FormMasukAkun from "./FormMasukAkun";

export const metadata: Metadata = {
  title: "Masuk — Pendekin",
  description:
    "Masuk ke akun pendekin untuk membuka dasbor tautan pendek milikmu.",
};

export default function HalamanMasuk() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <BilahAtas
        navigasi={[
          { href: "/", label: "beranda" },
          { href: "/daftar", label: "daftar" },
          { href: "/dasbor", label: "dasbor" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-5 md:px-8">
        <section className="py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            akun
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Masuk dulu, dasbormu menunggu.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Dasbor pendekin berisi tautan milik akunmu sendiri. Masuk
            dengan email dan kata sandi yang kamu pakai saat mendaftar.
          </p>
          <div className="mt-8">
            <FormMasukAkun />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 md:px-8">
          <p className="font-mono text-xs text-muted">
            pendekin — masuk akun
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
