import Link from "next/link";

/**
 * Ditampilkan saat pengunjung membuka /[kode] yang tidak dikenal atau sudah
 * dinonaktifkan — dipicu oleh `notFound()` di route handler.
 */
export default function KodeTidakDikenal() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight"
          >
            pendekin<span className="text-accent">.</span>
          </Link>
          <p className="font-mono text-xs text-muted">kode-tak-dikenal</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 md:px-8">
        <div className="grid gap-8 py-16 md:grid-cols-[3rem_1fr]">
          <p
            aria-hidden
            className="hidden font-mono text-[11px] leading-relaxed text-muted [writing-mode:vertical-rl] md:block"
          >
            arsip-kode — 404
          </p>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              404
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Kode ini tidak terdaftar.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Tautan pendek yang kamu buka tidak dikenal — mungkin salah ketik,
              atau pemiliknya sudah menonaktifkannya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-block bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95"
              >
                Buat tautan pendek baru
              </Link>
              <Link
                href="/dasbor"
                className="inline-block border border-ink px-5 py-3 font-mono text-sm hover:bg-ink hover:text-paper"
              >
                buka dasbor pemilik
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">
        <p className="font-mono text-xs text-muted">
          pendekin — proyek portofolio Bintang Yudhistira
        </p>
      </footer>
    </div>
  );
}
