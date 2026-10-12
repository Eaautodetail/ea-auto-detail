import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/config/site";
import { LocalBusinessJsonLd } from "@/components/local-business-jsonld";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const defaultTitle = `${site.name} – Bilvård & mobil biltvätt i ${site.baseTown}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: defaultTitle,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "bilvård",
    "biltvätt",
    "invändig bilrengöring",
    "utvändig biltvätt",
    "mobil bilvård",
    `bilvård ${site.baseTown}`,
    `biltvätt ${site.baseTown}`,
    `mobil bilvård ${site.baseTown}`,
    "hämtning och lämning bil",
  ],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: site.name,
    title: defaultTitle,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.description,
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${inter.variable} ${archivo.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#innehall"
          className="sr-only z-[100] rounded-md bg-white px-4 py-2 font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Hoppa till innehållet
        </a>
        <Header />
        <main id="innehall" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}
