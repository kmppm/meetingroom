"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/*
  Menangkap sinyal "beforeinstallprompt" dari Chrome/Edge supaya menu
  "Install App" bisa langsung memunculkan dialog install bawaan browser,
  tanpa pengguna perlu membuka menu titik tiga.

  Dipasang sekali di app/layout.js supaya sinyal dari browser tidak terlewat
  (sinyal itu hanya dikirim sekali, dan tidak ikut hilang saat pindah halaman).

  Cara pakai di komponen mana pun:
    const { canInstall, installed, install } = useInstall();

  - canInstall: true kalau browser siap menampilkan dialog install
  - installed : true kalau web ini sedang dibuka sebagai aplikasi terpasang
  - install() : memunculkan dialog; mengembalikan "accepted", "dismissed",
                atau "unavailable" (browser belum/tidak mendukung)
*/

const InstallContext = createContext({
  canInstall: false,
  installed: false,
  install: async () => "unavailable",
});

export function InstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Sedang berjalan sebagai aplikasi terpasang (Chrome/Edge atau iPhone)?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    function onBeforeInstallPrompt(e) {
      // Tahan dialog otomatis; dialog baru ditampilkan saat menu diklik
      e.preventDefault();
      setDeferredPrompt(e);
    }

    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return "unavailable";
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Sinyal ini hanya bisa dipakai satu kali
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  return (
    <InstallContext.Provider
      value={{ canInstall: Boolean(deferredPrompt), installed, install }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  return useContext(InstallContext);
}