"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* File screenshot — taruh semua file di folder: public/panduan/        */
/* Ganti nama file di sini kalau nama file kamu berbeda.                */
/* ------------------------------------------------------------------ */

const BASE = "/panduan";

const SHOTS = {
  buka: `${BASE}/01-buka-website.png`,
  roomBooking: `${BASE}/02-room-booking.png`,
  form: `${BASE}/03-form-pemesanan.png`,
  berhasil: `${BASE}/04-berhasil.png`,
  dashboard: `${BASE}/dashboard.png`,
};

/* ------------------------------------------------------------------ */
/* Potongan kecil                                                       */
/* ------------------------------------------------------------------ */

// Penanda nama tombol / kolom yang ada di aplikasi
function Ui({ children }) {
  return <span className="gd-ui">{children}</span>;
}

// Satu screenshot. Klik untuk membuka ukuran penuh.
// Kalau file belum ada di folder public, tampil kotak penanda berisi nama file yang harus ditaruh.
function Shot({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // Jaga-jaga kalau gambar sudah gagal dimuat sebelum React aktif
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div className="gd-shot gd-shot-missing">
        <strong>Screenshot belum ditambahkan</strong>
        <span>{`public${src}`}</span>
      </div>
    );
  }

  return (
    <a
      className="gd-shot"
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      title="Klik untuk memperbesar"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

function Tips({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="gd-tip">
      <strong>Catatan</strong>
      <ul>
        {items.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Isi panduan — gampang diedit: ubah teks di sini                      */
/* ------------------------------------------------------------------ */

function buildSteps(url) {
  return [
    {
      title: "Buka website dan login",
      body: (
        <>
          <p>Buka link berikut di browser, lalu masuk dengan akun unit Anda.</p>
          <a
            className="gd-link-chip"
            href={url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            {url || "alamat website"}
          </a>
        </>
      ),
      shot: { src: SHOTS.buka, alt: "Membuka website dan login" },
    },
    {
      title: "Buka Room Booking dan pilih tanggal",
      body: (
        <p>
          Dari menu pilih <Ui>Room Booking</Ui>, lalu pilih tanggal di bagian
          atas. Di kartu <Ui>Jadwal yang sudah dipesan</Ui>, tekan tombol{" "}
          <Ui>Ruangan Meeting Sadiman</Ui> atau <Ui>Meja Meeting Heksagon</Ui>{" "}
          untuk melihat jam yang sudah terisi.
        </p>
      ),
      shot: { src: SHOTS.roomBooking, alt: "Halaman Room Booking" },
    },
    {
      title: "Isi formulir lalu pesan",
      body: (
        <p>
          Pilih <Ui>Ruangan / Meja</Ui>, <Ui>Jam mulai</Ui>, dan{" "}
          <Ui>Jam selesai</Ui> (jam 06:00–20:00, per 30 menit). Isi{" "}
          <Ui>Keperluan</Ui> kalau perlu, lalu klik <Ui>Pesan ruangan ini</Ui>.
        </p>
      ),
      shot: { src: SHOTS.form, alt: "Formulir pemesanan" },
      tips: [
        "Ruangan Meeting Sadiman muat maksimal 4 orang. Untuk peserta lebih dari 4 orang, disarankan memakai Meja Meeting Heksagon.",
        "Keperluan tampil di jadwal dan bisa dilihat pengguna lain. Untuk meeting rahasia, tulis judul yang umum saja.",
      ],
    },
    {
      title: "Selesai",
      body: (
        <p>
          Muncul notifikasi hijau <Ui>Booking confirmed</Ui>. Pesanan langsung
          aktif tanpa persetujuan dan tercatat di halaman <Ui>My Orders</Ui>.
        </p>
      ),
      shot: { src: SHOTS.berhasil, alt: "Notifikasi Booking confirmed" },
      tips: [
        "Mau batal? Buka My Orders, lalu klik tombol batal pada pesanan Anda.",
      ],
    },
  ];
}

const FAQ = [
  {
    q: "Muncul pesan jamnya bertabrakan",
    a: "Jam itu sudah dipesan orang lain di ruangan atau meja yang sama. Pilih jam lain, atau pindah ke ruangan atau meja yang satunya.",
  },
  {
    q: "Peserta meeting lebih dari 4 orang",
    a: "Gunakan Meja Meeting Heksagon. Ruangan Meeting Sadiman tetap bisa dipesan jika pembahasannya perlu tertutup, tetapi muatnya hanya 4 orang.",
  },
  {
    q: "Jadwal tidak muncul atau diminta login terus",
    a: "Pastikan Anda sudah login, lalu muat ulang halaman. Kalau masih bermasalah, hubungi admin.",
  },
];

/* ------------------------------------------------------------------ */
/* Halaman                                                              */
/* ------------------------------------------------------------------ */

export function GuideClient() {
  const [url, setUrl] = useState("");

  // Link website diambil otomatis dari alamat yang sedang dibuka
  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const steps = buildSteps(url);

  return (
    <main className="gd-page">
      <div className="gd-wrap">
        <header className="gd-card gd-hero">
          <span className="gd-badge">Panduan</span>
          <h1 className="gd-h1">Cara Memesan Ruangan atau Meja Meeting</h1>
          <p className="gd-lead">
            Hanya beberapa langkah singkat. Tanpa persetujuan: begitu pesanan
            terkirim, ruangan atau meja langsung menjadi milik Anda.
          </p>

          <div className="gd-choices">
            <div className="gd-choice">
              <strong>Ruangan Meeting Sadiman</strong>
              <span>Maksimal 4 orang</span>
            </div>
            <div className="gd-choice">
              <strong>Meja Meeting Heksagon</strong>
              <span>Bisa banyak orang</span>
            </div>
          </div>
        </header>

        <section className="gd-section">
          <ol className="gd-steps">
            {steps.map((step, i) => (
              <li className="gd-step" key={step.title}>
                <span className="gd-num">{i + 1}</span>
                <div className="gd-card gd-step-card">
                  <h2 className="gd-h2">{step.title}</h2>
                  <div className="gd-body">{step.body}</div>
                  <div className="gd-shots">
                    <Shot {...step.shot} />
                  </div>
                  <Tips items={step.tips} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="gd-section">
          <div className="gd-card gd-step-card">
            <h2 className="gd-h2">Cara cepat lewat Dashboard</h2>
            <div className="gd-body">
              <p>
                Bisa juga langsung dari <Ui>Dashboard</Ui>: pilih ruangan atau
                meja dan tanggal, klik slot <Ui>Available</Ui> di jam yang
                diinginkan, lalu isi jendela yang muncul dan konfirmasi.
              </p>
            </div>
            <div className="gd-shots">
              <Shot src={SHOTS.dashboard} alt="Memesan lewat Dashboard" />
            </div>
          </div>
        </section>

        <section className="gd-section">
          <h2 className="gd-h2 gd-h2-out">Kendala yang sering muncul</h2>
          <div className="gd-card gd-faq">
            {FAQ.map((item) => (
              <details className="gd-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="gd-footer">
          Masih ada kendala? Hubungi admin pengelola ruangan.
        </footer>
      </div>

      <style jsx global>{`
        .gd-page {
          min-height: 100vh;
          background: #f3f3f1;
          color: var(--color-ink, #111);
          padding: 32px 16px 56px;
        }

        .gd-wrap {
          max-width: 720px;
          margin: 0 auto;
        }

        .gd-card {
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-line, #e6e6e1);
          border-radius: 20px;
        }

        .gd-hero {
          padding: 28px;
        }

        .gd-badge {
          display: inline-block;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          background: var(--color-ink, #111);
          border-radius: 999px;
        }

        .gd-h1 {
          margin: 14px 0 8px;
          font-size: 28px;
          line-height: 1.2;
          font-weight: 800;
        }

        .gd-lead {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-choices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .gd-choice {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px 16px;
          font-size: 13px;
          background: var(--color-panel, #f6f6f3);
          border: 1px solid var(--color-line-strong, #d6d6d0);
          border-radius: 14px;
        }

        .gd-choice strong {
          font-size: 14px;
        }

        .gd-choice span {
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-section {
          margin-top: 28px;
        }

        .gd-h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .gd-h2-out {
          margin-bottom: 12px;
        }

        /* ---- Langkah ---- */

        .gd-steps {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .gd-step {
          position: relative;
          padding: 0 0 16px 52px;
        }

        .gd-step::before {
          content: "";
          position: absolute;
          left: 17px;
          top: 40px;
          bottom: 4px;
          width: 2px;
          background: var(--color-line, #e6e6e1);
        }

        .gd-step:last-child {
          padding-bottom: 0;
        }

        .gd-step:last-child::before {
          display: none;
        }

        .gd-num {
          position: absolute;
          left: 0;
          top: 0;
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          background: var(--color-ink, #111);
          border-radius: 50%;
        }

        .gd-step-card {
          padding: 18px 20px;
        }

        .gd-body {
          margin-top: 6px;
          font-size: 14px;
          line-height: 1.65;
        }

        .gd-body p {
          margin: 0 0 10px;
        }

        .gd-body p:last-child {
          margin-bottom: 0;
        }

        .gd-ui {
          display: inline-block;
          padding: 1px 9px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
          color: var(--color-ink, #111);
          background: var(--color-panel, #f6f6f3);
          border: 1px solid var(--color-line-strong, #d6d6d0);
          border-radius: 999px;
        }

        .gd-link-chip {
          display: inline-block;
          max-width: 100%;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: var(--color-ink, #111);
          border-radius: 999px;
          text-decoration: none;
          word-break: break-all;
        }

        .gd-tip {
          margin-top: 14px;
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.55;
          background: var(--color-panel, #f6f6f3);
          border-radius: 12px;
        }

        .gd-tip strong {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-tip ul {
          margin: 0;
          padding-left: 18px;
        }

        .gd-tip li {
          margin-bottom: 4px;
        }

        .gd-tip li:last-child {
          margin-bottom: 0;
        }

        /* ---- Screenshot ---- */

        .gd-shots {
          margin-top: 14px;
        }

        .gd-shot {
          display: block;
          overflow: hidden;
          background: var(--color-panel, #f6f6f3);
          border: 1px solid var(--color-line-strong, #d6d6d0);
          border-radius: 14px;
          cursor: zoom-in;
        }

        .gd-shot img {
          display: block;
          width: 100%;
          height: auto;
        }

        .gd-shot-missing {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          padding: 16px;
          text-align: center;
          font-size: 12px;
          color: var(--color-ink-soft, #6b6b66);
          border-style: dashed;
          cursor: default;
          word-break: break-all;
        }

        .gd-shot-missing strong {
          font-size: 13px;
          color: var(--color-ink, #111);
        }

        /* ---- FAQ ---- */

        .gd-faq {
          overflow: hidden;
        }

        .gd-faq-item {
          padding: 0 20px;
        }

        .gd-faq-item + .gd-faq-item {
          border-top: 1px solid var(--color-line, #e6e6e1);
        }

        .gd-faq-item summary {
          padding: 16px 0;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .gd-faq-item p {
          margin: 0 0 16px;
          font-size: 14px;
          line-height: 1.65;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 13px;
          color: var(--color-ink-soft, #6b6b66);
        }

        @media (max-width: 680px) {
          .gd-page {
            padding: 16px 12px 40px;
          }

          .gd-hero {
            padding: 22px 18px;
          }

          .gd-h1 {
            font-size: 23px;
          }

          .gd-choices {
            grid-template-columns: 1fr;
          }

          .gd-step {
            padding-left: 44px;
          }

          .gd-num {
            width: 32px;
            height: 32px;
            font-size: 13px;
          }

          .gd-step::before {
            left: 15px;
            top: 36px;
          }

          .gd-step-card {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
}