import type { Metadata, Viewport } from "next";
import { Red_Hat_Text, Cinzel } from "next/font/google";
import Script from "next/script";
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

const siteName = "Altessa Luxe";
const fallbackUrl = "https://altessaluxe.com";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl;
const siteMetadataBase = (() => {
  try {
    return new URL(configuredSiteUrl);
  } catch {
    return new URL(fallbackUrl);
  }
})();

const defaultDescription = "Altessa Luxe ofrece relojes de lujo, colecciones exclusivas y asesoramiento personalizado en Argentina.";
const contactPhoneRaw = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";
const contactPhone = contactPhoneRaw.replace(/[^0-9+]/g, "").replace(/^[+]?/, "");
const altessaLogoPng = "/altessa-logo.png";
const altessaLogoSvg = "/altessa-logo.svg";

const organizationJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteMetadataBase.origin,
  logo: `${siteMetadataBase.origin}${altessaLogoPng}`,
  sameAs: ["https://www.instagram.com/altessaluxe/"],
  ...(contactPhone
    ? {
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: `+${contactPhone}`,
            availableLanguage: ["es", "en"],
          },
        ],
      }
    : {}),
});

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  applicationName: siteName,
  title: {
    default: `${siteName} | Relojes de lujo en Argentina`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "altessa luxe",
    "relojes lujo",
    "relojes exclusivos",
    "joyeria argentina",
    "relojes premium",
    "colecciones alta gama",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteMetadataBase.origin,
    title: siteName,
    description: defaultDescription,
    siteName,
    images: [
      {
        url: altessaLogoPng,
        type: "image/png",
        alt: `${siteName} logo`,
      },
      {
        url: altessaLogoSvg,
        type: "image/svg+xml",
        alt: `${siteName} logo vector`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: defaultDescription,
    images: [altessaLogoPng],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: altessaLogoSvg, type: "image/svg+xml" },
      { url: altessaLogoPng, type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: altessaLogoPng }],
  },
  category: "ecommerce",
  authors: [{ name: siteName, url: siteMetadataBase.origin }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(() => { try { var t = localStorage.getItem('altessa-theme'); if(t!=='light' && t!=='dark'){ t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; } document.documentElement.setAttribute('data-theme', t); } catch(e){} })();`,
          }}
        />
        <Script
          id="org-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
      </head>
      <body suppressHydrationWarning className={`${redHat.className} ${fancy.variable} antialiased`}>
        <ThemeProvider>
          <AdminProvider>
            <Navbar />
            <div className="pt-16">{children}</div>
            <WhatsAppFloating />
            <Footer />
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
