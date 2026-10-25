import BilahAtas from "./BilahAtas";
import PendekinForm from "./PendekinForm";

const REPO_URL = "https://github.com/bintangyudhis/pendekin";

const caraKerja = [
  {
    kunci: "tempel",
    isi: "Tempel tautan yang panjang. Pendekin membuatkan kode pendek untuknya — bisa juga memakai kode pilihanmu sendiri.",
  },
  {
    kunci: "bagikan",
    isi: "Sebarkan tautan pendeknya ke mana saja: bio, chat, cetakan, atau kode QR. Pengunjung otomatis diarahkan ke tautan aslinya.",
  },
  {
    kunci: "pantau",
    isi: "Setiap kunjungan dicatat. Dasbor menampilkan jumlah klik tiap tautan beserta grafik klik harian.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <BilahAtas
        navigasi={[
          { href: "#cara-kerja", label: "cara-kerja" },
          { href: "#teknis", label: "teknis" },
          { href: "/dasbor", label: "dasbor" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-5 md:px-8">
        {/* Hero: rel indeks mono + kolom pernyataan. */}
        <section className="grid gap-8 py-14 md:grid-cols-[3rem_1fr] md:py-20">
          <p
            aria-hidden
            className="hidden font-mono text-[11px] leading-relaxed text-muted [writing-mode:vertical-rl] md:block"
          >
            pemendek-tautan — 001
          </p>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Pemendek tautan
            </p>
            <h1 className="mt-4 max-w-2xl text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
              Tautan panjang, dipadatkan.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Pendekin mengubah tautan yang panjang menjadi tautan pendek yang
              gampang dibagikan — dan mencatat setiap kliknya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#cara-kerja"
                className="bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95"
              >
                Lihat cara kerja
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="border border-ink px-5 py-3 font-mono text-sm hover:bg-ink hover:text-paper"
              >
                github.com/bintangyudhis/pendekin
              </a>
            </div>
          </div>
        </section>

        {/* Pendekkan: formulir langsung, tanpa daftar akun. */}
        <section aria-label="Pendekkan tautan" className="pb-16 md:pb-20">
          <PendekinForm />
        </section>

        {/* Spesimen: contoh hasil, diberi label jelas. */}
        <section aria-label="Contoh tautan pendek" className="pb-16 md:pb-20">
          <div className="border border-line md:ml-24">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                contoh
              </p>
              <p className="font-mono text-[11px] text-muted">redirect 308</p>
            </div>
            <div className="space-y-3 px-5 py-6">
              <p className="font-mono text-xl font-semibold tracking-tight md:text-3xl">
                pendek.in/<span className="text-accent">x7K2qQ</span>
              </p>
              <p className="font-mono text-xs text-muted md:text-sm">
                <span aria-hidden className="mr-2 text-accent">
                  ↓
                </span>
                https://toko-contoh.example/katalog/produk/sepatu-lari…
              </p>
            </div>
          </div>
        </section>

        {/* Cara kerja: buku besar, bukan kartu seragam.
            scroll-mt: jangkar tidak tertutup bilah atas yang lengket. */}
        <section id="cara-kerja" aria-label="Cara kerja" className="scroll-mt-20 pb-16 md:pb-20">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            cara-kerja
          </h2>
          <dl className="mt-6 border-t border-line">
            {caraKerja.map((baris) => (
              <div
                key={baris.kunci}
                className="grid gap-2 border-b border-line py-6 md:grid-cols-[10rem_1fr] md:gap-8"
              >
                <dt className="font-mono text-sm font-semibold text-accent">
                  {baris.kunci}
                </dt>
                <dd className="max-w-2xl leading-relaxed">{baris.isi}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Teknis: satu lajur spesifikasi. */}
        <section
          id="teknis"
          aria-label="Teknis"
          className="scroll-mt-20 border-y border-line py-10"
        >
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            teknis
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <p className="leading-relaxed">
              Dibangun dengan{" "}
              <span className="font-semibold">Next.js</span>,{" "}
              <span className="font-semibold">Prisma</span>, dan{" "}
              <span className="font-semibold">PostgreSQL</span>. Setiap klik
              disimpan sebagai baris data sendiri — dasar grafik dan statistik
              dasbor.
            </p>
            <p className="leading-relaxed">
              Kode terbuka di GitHub. Isu rencana fitur, riwayat commit, dan
              progres pengembangan semuanya tercatat di sana. Dasbornya
              sendiri hanya untuk pemilik — pengunjung lain tidak bisa
              mengintip daftar tautan maupun statistiknya.
            </p>
          </div>
        </section>
      </main>

      {/* Kaki: satu baris pernyataan. */}
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-8 md:px-8">
        <p className="font-mono text-xs text-muted">
          pendekin — proyek portofolio Bintang Yudhistira
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-muted underline underline-offset-4 hover:text-ink"
        >
          github.com/bintangyudhis/pendekin
        </a>
      </footer>
    </div>
  );
}
