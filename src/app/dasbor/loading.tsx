/**
 * Kerangka muat dasbor: ditampilkan selama halaman /dasbor dimuat saat
 * navigasi pertama, agar layar tidak kosong melompong. Bentuknya meniru
 * struktur dasbor asli (judul, strip ringkasan, daftar) dengan bahasa
 * visual yang sama: garis pemisah + label mono.
 */
export default function MemuatDasbor() {
  return (
    <div className="min-h-screen bg-paper text-ink" aria-busy="true">
      <main className="mx-auto max-w-5xl px-5 md:px-8">
        <section className="py-12 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            dasbor
          </p>
          <div className="mt-6 h-10 w-80 max-w-full animate-pulse bg-line/70" />
          <div className="mt-5 h-5 w-96 max-w-full animate-pulse bg-line/50" />
        </section>

        <section aria-label="Ringkasan" className="border-y border-line">
          <div className="grid grid-cols-3 divide-x divide-line">
            {["tautan", "total-klik", "klik-7-hari"].map((kunci) => (
              <div key={kunci} className="px-4 py-5 md:px-6 md:py-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                  {kunci}
                </p>
                <div className="mt-3 h-8 w-14 animate-pulse bg-line/70" />
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Daftar tautan" className="py-10 md:py-14">
          <div className="divide-y divide-line border-y border-line">
            {[0, 1, 2].map((i) => (
              <div key={i} className="py-5">
                <div className="h-6 w-56 max-w-full animate-pulse bg-line/70" />
                <div className="mt-2.5 h-4 w-96 max-w-full animate-pulse bg-line/50" />
                <div className="mt-3.5 flex gap-2">
                  <div className="h-8 w-16 animate-pulse border border-line" />
                  <div className="h-8 w-20 animate-pulse border border-line" />
                  <div className="h-8 w-24 animate-pulse border border-line" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-xs text-muted">Memuat dasbor…</p>
        </section>
      </main>
    </div>
  );
}
