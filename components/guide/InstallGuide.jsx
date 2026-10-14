"use client";

/* ------------------------------------------------------------------ */
/* Potongan kecil                                                       */
/* ------------------------------------------------------------------ */

// Nama tombol / menu yang ada di aplikasi
function Ui({ children }) {
  return <span className="gd-ui">{children}</span>;
}

// Daftar langkah bernomor (judul + teks penjelasan)
function Steps({ items }) {
  return (
    <ol className="gd-steps">
      {items.map((step, i) => (
        <li className="gd-step" key={step.title}>
          <span className="gd-num">{i + 1}</span>
          <div className="gd-step-main">
            <p className="gd-step-title">{step.title}</p>
            {step.desc ? <p className="gd-step-desc">{step.desc}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Isi panduan — ubah teks di sini                                      */
/* ------------------------------------------------------------------ */

const INSTALL = {
  ios: {
    label: "iPhone",
    note: "Harus lewat Safari. Kalau link terbuka dari WhatsApp, salin dulu lalu buka di Safari.",
    steps: [
      {
        title: "Buka link di Safari",
      },
      {
        title: "Ketuk tombol Share",
        desc: <>Ikon kotak dengan panah ke atas, di bawah layar.</>,
      },
      {
        title: "Pilih Add to Home Screen",
        desc: (
          <>
            Scroll menu ke bawah, pilih <Ui>Add to Home Screen</Ui>, lalu{" "}
            <Ui>Add</Ui>.
          </>
        ),
      },
      {
        title: "Selesai",
        desc: <>Buka aplikasi dari ikon kalender hitam di layar utama.</>,
      },
    ],
  },
  android: {
    label: "Android",
    note: "Pakai Chrome. Kalau link terbuka dari WhatsApp, salin dulu lalu buka di Chrome.",
    steps: [
      {
        title: "Buka link di Chrome",
      },
      {
        title: "Ketuk menu ⋮",
        desc: <>Titik tiga di kanan atas.</>,
      },
      {
        title: "Pilih Install app",
        desc: (
          <>
            Pilih <Ui>Install app</Ui> (atau <Ui>Add to Home screen</Ui>), lalu{" "}
            <Ui>Install</Ui>.
          </>
        ),
      },
      {
        title: "Selesai",
        desc: <>Buka aplikasi dari ikon kalender hitam di layar utama.</>,
      },
    ],
  },
  laptop: {
    label: "Laptop",
    note: "Pakai Chrome atau Edge.",
    steps: [
      {
        title: "Buka link di Chrome atau Edge",
      },
      {
        title: "Klik Install",
        desc: (
          <>
            Buka menu ⋮, pilih <Ui>Cast, save, and share</Ui>, lalu{" "}
            <Ui>Install page as app</Ui>, dan klik <Ui>Install</Ui>.
          </>
        ),
      },
      {
        title: "Selesai",
        desc: (
          <>Buka aplikasi dari menu Start. Bisa juga di-pin ke taskbar.</>
        ),
      },
    ],
  },
  safari: {
    label: "MacBook (Safari)",
    note: "Khusus Safari di macOS Sonoma atau yang lebih baru.",
    steps: [
      {
        title: "Buka link di Safari",
      },
      {
        title: "Klik menu File",
        desc: <>Menu File di bar atas layar, lalu pilih <Ui>Add to Dock</Ui>.</>,
      },
      {
        title: "Klik Add",
        desc: <>Aplikasi langsung muncul di Dock dan Launchpad.</>,
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function InstallGuide() {
  // iPhone di atas, Android di bawahnya (urutan mengikuti INSTALL)
  return (
    <div role="tabpanel">
      {Object.entries(INSTALL).map(([key, item]) => (
        <section className="gd-card" key={key}>
          <h2 className="gd-os-title">{item.label}</h2>
          <p className="gd-note">{item.note}</p>
          <Steps items={item.steps} />
        </section>
      ))}

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

        .gd-step-desc {
          margin: 4px 0 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--color-ink-soft, #6b6b66);
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

        /* ---- Judul iPhone / Android ---- */

        .gd-os-title {
          margin: 16px 0 0;
          font-size: 16px;
          font-weight: 800;
        }

        .gd-note {
          margin: 12px 0 0;
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.55;
          background: var(--color-panel, #f6f6f3);
          border-radius: 12px;
        }

        @media (max-width: 380px) {
          .gd-card {
            padding: 4px 14px;
          }
        }
      `}</style>
    </div>
  );
}