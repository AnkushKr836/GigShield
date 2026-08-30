import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  title: "GigShield — Weekly income protection",
  description: "Parametric income-loss coverage for delivery riders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen">
        <Nav />
        <main className="max-w-md mx-auto px-4 pb-16 pt-6 sm:max-w-lg">{children}</main>
      </body>
    </html>
  );
}
