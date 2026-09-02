import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WIDE - Retrouver nos racines",
  description:
    "Plateforme de généalogie, de mémoire familiale et d'histoire des familles africaines. Retrouver nos racines. Préserver notre histoire. Transmettre notre héritage.",
  keywords: [
    "généalogie",
    "famille",
    "arbre généalogique",
    "Congo",
    "RDC",
    "Afrique",
    "mémoire familiale",
    "histoire familiale",
    "diaspora",
    "héritage",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
