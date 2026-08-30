import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "GigShield — Weekly income protection",
  description: "Parametric income-loss coverage for delivery riders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">
        <Nav />
        <main className="max-w-md mx-auto px-4 pb-16 pt-6 sm:max-w-lg">{children}</main>
      </body>
    </html>
  );
}
