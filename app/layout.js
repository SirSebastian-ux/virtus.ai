import "./globals.css";

export const metadata = {
  title: "Virtus AI",
  description: "Cognitive Discipline System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}