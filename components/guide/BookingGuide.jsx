"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Data yang gampang kamu edit sendiri                                  */
/* ------------------------------------------------------------------ */

const SITE_URL = "https://sadiman.vercel.app/";

// Nama unit dan password yang tampil di langkah 1
const UNITS = [
  { name: "Knowledge and Innovation", password: "KNOWLEDGE" },
  { name: "Strategy and Growth", password: "STRATEGY" },
  { name: "Risk and Quality", password: "QUALITY" },
  { name: "Lembaga Sertifikasi Profesi (LSP)", password: "SERTIFIKASI" },
];

/* ------------------------------------------------------------------ */
/* Screenshot rasio 16:9 — taruh semua di folder: public/panduan/        */
/* Ganti nama file di sini kalau nama file kamu berbeda.                 */
/* Kalau file belum ada, tampil kotak penanda berisi nama file-nya.      */
/* ------------------------------------------------------------------ */

const BASE = "/panduan";

const SHOTS = {
  login: `${BASE}/01-login.png`,
  pilihRuangan: `${BASE}/02-pilih-ruangan.png`,
  pilihJam: `${BASE}/03-pilih-jam.png`,
  pesan: `${BASE}/04-pesan.png`,
  selesai: `${BASE}/05-selesai.png`,
  dashboard: `${BASE}/dashboard.png`,
};

/* ------------------------------------------------------------------ */
/* Potongan kecil                                                       */
/* ------------------------------------------------------------------ */

// Nama tombol / menu yang ada di aplikasi
function Ui({ children }) {
  return <span className="gd-ui">{children}</span>;
}

// Satu screenshot rasio 16:9. Klik untuk membuka ukuran penuh.
// Kalau file belum ada di folder public, tampil kotak penanda berisi nama file-nya.
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

