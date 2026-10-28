import "./globals.css";
import "./virtus-luxury.css";
import "./virtus-interior.css";
import "./virtus-subpages.css";

export const metadata = {
  title: "Virtus AI | Life Coach · Trainer · Mentor",
  description: "AI life coaching, structured training, and leadership mentoring powered by Enhanced Wellness Solutions.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}