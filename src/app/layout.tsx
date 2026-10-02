import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Luxara — Beauty in every sense", description: "Discover perfumes, diffusers, humidifiers, aromatics and considered living pieces from Nigeria and beyond." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
