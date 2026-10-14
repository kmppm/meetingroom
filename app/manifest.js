export default function manifest() {
  return {
    name: "Meeting Room Booking",
    short_name: "Meeting Room",
    description: "Internal meeting room booking system",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Samakan dengan warna latar halaman (--color-bg) supaya splash screen menyatu.
    background_color: "#f1f1ef",
    theme_color: "#f1f1ef",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}