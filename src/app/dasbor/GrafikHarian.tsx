import type { KlikHarian } from "@/lib/statistik";

/**
 * Diagram batang klik harian — SVG murni, tanpa dependensi grafik.
 * Hari tanpa klik tetap digambar (tinggi nol) agar deret tidak bolong.
 * Angka di tooltip <title> tiap batang.
 */
export default function GrafikHarian({ data }: { data: KlikHarian[] }) {
  const total = data.reduce((jumlah, d) => jumlah + d.klik, 0);

  if (total === 0) {
    return (
      <p className="border border-dashed border-line px-4 py-8 text-center font-mono text-xs text-muted">
        Belum ada klik dalam 14 hari terakhir.
      </p>
    );
  }

  const LEBAR = 560;
  const TINGGI = 170;
  const RUANG_ATAS = 12;
  const RUANG_BAWAH = 30;
  const areaTinggi = TINGGI - RUANG_ATAS - RUANG_BAWAH;
  const garisDasar = TINGGI - RUANG_BAWAH;

  const maks = Math.max(...data.map((d) => d.klik));
  const lebarSlot = LEBAR / data.length;
  const lebarBar = Math.max(4, lebarSlot * 0.55);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${LEBAR} ${TINGGI}`}
        role="img"
        aria-label={`Grafik klik harian: total ${total} klik dalam 14 hari terakhir`}
        className="block h-auto w-full"
      >
        <line
          x1="0"
          y1={garisDasar}
          x2={LEBAR}
          y2={garisDasar}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
        {data.map((d, i) => {
          const tinggi = Math.max(
            d.klik > 0 ? 2 : 0,
            (d.klik / maks) * areaTinggi,
          );
          const x = i * lebarSlot + (lebarSlot - lebarBar) / 2;
          const tengah = i * lebarSlot + lebarSlot / 2;
          return (
            <g key={d.tanggal}>
              <title>{`${d.label}: ${d.klik} klik`}</title>
              <rect
                x={x}
                y={garisDasar - tinggi}
                width={lebarBar}
                height={tinggi}
                fill="var(--color-accent)"
              />
              {(i % 2 === 0 || i === data.length - 1) && (
                <text
                  x={tengah}
                  y={TINGGI - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-muted)"
                  fontFamily="var(--font-plex-mono)"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 font-mono text-[11px] text-muted">
        klik per hari — 14 hari terakhir (WIB) · puncak {maks}/hari
      </figcaption>
    </figure>
  );
}
