"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";

export function LoginForm({ onSuccess, onClose }) {
  const { t, locale, toggleLocale } = useLanguage();
  const router = useRouter();
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

  if (isModal) {
    return (
      <div className="login-modal-card">
        <button
          type="button"
          className="login-modal-dismiss"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <form className="login-modal-form" onSubmit={handleSubmit}>
          <div className="login-modal-header">
            <h1 className="login-modal-title">{t.login.title}</h1>
            <p className="login-modal-subtitle">{t.login.subtitle}</p>
          </div>

          <div className="login-modal-fields">
            <input
              type="text"
              required
              placeholder={t.login.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-modal-input"
              autoComplete="username"
            />

            <div className="login-modal-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={t.login.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-modal-input login-modal-input-password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="login-modal-toggle-visibility"
              >
                {showPassword
                  ? locale === "id"
                    ? "Sembunyikan"
                    : "Hide"
                  : locale === "id"
                  ? "Tampilkan"
                  : "Show"}
              </button>
            </div>
          </div>

          <p className="login-modal-help">
            {locale === "id"
              ? "Mengalami kendala masuk?"
              : "Having trouble signing in?"}
          </p>

          {error ? <p className="login-modal-alert">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="login-modal-submit"
          >
            {submitting ? t.common.loading : t.login.submit}
          </button>

        </form>

        <style jsx global>{`
          .login-modal-card {
            position: relative;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            padding: 32px;
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

          .login-modal-form {
            display: flex;
            flex-direction: column;
          }

          .login-modal-header {
            text-align: center;
          }

          .login-modal-title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #0f172a;
            margin: 0;
          }

          .login-modal-subtitle {
            margin-top: 8px;
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8;
          }

          .login-modal-fields {
            margin-top: 32px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .login-modal-input {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: transparent;
            padding: 12px 16px;
            font-size: 14px;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;
            transition: border-color 120ms ease;
          }

          .login-modal-input::placeholder {
            color: #94a3b8;
          }

          .login-modal-input:focus {
            border-color: #94a3b8;
          }

          .login-modal-password-wrap {
            position: relative;
          }

          .login-modal-input-password {
            padding-right: 64px;
          }

          .login-modal-toggle-visibility {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            border: none;
            background: transparent;
            font-size: 12px;
            font-weight: 500;
            color: #94a3b8;
            cursor: pointer;
          }

          .login-modal-toggle-visibility:hover {
            color: #0f172a;
          }

          .login-modal-help {
            margin-top: 12px;
            font-size: 12px;
            font-weight: 500;
            color: #94a3b8;
          }

          .login-modal-alert {
            margin-top: 12px;
            border-radius: 8px;
            background: #fef2f2;
            padding: 10px 14px;
            font-size: 12px;
            color: #dc2626;
          }

          .login-modal-submit {
            margin-top: 20px;
            width: 100%;
            border: none;
            border-radius: 8px;
            background: #bcd7f6;
            padding: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            cursor: pointer;
            transition: opacity 120ms ease;
          }

          .login-modal-submit:hover {
            opacity: 0.9;
          }

          .login-modal-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

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

      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="login-brand" />
        <h1 className="login-title">{t.login.title}</h1>
        <p className="login-subtitle">{t.login.subtitle}</p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="form-field">
          <label className="form-label" htmlFor="username">
            {t.login.username}
          </label>
          <input
            id="username"
            className="input"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="password">
            {t.login.password}
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={submitting}
        >
          {submitting ? t.common.loading : t.login.submit}
        </button>
      </form>
    </div>
  );
}