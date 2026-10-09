"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function AdminLoginForm() {
  const { t, locale, toggleLocale } = useLanguage();
  const router = useRouter();
  const isId = locale === "id";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(t.errors.generic);
      setSubmitting(false);
    }
  }

  const eyeLabel = showPassword
    ? isId ? "Sembunyikan password" : "Hide password"
    : isId ? "Tampilkan password" : "Show password";

  return (
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

        <form className="al-form" onSubmit={handleSubmit}>
          <div className="al-header">
            <span className="al-badge">Admin</span>
            <h1 className="al-title">
              {isId ? "Login Admin" : "Admin Login"}
            </h1>
            <p className="al-subtitle">
              {isId
                ? "Masuk dengan akun admin Anda"
                : "Sign in with your admin account"}
            </p>
          </div>

          <div className="al-fields">
            <div className="al-field">
              <label className="al-label" htmlFor="al-username">
                Username
              </label>
              <input
                id="al-username"
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="al-control"
                autoComplete="username"
              />
            </div>

            <div className="al-field">
              <label className="al-label" htmlFor="al-password">
                {t.login.password}
              </label>
              <div className="al-password-wrap">
                <input
                  id="al-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t.login.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="al-control al-control-password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="al-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={eyeLabel}
                  title={eyeLabel}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p className="al-alert" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="al-submit">
            {submitting ? t.common.loading : t.login.submit}
          </button>

          <Link href="/login" className="al-back">
            {isId ? "← Kembali ke login unit" : "← Back to unit login"}
          </Link>
        </form>
      </div>

      <style jsx global>{`
        .al-form {
          display: flex;
          flex-direction: column;
        }

        .al-header {
          text-align: center;
        }

        .al-badge {
          display: inline-block;
          margin-bottom: 12px;
          padding: 3px 12px;
          border-radius: 999px;
          background: #111111;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #ffffff;
        }

        .al-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #0f172a;
        }

        .al-subtitle {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: #64748b;
        }

        .al-fields {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .al-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .al-control {
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

        .al-control::placeholder {
          color: #94a3b8;
        }

        .al-control:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }

        .al-password-wrap {
          position: relative;
        }

        .al-control-password {
          padding-right: 48px;
        }

        .al-eye {
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

        .al-eye:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .al-alert {
          margin: 16px 0 0;
          border-radius: 10px;
          background: #fef2f2;
          padding: 10px 14px;
          font-size: 13px;
          color: #dc2626;
        }

        .al-submit {
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

        .al-submit:hover {
          background: #000000;
        }

        .al-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .al-back {
          margin-top: 16px;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
        }

        .al-back:hover {
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}