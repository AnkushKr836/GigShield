import "./globals.css";
import BackgroundBlobs from "@/components/BackgroundBlobs";

export const metadata = {
  title: "GigShield — Weekly income protection",
  description: "Parametric income-loss coverage for delivery riders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body min-h-screen relative">
        <BackgroundBlobs />
        {children}
      </body>
    </html>
  );
}
