import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Luxara — Beauty in every sense", description: "Discover perfumes, diffusers, humidifiers, aromatics and considered living pieces from Nigeria and beyond.", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#64213d" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
