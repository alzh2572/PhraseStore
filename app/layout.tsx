import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhraseStore",
  description: "Phrase Store — фразы и цитаты",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
