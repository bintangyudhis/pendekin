/**
 * Host yang mengarah ke jaringan internal / mesin sendiri. Shortlink tidak
 * boleh dipakai untuk memindai atau memanggil layanan internal (SSRF).
 */
function hostInternal(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (h === "localhost") return true;
  if (/^127\./.test(h) || h === "::1" || h === "[::1]") return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h === "169.254.169.254") return true; // endpoint metadata cloud
  return false;
}

/**
 * Normalisasi URL tujuan shortlink. Mengembalikan URL kanonis atau null bila
 * tidak valid. Aturan: skema http/https, hostname punya titik, tolak URL yang
 * mengarah ke domain pendekin sendiri (anti redirect berputar) dan ke host
 * internal (anti SSRF).
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
  const hostValid = !hostInternal(host) && host.includes(".");
  if (!hostValid) return null;
  if (domainSendiri && host === domainSendiri.toLowerCase()) return null;
  return url.toString();
}
