"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UNITS } from "@/lib/units";
import { useLanguage } from "./LanguageProvider";

// Letakkan file video di folder public/ lalu sesuaikan nama file di sini.
// Contoh: public/login-video.mp4 -> "/login-video.mp4"
const LOGIN_VIDEO_SRC = "/login-video1.mp4";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.5 10.5 0 0 1 12 19C5.5 19 2 12 2 12a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.8 9.8 0 0 1 12 4c6.5 0 10 8 10 8a18.6 18.6 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function LoginForm({ onSuccess, onClose }) {
  const { t, locale, toggleLocale } = useLanguage();
  const router = useRouter();
  const isId = locale === "id";

  // "username" berisi kode unit yang dipilih dari dropdown (bukan teks yang diketik).
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Video hanya dimuat di layar lebar (panel video disembunyikan di mobile,
  // jadi tidak perlu mengunduh videonya). Kalau user memilih "kurangi gerakan",
  // video tidak diputar otomatis.
  const [showVideo, setShowVideo] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 861px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setShowVideo(wide.matches);
      setReduceMotion(reduce.matches);
    };
    update();
    wide.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  const isModal = Boolean(onClose);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.login.error);
        setSubmitting(false);
        return;
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(t.errors.generic);
      setSubmitting(false);
    }
  }

  const form = (
    <form className="lf-form" onSubmit={handleSubmit}>
      <div className="lf-header">
        <h1 className="lf-title">{t.login.title}</h1>
        <p className="lf-subtitle">{t.login.subtitle}</p>
      </div>

      <div className="lf-fields">
        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-unit">
            Unit
          </label>
          <div className="lf-select-wrap">
            <select
              id="lf-unit"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="lf-control lf-select"
            >
              <option value="" disabled>
                {isId ? "Pilih unit" : "Select unit"}
              </option>
              {Object.values(UNITS).map((u) => (
                <option key={u.code} value={u.code}>
                  {u.name}
                </option>
              ))}
            </select>
            <span className="lf-chevron">
              <ChevronIcon />
            </span>
          </div>
        </div>

        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-password">
            {t.login.password}
          </label>
          <div className="lf-password-wrap">
            <input
              id="lf-password"
              type={showPassword ? "text" : "password"}
              required
              placeholder={t.login.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="lf-control lf-control-password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="lf-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? isId ? "Sembunyikan password" : "Hide password"
                  : isId ? "Tampilkan password" : "Show password"
              }
              title={
                showPassword
                  ? isId ? "Sembunyikan password" : "Hide password"
                  : isId ? "Tampilkan password" : "Show password"
              }
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="lf-alert" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="lf-submit">
        {submitting ? t.common.loading : t.login.submit}
      </button>

      <p className="lf-help">
        {isId ? "Mengalami kendala masuk?" : "Having trouble signing in?"}
      </p>
    </form>
  );

  // Kartu dua kolom: video di kiri, form di kanan (dipakai popup & halaman /login).
  const split = (
    <div className="lf-split">
      <div className="lf-media" aria-hidden="true">
        {showVideo ? (
          <video
            className="lf-video"
            src={LOGIN_VIDEO_SRC}
            autoPlay={!reduceMotion}
            loop={!reduceMotion}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
          />
        ) : null}
      </div>

      <div className="lf-panel">
        {isModal ? (
          <button
            type="button"
            className="login-modal-dismiss"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        ) : null}
        {form}
      </div>
    </div>
  );

  return (
    <>
      {isModal ? (
        split
      ) : (
        <div className="login-page">
          <div style={{ position: "absolute", top: 20, right: 20 }}>
            <div className="lang-toggle">
              <button
                type="button"
                className={locale === "id" ? "active" : ""}
                onClick={() => locale !== "id" && toggleLocale()}
              >
                ID
              </button>
              <button
                type="button"
                className={locale === "en" ? "active" : ""}
                onClick={() => locale !== "en" && toggleLocale()}
              >
                EN
              </button>
            </div>
          </div>

          {split}
        </div>
      )}

      <style jsx global>{`
        /* ---------- Kartu dua kolom ---------- */
        .lf-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 880px;
          min-height: 520px;
          background: var(--color-surface);
          border-radius: 14px;
          overflow: hidden;
        }

        /* Kolom kiri: video memenuhi seluruh kolom */
        .lf-media {
          position: relative;
          background: var(--color-panel);
        }

        .lf-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Kolom kanan: form, rata tengah secara vertikal */
        .lf-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
        }

        .login-modal-dismiss {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 50%;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          color: var(--color-ink-soft);
          transition: background-color 120ms ease, color 120ms ease;
        }

        .login-modal-dismiss:hover {
          background: var(--color-panel);
          color: var(--color-ink);
        }

        /* ---------- Form ---------- */
        .lf-form {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
        }

        .lf-header {
          text-align: center;
        }

        .lf-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--color-ink);
        }

        .lf-subtitle {
          margin: 6px 0 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--color-ink-soft);
        }

        .lf-fields {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lf-label {
          display: block;
          margin: 0 0 6px 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink);
        }

        /* Semua kolom (dropdown & password): kapsul 48px, sama dengan tombol */
        .lf-control {
          display: block;
          width: 100%;
          height: 48px;
          padding: 0 20px;
          box-sizing: border-box;
          border: 1px solid var(--color-line-strong);
          border-radius: 999px;
          background-color: var(--color-surface);
          font-family: inherit;
          font-size: 14px;
          color: var(--color-ink);
          outline: none;
          transition: border-color 120ms ease;
        }

        .lf-control::placeholder {
          color: var(--color-ink-soft);
          opacity: 0.7;
        }

        .lf-control:hover {
          border-color: var(--color-ink-soft);
        }

        .lf-control:focus {
          border-color: var(--color-ink);
        }

        .lf-select-wrap {
          position: relative;
        }

        .lf-select {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          padding-right: 48px;
        }

        .lf-chevron {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          display: flex;
          color: var(--color-ink-soft);
          pointer-events: none;
        }

        /* Pudar selama belum ada unit yang dipilih */
        .lf-select:invalid {
          color: var(--color-ink-soft);
        }

        .lf-select option {
          color: var(--color-ink);
        }

        .lf-password-wrap {
          position: relative;
        }

        .lf-control-password {
          padding-right: 52px;
        }

        /* Ikon mata: tombol bulat di dalam kolom password, sisi kanan */
        .lf-eye {
          position: absolute;
          top: 50%;
          right: 7px;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: var(--color-ink-soft);
          cursor: pointer;
          transition: color 120ms ease, background-color 120ms ease;
        }

        .lf-eye:hover {
          color: var(--color-ink);
          background: var(--color-panel);
        }

        .lf-alert {
          margin: 16px 0 0;
          border-radius: 16px;
          background: var(--color-danger-soft);
          padding: 10px 16px;
          font-size: 13px;
          color: var(--color-danger);
        }

        /* Tombol masuk: kapsul hitam, tinggi sama dengan kolom */
        .lf-submit {
          margin-top: 20px;
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 999px;
          background: var(--color-ink);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: background-color 120ms ease, opacity 120ms ease;
        }

        .lf-submit:hover:not(:disabled) {
          background: #2b2b2b;
        }

        .lf-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .lf-help {
          margin: 14px 0 0;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-ink-soft);
          opacity: 0.8;
        }

        @media (max-width: 860px) {
          /* Di mobile: video disembunyikan, tinggal form satu kolom */
          .lf-split {
            grid-template-columns: 1fr;
            min-height: 0;
            max-width: 420px;
            margin: 0 auto;
            border-radius: 14px;
          }

          .lf-media {
            display: none;
          }

          .lf-panel {
            padding: 28px 20px 22px;
          }

          .lf-fields {
            margin-top: 20px;
          }

          /* 16px supaya iOS Safari tidak memperbesar layar saat kolom difokuskan */
          .lf-control {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}