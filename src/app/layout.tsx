import type { Metadata } from "next";
import { Red_Hat_Text, Cinzel } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AdminProvider } from "../context/AdminContext";

const redHat = Red_Hat_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-redhat",
  display: "swap",
});

const fancy = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-fancy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relojes - Productos",
  description: "Tienda de relojes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${redHat.className} ${fancy.variable} antialiased bg-white`}>
        <AdminProvider>
          <Navbar />
          <div className="pt-16"> {/* Padding top for fixed navbar */}
            {children}
          </div>
          <Footer />
        </AdminProvider>
      </body>
    </html>
  );
}
