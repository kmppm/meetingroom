import "./globals.css";
import { Onest } from "next/font/google";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { InstallProvider } from "@/components/layout/InstallProvider";
import StyledJsxRegistry from "@/components/layout/StyledJsxRegistry";

// Font di-host sendiri oleh Next.js dan di-preload, jadi tidak ada "loncat font"
// di awal halaman. Variabel --font-onest dipakai di globals.css (--font-sans).
const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-onest",
});

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
    <html lang="id" className={onest.variable}>
      <body>
        <StyledJsxRegistry>
          <LanguageProvider>
            <InstallProvider>{children}</InstallProvider>
          </LanguageProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}