/*
  Daftar langkah bernomor. Setiap langkah boleh punya:
  - title : judul langkah (wajib)
  - before: elemen di bawah judul, sebelum teks (mis. tombol link)
  - desc  : teks penjelasan
  - list  : daftar poin (array)
  - shots : daftar screenshot (array path gambar)
  - after : elemen di bawah gambar (mis. daftar password)
*/
function Steps({ items }) {
  return (
    <ol className="gd-steps">
      {items.map((step, i) => (
        <li className="gd-step" key={step.title}>
          <span className="gd-num">{i + 1}</span>

          <div className="gd-step-main">
            <p className="gd-step-title">{step.title}</p>
            {step.before ? (
              <div className="gd-step-before">{step.before}</div>
            ) : null}
            {step.desc ? <p className="gd-step-desc">{step.desc}</p> : null}
            {step.list ? (
              <ul className="gd-list">
                {step.list.map((point, j) => (
                  <li key={j}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {step.shots ? (
            <div className="gd-step-shot gd-shots">
              {step.shots.map((src) => (
                <Shot key={src} src={src} alt={step.title} />
              ))}
            </div>
          ) : null}

          {step.after ? <div className="gd-step-after">{step.after}</div> : null}
        </li>
      ))}
    </ol>
  );
}

// Tombol link ke website
function LinkButton() {
  return (
    <a
      className="gd-linkbtn"
      href={SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    </a>
  );
}

// Daftar password tiap unit (tampil di bawah screenshot login)
function UnitPasswords() {
  return (
    <div className="gd-pass">
      <p className="gd-pass-title">Password tiap unit</p>
      <ul className="gd-pass-list">
        {UNITS.map((unit) => (
          <li className="gd-pass-row" key={unit.name}>
            <span className="gd-pass-name">{unit.name}</span>
            <code className="gd-pass-code">{unit.password}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Isi panduan — ubah teks di sini                                      */
/* ------------------------------------------------------------------ */

const BOOKING_STEPS = [
  {
    title: "Login",
    before: <LinkButton />,
    desc: <>Buka atau klik link di atas, lalu masuk dengan akun unit Anda.</>,
    shots: [SHOTS.login],
    after: <UnitPasswords />,
  },
  {
    title: "Cara booking ruangan",
    desc: (
      <>
        Pilih menu <Ui>Pemesanan Ruangan</Ui>. Di sini terdapat 2 tempat
        meeting: <Ui>Ruang Meeting Sadiman</Ui> dan{" "}
        <Ui>Meja Meeting Heksagon</Ui>.
      </>
    ),
    shots: [SHOTS.pilihRuangan],
  },
  {
    title: "Isi form booking",
    list: [
      <>Pilih tanggal meeting.</>,
      <>Pilih ruangan meeting.</>,
      <>Ketuk jam mulai dan jam selesai. Jam yang dicoret sudah terisi.</>,
      <>Isi keperluan meeting.</>,
      <>
        Klik tombol <Ui>Pesan Ruangan ini</Ui>.
      </>,
    ],
    shots: [SHOTS.pilihJam],
  },
  {
    title: "Selesai",
    desc: (
      <>
        Klik menu <Ui>Pesanan Saya</Ui>. Pesanan langsung aktif dan tercatat.
        Anda juga bisa membatalkan pesanan dengan mengklik tombol{" "}
        <Ui>Batal</Ui> di daftar pesanan.
      </>
    ),
    shots: [SHOTS.selesai],
  },
];

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function BookingGuide() {
  return (
    <>
      <section className="gd-card" role="tabpanel">
        <Steps items={BOOKING_STEPS} />
      </section>

      <section className="gd-card gd-quick">
        <h2 className="gd-quick-title">Cara cepat lewat Dashboard</h2>
        <p className="gd-quick-desc">
          Bisa juga langsung dari <Ui>Dashboard</Ui>:
        </p>
        <ul className="gd-list">
          <li>Pilih ruangan atau meja dan tanggal.</li>
          <li>
            Klik slot <Ui>Available</Ui> atau <Ui>Tersedia</Ui> di jam yang
            diinginkan.
          </li>
          <li>Isi jendela yang muncul, lalu konfirmasi.</li>
        </ul>
        <div className="gd-quick-shot">
          <Shot src={SHOTS.dashboard} alt="Memesan lewat Dashboard" />
        </div>
      </section>

      <style jsx global>{`
        /* ---- Kartu langkah ---- */

        .gd-card {
          margin-top: 12px;
          padding: 6px 18px;
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-line, #e6e6e1);
          border-radius: 20px;
        }

        .gd-steps {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .gd-step {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 12px 14px;
          padding: 16px 0;
        }

        .gd-step + .gd-step {
          border-top: 1px solid var(--color-line, #e6e6e1);
        }

        .gd-num {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          background: var(--color-ink, #111);
          border-radius: 50%;
        }

        .gd-step-main {
          flex: 1;
          min-width: 0;
          padding-top: 3px;
        }

        .gd-step-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.3;
        }

        .gd-step-before {
          margin-top: 8px;
        }

        .gd-step-desc {
          margin: 4px 0 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-step-before + .gd-step-desc {
          margin-top: 10px;
        }

        .gd-list {
          margin: 6px 0 0;
          padding-left: 18px;
          font-size: 14px;
          line-height: 1.7;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-list li + li {
          margin-top: 2px;
        }

        .gd-list li::marker {
          color: var(--color-ink, #111);
        }

        .gd-ui {
          display: inline-block;
          padding: 0 8px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.6;
          color: var(--color-ink, #111);
          background: var(--color-panel, #f6f6f3);
          border: 1px solid var(--color-line-strong, #d6d6d0);
          border-radius: 999px;
        }

        /* ---- Screenshot 16:9 ---- */

        .gd-step-shot {
          flex: 0 0 100%;
          margin-top: 2px;
        }

        .gd-shots {
          display: grid;
          gap: 10px;
        }

        .gd-step-after {
          flex: 0 0 100%;
        }

        .gd-shot {
          display: block;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: var(--color-panel, #f6f6f3);
          border: 1px solid var(--color-line-strong, #d6d6d0);
          border-radius: 14px;
          cursor: zoom-in;
        }

        .gd-shot img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gd-shot-missing {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
          justify-content: center;
          padding: 12px;
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

        /* ---- Tombol link ---- */

        .gd-linkbtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          background: var(--color-ink, #111);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .gd-linkbtn:focus-visible {
          outline: 2px solid var(--color-ink, #111);
          outline-offset: 2px;
        }

        /* ---- Password tiap unit ---- */

        .gd-pass {
          margin-top: 2px;
          padding: 14px 16px 6px;
          background: var(--color-panel, #f6f6f3);
          border-radius: 14px;
        }

        .gd-pass-title {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 800;
        }

        .gd-pass-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .gd-pass-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
        }

        .gd-pass-row + .gd-pass-row {
          border-top: 1px solid var(--color-line, #e6e6e1);
        }

        .gd-pass-name {
          min-width: 0;
          font-size: 13px;
          line-height: 1.4;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-pass-code {
          flex-shrink: 0;
          padding: 2px 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-ink, #111);
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-line-strong, #d6d6d0);
          border-radius: 999px;
        }

        /* ---- Cara cepat lewat Dashboard ---- */

        .gd-quick {
          padding: 18px;
        }

        .gd-quick-title {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 800;
        }

        .gd-quick-desc {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--color-ink-soft, #6b6b66);
        }

        .gd-quick-shot {
          margin-top: 12px;
        }

        @media (max-width: 380px) {
          .gd-card {
            padding: 4px 14px;
          }

          .gd-quick {
            padding: 18px;
          }

          .gd-pass-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
}