import "./globals.css";
import { LanguageProvider } from "@/components/layout/LanguageProvider";

export const metadata = {
  title: "Meeting Room Booking",
  description: "Internal meeting room booking system",
  applicationName: "Meeting Room Booking",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // iPhone: buka layar penuh saat dipasang lewat "Add to Home Screen"
  appleWebApp: {
    capable: true,
    title: "Meeting Room",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  // Versi standar untuk Chrome/Android (meta apple-* di atas tetap dipakai Safari iPhone)
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// viewportFit "cover" supaya env(safe-area-inset-*) di bottom nav bekerja di HP berponi.
// themeColor sama dengan warna latar halaman (--color-bg).
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1f1ef",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}