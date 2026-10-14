"use client";

import { useState } from "react";
import { BookingGuide } from "./BookingGuide";
import { InstallGuide } from "./InstallGuide";

/* ------------------------------------------------------------------ */
/* Kendala umum — ubah teks di sini                                     */
/* ------------------------------------------------------------------ */

const FAQ = [
  {
    q: "Jamnya bertabrakan",
    a: "Jam itu sudah dipesan orang lain. Pilih jam lain, atau pindah ke ruangan satunya.",
  },
  {
    q: "Diminta login terus",
    a: "Muat ulang halaman. Kalau masih sama, hubungi admin.",
  },
];

/* ------------------------------------------------------------------ */
/* Halaman: tombol tab, isi tab ada di file masing-masing               */
/* ------------------------------------------------------------------ */

export function GuideClient() {
  const [tab, setTab] = useState("install"); // "install" | "booking"

  return (
    <main className="gd-page">
      <div className="gd-wrap">
        <div className="gd-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "install"}
            className={`gd-tab${tab === "install" ? " is-active" : ""}`}
            onClick={() => setTab("install")}
          >
            Cara Pasang Aplikasi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "booking"}
            className={`gd-tab${tab === "booking" ? " is-active" : ""}`}
            onClick={() => setTab("booking")}
          >
            Cara Pesan Ruangan
          </button>
        </div>

        {tab === "booking" ? <BookingGuide /> : <InstallGuide />}

        <section className="gd-faq">
          <h2 className="gd-h2">Kendala</h2>
          {FAQ.map((item) => (
            <p className="gd-faq-item" key={item.q}>
              <strong>{item.q}.</strong> {item.a}
            </p>
          ))}
        </section>
      </div>

      <style jsx global>{`
        .gd-page {
          min-height: 100vh;
          background: #f1f1ef;
          color: var(--color-ink, #111);
          padding: 28px 16px 48px;
        }

        .gd-wrap {
          max-width: 560px;
          margin: 0 auto;
        }

        /* ---- Tab ---- */

        .gd-tabs {
          display: flex;
          gap: 2px;
          padding: 3px;
          background: #e7e7e3;
          border-radius: 999px;
        }

        .gd-tab {
          flex: 1 1 0;
          height: 40px;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: var(--color-ink-soft, #6b6b66);
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .gd-tab.is-active {
          background: var(--color-ink, #111);
          color: #fff;
        }

        /* ---- Kendala ---- */

        .gd-faq {
          margin-top: 28px;
        }

        .gd-h2 {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 800;
        }

        .gd-faq-item {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-faq-item strong {
          color: var(--color-ink, #111);
        }
      `}</style>
    </main>
  );
}