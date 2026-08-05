import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consolix Admin Dashboard",
  description: "Back-office & POS untuk Consolix — sistem rental PlayStation",
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
