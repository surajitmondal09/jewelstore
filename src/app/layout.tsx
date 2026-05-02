import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura Jewels",
  description: "Aura Jewels is a luxury online destination offering an exclusive collection of fine jewelry. Discover timeless elegance, modern designs, and exceptional craftsmanship with our curated selection of rings, necklaces, earrings, and bracelets. Experience a seamless and premium shopping experience with secure payments, verified authenticity, and outstanding customer support. Find your perfect piece of luxury today.",
  keywords: ["Aura Jewels", "luxury jewelry", "fine jewelry", "classic rings", "modern necklaces", "elegant earrings", "bracelets", "engagement rings", "premium jewelry shopping", "authentic diamonds", "gold accessories"],
  openGraph: {
    title: "Aura Jewels",
    description: "Aura Jewels is a luxury online destination offering an exclusive collection of fine jewelry. Discover timeless elegance, modern designs, and exceptional craftsmanship with our curated selection of rings, necklaces, earrings, and bracelets.",
    url: "https://aurajewels.demo.network/",
    type: "website",
    siteName: "Aura Jewels",
  }  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        <ToastContainer autoClose={2000} theme="colored"/>
      </body>
    </html>
  );
}
