import PwaBootstrap from "./components/PwaBootstrap";
import VirtusDevelopmentBar from "./components/VirtusDevelopmentBar";
import "./globals.css";
import "./virtus-luxury.css";
import "./virtus-interior.css";
import "./virtus-subpages.css";

export const metadata = {
  metadataBase: new URL("https://virtusaiworld.com"),
  title: "Virtus AI | Life Coach Â· Trainer Â· Mentor",
  description: "AI life coaching, structured training, and leadership mentoring powered by Enhanced Wellness Solutions.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/virtus-ai-192-v2.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/virtus-ai-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    url: "https://virtusaiworld.com",
    siteName: "Virtus AI",
    title: "Virtus AI | Life Coach Â· Trainer Â· Mentor",
    description: "Your AI life coach, trainer and mentor. Personal growth begins with awareness.",
    images: [{ url: "/og/virtus-ai-official-20261105.png", width: 1200, height: 630, alt: "Virtus AI - Life Coach, Trainer, Mentor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtus AI | Life Coach Â· Trainer Â· Mentor",
    description: "Your AI life coach, trainer and mentor.",
    images: ["/og/virtus-ai-official-20261105.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Virtus AI",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#091b1c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans"><PwaBootstrap /><VirtusDevelopmentBar />{children}</body>
    </html>
  );
}
