import Link from "next/link";

const REPO_URL = "https://github.com/bintangyudhis/pendekin";

export type TautanNav = {
  href: string;
  label: string;
  /** Tautan halaman yang sedang dibuka: tampil sebagai teks, bukan link. */
  aktif?: boolean;
};

/**
 * Bilah atas situs: wordmark di kiri, navigasi mono di kanan.
 * Dipakai beranda dan dasbor dengan daftar tautan yang berbeda.
 * Lengket (sticky) di tepi atas viewport saat halaman digulir — latar
 * semi-transparan + blur agar isi yang lewat di bawahnya tidak bertabrakan
 * secara visual dengan teks navigasi.
 */
export default function BilahAtas({ navigasi }: { navigasi: TautanNav[] }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight"
        >
          pendekin<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-xs text-muted">
          {navigasi.map((tautan) =>
            tautan.aktif ? (
              <span key={tautan.label} aria-current="page" className="text-ink">
                {tautan.label}
              </span>
            ) : (
              <Link
                key={tautan.label}
                href={tautan.href}
                className="hover:text-ink"
              >
                {tautan.label}
              </Link>
            ),
          )}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-line px-2.5 py-1.5 text-ink hover:border-ink"
          >
            github
          </a>
        </nav>
      </div>
    </header>
  );
}
