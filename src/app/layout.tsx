import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consolix Admin Dashboard",
  description: "Back-office & POS untuk Consolix — sistem rental PlayStation",
  // PWA: wajib di-install ke Home Screen di iPad/iPhone agar Web Push jalan.
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Consolix", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
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
