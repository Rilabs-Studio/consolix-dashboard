import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consolix Admin Dashboard",
  description: "Back-office & POS untuk Consolix — sistem rental PlayStation",
  // PWA: wajib di-install ke Home Screen di iPad/iPhone agar Web Push jalan.
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Consolix", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  // Kode booking (AB12CD34) & nominal rupiah di tabel jangan diubah iOS jadi
  // tautan telepon.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Layout boleh menyentuh area notch; utility `*-safe` di globals.css yang
  // menjaga konten tetap terbaca. Tanpa ini semua env(safe-area-inset-*) = 0.
  viewportFit: "cover",
  themeColor: "#4f46e5",
  // Sengaja tanpa maximumScale/userScalable — pinch-zoom masih dibutuhkan di
  // tabel padat.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
