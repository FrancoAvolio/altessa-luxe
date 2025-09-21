import type { Metadata } from "next";
import { Red_Hat_Text, Cinzel } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AdminProvider } from "../context/AdminContext";
import WhatsAppFloating from "../components/WhatsAppFloating";
import { ThemeProvider } from "../context/ThemeContext";

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
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(() => { try { var t = localStorage.getItem('altessa-theme'); if(t!=='light' && t!=='dark'){ t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; } document.documentElement.setAttribute('data-theme', t); } catch(e){} })();`
        }} />
      </head>
      <body suppressHydrationWarning className={`${redHat.className} ${fancy.variable} antialiased`}>
        <ThemeProvider>
          <AdminProvider>
            <Navbar />
            <div className="pt-16">
              {children}
            </div>
            <WhatsAppFloating />
            <Footer />
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


