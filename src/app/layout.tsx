import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AutoUpdate } from "@/components/AutoUpdate";

export const metadata: Metadata = {
  title: { default: "Kostas Team Portal", template: "%s · Team Portal" },
  description: "Your team's schedule, lineups, live game console, snacks and chat — all in one place.",
  manifest: "/manifest.webmanifest",
  applicationName: "Team Portal",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Team Portal" },
  formatDetection: { telephone: false },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  openGraph: { title: "Kostas Team Portal", description: "Schedule, lineups, live game, snacks and chat for your team.", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#2348e0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}" }} />
      </head>
      <body><AutoUpdate />{children}</body>
    </html>
  );
}
