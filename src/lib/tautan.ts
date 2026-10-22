/**
 * Normalisasi URL tujuan shortlink. Mengembalikan URL kanonis atau null bila
 * tidak valid. Aturan: skema http/https, hostname punya titik (atau localhost
 * untuk development), tolak URL yang mengarah ke domain pendekin sendiri agar
 * tidak terjadi redirect berputar.
 */
export function normalisasiUrl(input: string, domainSendiri?: string): string | null {
  const mentah = input.trim();
  if (!mentah || mentah.length > 2048) return null;
  const denganSkema = /^https?:\/\//i.test(mentah) ? mentah : `https://${mentah}`;
  let url: URL;
  try {
    url = new URL(denganSkema);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const hostValid = host === "localhost" || host.includes(".");
  if (!hostValid) return null;
  if (domainSendiri && host === domainSendiri.toLowerCase()) return null;
  return url.toString();
}
