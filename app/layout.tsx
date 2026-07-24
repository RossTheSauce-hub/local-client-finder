import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Local Client Finder — 10 local businesses that need video",
  description:
    "Enter your postcode. Get 10 local businesses with no video on their website — your warmest prospects as a freelance filmmaker. Free, in 60 seconds.",
};

export const viewport: Viewport = {
  themeColor: "#0d0c0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <div className="set-light" aria-hidden />
        {children}
      </body>
    </html>
  );
}
