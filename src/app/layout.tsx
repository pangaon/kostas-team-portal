import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AutoUpdate } from "@/components/AutoUpdate";

export const metadata: Metadata = {
  title: "Kostas Team Portal",
  description: "One clean place for your team's schedule, attendance, snacks, and announcements.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Team Portal" },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body><AutoUpdate />{children}</body>
    </html>
  );
}
