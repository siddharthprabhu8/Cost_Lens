import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CostLens — AI cost intelligence",
  description: "Understand where every AI dollar goes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
