import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import BackgroundBlobs from "@/components/BackgroundBlobs";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
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
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen relative">
        <BackgroundBlobs />
        {children}
      </body>
    </html>
  );
}
