/**
 * Salin teks ke clipboard. Memakai Clipboard API bila tersedia dan diizinkan,
 * fallback ke textarea tersembunyi bila izin ditolak peramban.
 *
 * Hanya dipakai di komponen client ("use client").
 */
export async function salinTeks(teks: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(teks);
    return;
  } catch {
    const area = document.createElement("textarea");
    area.value = teks;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }
}
