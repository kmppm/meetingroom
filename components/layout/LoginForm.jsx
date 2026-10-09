"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UNITS } from "@/lib/units";
import { useLanguage } from "./LanguageProvider";

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

  return (
    <>
      {isModal ? (
        <div className="login-modal-card">
          <button
            type="button"
            className="login-modal-dismiss"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          {form}
        </div>
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

          <div className="card login-card">
            <div className="login-brand" />
            {form}
          </div>
        </div>
      )}

      <style jsx global>{`
        /* ---------- Kartu modal ---------- */
        .login-modal-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 36px 32px 28px;
          box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12);
        }

        .login-modal-dismiss {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 50%;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          color: #94a3b8;
          transition: background-color 120ms ease, color 120ms ease;
        }

        .login-modal-dismiss:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* ---------- Form (dipakai modal & halaman /login) ---------- */
        .lf-form {
          display: flex;
          flex-direction: column;
        }

        .lf-header {
          text-align: center;
        }

        .lf-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #0f172a;
        }

        .lf-subtitle {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: #64748b;
        }

        .lf-fields {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lf-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        /* Semua kolom (dropdown & password) berukuran sama */
        .lf-control {
          display: block;
          width: 100%;
          height: 48px;
          padding: 0 16px;
          box-sizing: border-box;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background-color: #ffffff;
          font-family: inherit;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }

        .lf-control::placeholder {
          color: #94a3b8;
        }

        .lf-control:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }

        .lf-select-wrap {
          position: relative;
        }

        .lf-select {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          padding-right: 44px;
        }

        .lf-chevron {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          display: flex;
          color: #94a3b8;
          pointer-events: none;
        }

        /* Abu-abu selama belum ada unit yang dipilih */
        .lf-select:invalid {
          color: #94a3b8;
        }

        .lf-select option {
          color: #0f172a;
        }

        .lf-password-wrap {
          position: relative;
        }

        .lf-control-password {
          padding-right: 48px;
        }

        /* Ikon mata di dalam kolom password, sisi kanan */
        .lf-eye {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: color 120ms ease, background-color 120ms ease;
        }

        .lf-eye:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .lf-alert {
          margin: 16px 0 0;
          border-radius: 10px;
          background: #fef2f2;
          padding: 10px 14px;
          font-size: 13px;
          color: #dc2626;
        }

        /* Tombol masuk: hitam, ukuran sama dengan kolom password */
        .lf-submit {
          margin-top: 20px;
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 10px;
          background: #111111;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: background-color 120ms ease, opacity 120ms ease;
        }

        .lf-submit:hover {
          background: #000000;
        }

        .lf-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lf-help {
          margin: 14px 0 0;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
        }
      `}</style>
    </>
  );
}