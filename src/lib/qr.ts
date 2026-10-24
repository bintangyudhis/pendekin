import QRCode from "qrcode";

/**
 * Render teks menjadi SVG kode QR. Hanya dipanggil di sisi server
 * (dasbor me-render-nya sekali per tautan).
 *
 * Modul digambar dengan warna tinta tema (#1c1813) di atas kertas
 * (#faf7f1) — kontrasnya tetap jauh di atas ambang pindai QR.
 * Output punya viewBox tanpa width/height, jadi ukurannya diatur
 * lewat CSS di komponen yang menampilkannya.
 */
export async function buatQrSvg(teks: string): Promise<string> {
  const svg = await QRCode.toString(teks, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return svg
    .replace('fill="#ffffff"', 'fill="#faf7f1"')
    .replace('stroke="#000000"', 'stroke="#1c1813"');
}
