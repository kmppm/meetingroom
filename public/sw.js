// Service worker "pembersih".
// Tujuannya hanya satu: menghapus service worker lama yang masih terdaftar di browser
// (biasanya sisa dari project lain yang pernah jalan di localhost:3000), lalu
// menghapus dirinya sendiri. Setelah itu browser berhenti meminta /sw.js.
//
// Tidak melakukan caching dan tidak mengubah perilaku website.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Bersihkan cache sisa service worker lama.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      // Hapus service worker ini dari browser.
      await self.registration.unregister();
    })()
  );
});