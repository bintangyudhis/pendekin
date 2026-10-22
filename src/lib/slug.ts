const ALFABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Slug acak aman-URL, mis. "x7K2qQ9p". Dipakai saat user tidak memberi kode custom. */
export function acakSlug(panjang = 7): string {
  const bytes = new Uint8Array(panjang);
  crypto.getRandomValues(bytes);
  let hasil = "";
  for (const b of bytes) hasil += ALFABET[b % ALFABET.length];
  return hasil;
}

/** Kode custom dari user: 3–32 karakter alfanumerik, strip, underscore. */
export function slugCustomValid(kode: string): boolean {
  return /^[A-Za-z0-9_-]{3,32}$/.test(kode);
}

/** Daftar kata yang tidak boleh dipakai sebagai kode (tabrakan dengan route). */
const KODE_DILARANG = new Set(["api", "dashboard", "login", "404", "admin"]);

export function slugBolehDipakai(kode: string): boolean {
  return slugCustomValid(kode) && !KODE_DILARANG.has(kode.toLowerCase());
}
