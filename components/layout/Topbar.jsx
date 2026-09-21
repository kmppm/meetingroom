"use client";

import { useLanguage } from "./LanguageProvider";
import { getUnitMeta } from "@/lib/units";

export function Topbar({ session, onRequestLogin }) {
  const { locale, toggleLocale } = useLanguage();
  const unitMeta = session ? getUnitMeta(session.unit) : null;

  function handleIdentityClick() {
    if (!session && onRequestLogin) onRequestLogin();
  }

  return (
    <header className="topbar">
      <div className="topbar-search">
        <button type="button" className="search-pill">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
        </button>

        <div className="lang-toggle">
          <span
            className={`lang-toggle-indicator${locale === "id" ? " is-en" : ""}`}
          />
          <button
            type="button"
            className={locale === "en" ? "active" : ""}
            onClick={() => locale !== "en" && toggleLocale()}
          >
            EN
          </button>
          <button
            type="button"
            className={locale === "id" ? "active" : ""}
            onClick={() => locale !== "id" && toggleLocale()}
          >
            ID
          </button>
        </div>
      </div>

      <div className="topbar-right">
        <div
          className="topbar-identity"
          onClick={handleIdentityClick}
          style={!session ? { cursor: "pointer" } : undefined}
        >
          <div className="topbar-identity-text">
            <div className="topbar-name">
              {session ? unitMeta.name : "Guest"}
            </div>
            {session?.role === "admin" ? (
              <div className="topbar-role">Admin</div>
            ) : null}
          </div>
          <div
            className="avatar"
            style={{ background: session ? unitMeta.color : "#9ca3af" }}
          >
            {session ? unitMeta.initials : "?"}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .topbar {
          height: var(--topbar-height);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 0 32px 0 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .topbar-search {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .search-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--color-line-strong);
          border-radius: 999px;
          background: var(--color-surface);
          padding: 0 20px;
          height: 38px;
          min-width: 260px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-ink-soft);
          cursor: pointer;
        }

        .topbar-identity {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-identity-text {
          text-align: right;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }

        .topbar-name {
          font-size: 14px;
          font-weight: 600;
        }

        .topbar-role {
          font-size: 12px;
          color: var(--color-ink-soft);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .lang-toggle {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid var(--color-line-strong);
          border-radius: 999px;
          background: var(--color-surface);
          height: 38px;
          padding: 3px;
          flex-shrink: 0;
        }

        .lang-toggle-indicator {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2b2b2b;
          transition: transform 320ms cubic-bezier(0.65, 0, 0.35, 1);
        }

        .lang-toggle-indicator.is-en {
          transform: translateX(32px);
        }

        .lang-toggle button {
          position: relative;
          z-index: 1;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--color-ink-soft);
          cursor: pointer;
          transition: color 320ms cubic-bezier(0.65, 0, 0.35, 1);
        }

        .lang-toggle button.active {
          color: #fff;
        }

        @media (max-width: 860px) {
          .topbar {
            padding: 0 16px;
            gap: 10px;
          }

          .search-pill {
            min-width: 0;
            flex: 1;
            padding: 0 14px;
          }

          .topbar-identity-text {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .search-pill {
            width: 38px;
            padding: 0;
            justify-content: center;
          }

          .search-pill span {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}