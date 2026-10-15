"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconlyCategory,
  IconlyCalendar,
  IconlyPaper,
  IconlyDocument,
  IconlyDownload,
  IconlyLogin,
  IconlyLogout,
} from "./IconlyIcons";
import { useLanguage } from "./LanguageProvider";
import { useInstall } from "./InstallProvider";
import { getUnitMeta } from "@/lib/units";

const ICON_SIZE = 20;

// Link menu Panduan (halaman /panduan, dibuka di tab baru)
const GUIDE_URL = "/panduan";

// Label khusus mobile (bottom nav + menu akun), mengikuti bahasa aplikasi.
const MOBILE_LABELS = {
  en: {
    home: "Home",
    booking: "Book",
    orders: "Orders",
    language: "Language",
    account: "Account menu",
    guest: "Guest",
  },
  id: {
    home: "Beranda",
    booking: "Pesan",
    orders: "Saya",
    ordersAdmin: "Semua",
    language: "Bahasa",
    account: "Menu akun",
    guest: "Tamu",
  },
};

// Label menu tambahan (tampil di desktop saja), mengikuti bahasa aplikasi.
const EXTRA_LABELS = {
  en: {
    menu: "Menu",
    others: "Others",
    guide: "Guide",
    install: "Install App",
  },
  id: {
    menu: "Menu",
    others: "Lainnya",
    guide: "Panduan",
    install: "Install Aplikasi",
  },
};

export function Sidebar({ session, t, onRequestLogin }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, toggleLocale } = useLanguage();
  const { canInstall, installed, install } = useInstall();
  const labels = locale === "en" ? MOBILE_LABELS.en : MOBILE_LABELS.id;
  const extraLabels = locale === "en" ? EXTRA_LABELS.en : EXTRA_LABELS.id;
  const [menuOpen, setMenuOpen] = useState(false);

  const unitMeta = session ? getUnitMeta(session.unit) : null;
  const isAdmin = session?.role === "admin";

  // Menu akun (mobile) tertutup saat pindah halaman atau menekan Escape.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  function handleMenuLogin() {
    setMenuOpen(false);
    onRequestLogin();
  }

  // Menu Install Aplikasi: kalau browser siap (Chrome/Edge), langsung munculkan
  // dialog install. Kalau tidak (Safari, Firefox, dll), buka halaman Panduan.
  async function handleInstall() {
    if (canInstall) {
      await install();
      return;
    }
    window.open(GUIDE_URL, "_blank", "noopener,noreferrer");
  }

  const navItems = [
    {
      href: "/dashboard",
      label: t.nav.dashboard,
      mobileLabel: labels.home,
      icon: IconlyCategory,
      requiresAuth: false,
    },
    {
      href: "/booking",
      label: t.nav.booking,
      mobileLabel: labels.booking,
      icon: IconlyCalendar,
      requiresAuth: true,
    },
    {
      href: "/my-orders",
      label: isAdmin ? t.nav.allOrders : t.nav.myOrders,
      mobileLabel: isAdmin && labels.ordersAdmin ? labels.ordersAdmin : labels.orders,
      icon: IconlyPaper,
      requiresAuth: true,
    },
  ];

  const avatarStyle = { background: session ? unitMeta?.color : "#9ca3af" };
  const avatarText = session ? unitMeta?.initials : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">{t.appName}</div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">{extraLabels.menu}</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);

          function handleClick(e) {
            if (item.requiresAuth && !session) {
              e.preventDefault();
              onRequestLogin();
            }
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={handleClick}
            >
              <Icon size={ICON_SIZE} color="currentColor" />
              <span className="sidebar-link-label">{item.label}</span>
              <span className="sidebar-link-label-mobile">
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}

        {/* Menu tambahan: hanya tampil di desktop */}
        <div className="sidebar-section-title is-spaced">{extraLabels.others}</div>
        <a
          href={GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link is-desktop-only"
        >
          <IconlyDocument size={ICON_SIZE} color="currentColor" />
          <span className="sidebar-link-label">{extraLabels.guide}</span>
        </a>

        {/* Disembunyikan kalau web ini sudah dibuka sebagai aplikasi terpasang */}
        {!installed ? (
          <button
            type="button"
            className="sidebar-link is-desktop-only"
            onClick={handleInstall}
          >
            <IconlyDownload size={ICON_SIZE} color="currentColor" />
            <span className="sidebar-link-label">{extraLabels.install}</span>
          </button>
        ) : null}
      </nav>
      <div className="sidebar-footer">
        {/* Desktop: tombol logout / login seperti semula */}
        {session ? (
          <button
            className="sidebar-logout is-logout"
            onClick={handleLogout}
            type="button"
          >
            <IconlyLogout size={ICON_SIZE} color="currentColor" />
            <span>{t.nav.logout}</span>
          </button>
        ) : (
          <button
            className="sidebar-logout"
            onClick={onRequestLogin}
            type="button"
          >
            <IconlyLogin size={ICON_SIZE} color="currentColor" />
            <span>{t.login.submit}</span>
          </button>
        )}

        {/* Mobile: tombol akun bulat + menu (bahasa, logout/login) */}
        <div className="sidebar-account">
          <button
            type="button"
            className={`sidebar-account-btn${menuOpen ? " is-open" : ""}`}
            aria-label={labels.account}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sidebar-account-avatar" style={avatarStyle}>
              {avatarText || <IconPerson />}
            </span>
          </button>

          {menuOpen ? (
            <>
              <div
                className="sidebar-account-backdrop"
                onClick={() => setMenuOpen(false)}
              />
              <div className="sidebar-account-menu" role="menu">
                <div className="sidebar-account-who">
                  <span
                    className="sidebar-account-avatar is-sm"
                    style={avatarStyle}
                  >
                    {avatarText || <IconPerson />}
                  </span>
                  <span className="sidebar-account-who-text">
                    <span className="sidebar-account-name">
                      {session ? unitMeta?.name : labels.guest}
                    </span>
                    {isAdmin ? (
                      <span className="sidebar-account-role">Admin</span>
                    ) : null}
                  </span>
                </div>

                <div className="sidebar-account-row">
                  <span className="sidebar-account-row-label">
                    {labels.language}
                  </span>
                  <div className="sidebar-account-seg" role="group">
                    <button
                      type="button"
                      className={locale === "en" ? "is-active" : ""}
                      aria-pressed={locale === "en"}
                      onClick={() => locale !== "en" && toggleLocale()}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      className={locale === "id" ? "is-active" : ""}
                      aria-pressed={locale === "id"}
                      onClick={() => locale !== "id" && toggleLocale()}
                    >
                      ID
                    </button>
                  </div>
                </div>

                <div className="sidebar-account-divider" />

                {session ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="sidebar-account-action is-logout"
                    onClick={handleLogout}
                  >
                    <IconlyLogout size={ICON_SIZE} color="currentColor" />
                    <span>{t.nav.logout}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className="sidebar-account-action"
                    onClick={handleMenuLogin}
                  >
                    <IconlyLogin size={ICON_SIZE} color="currentColor" />
                    <span>{t.login.submit}</span>
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        .sidebar {
          width: var(--sidebar-width);
          flex-shrink: 0;
          background: var(--color-sidebar-bg);
          color: var(--color-sidebar-ink);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-brand {
          padding: 22px 20px;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .sidebar-nav {
          flex: 1;
          padding: 28px 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          color: var(--color-ink);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 120ms ease, color 120ms ease;
        }

        /* Menu yang berupa <button> (mis. Install Aplikasi) tampil sama seperti link */
        button.sidebar-link {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
        }

        .sidebar-link:hover {
          background: var(--color-panel);
          color: var(--color-sidebar-ink);
        }

        .sidebar-link.active {
          background: var(--color-sidebar-active);
          color: var(--color-ink);
        }

        .sidebar-link svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .sidebar-link-label-mobile {
          display: none;
        }

        /* Judul bagian di sidebar (MENU / LAINNYA) */
        .sidebar-section-title {
          padding: 0 12px;
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-ink-soft);
        }

        .sidebar-section-title.is-spaced {
          margin-top: 28px;
        }

        .sidebar-footer {
          padding: 14px 10px;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: var(--color-sidebar-ink-dim);
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
        }

        .sidebar-logout:hover {
          background: var(--color-panel);
          color: var(--color-ink);
        }

        .sidebar-logout svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .sidebar-logout.is-logout {
          color: #dc2626;
        }

        .sidebar-logout.is-logout:hover {
          background: #fef2f2;
          color: #b91c1c;
        }

        /* Tombol akun + menu: khusus mobile */
        .sidebar-account {
          display: none;
        }

        @media (max-width: 860px) {
          /* Dua elemen melayang berdampingan: kapsul navigasi + tombol akun bulat */
          .sidebar {
            position: fixed;
            top: auto;
            left: var(--shell-gutter-mobile);
            right: var(--shell-gutter-mobile);
            bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            width: auto;
            height: 56px;
            flex-direction: row;
            align-items: stretch;
            gap: 8px;
            padding: 0;
            border: none;
            background: transparent;
            backdrop-filter: none;
            z-index: 50;
          }

          .sidebar-brand {
            display: none;
          }

          /* ---------- Kapsul 3 tab ---------- */
          .sidebar-nav {
            flex: 1 1 0;
            min-width: 0;
            flex-direction: row;
            align-items: stretch;
            gap: 2px;
            padding: 5px;
            background: var(--color-surface, #ffffff);
            border: 1px solid var(--color-line);
            border-radius: 999px;
          }

          .sidebar-link {
            flex: 1 1 0;
            min-width: 0;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            padding: 0 6px;
            border-radius: 999px;
            color: var(--color-ink-soft);
            font-size: 10.5px;
            font-weight: 600;
            text-align: center;
            transition: flex-grow 200ms ease, background-color 160ms ease,
              color 160ms ease;
          }

          /* Menu tambahan (Panduan, Install Aplikasi): tidak tampil di mobile */
          .sidebar-link.is-desktop-only,
          .sidebar-section-title {
            display: none;
          }

          .sidebar-link:hover {
            background: transparent;
            color: var(--color-ink-soft);
          }

          /* Tab aktif: pil gelap, ikon + label berdampingan */
          .sidebar-link.active,
          .sidebar-link.active:hover {
            flex-grow: 1.7;
            flex-direction: row;
            gap: 8px;
            background: var(--color-ink, #111111);
            color: #ffffff;
          }

          .sidebar-link-label {
            display: none;
          }

          .sidebar-link-label-mobile {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.1;
          }

          .sidebar-link.active .sidebar-link-label-mobile {
            font-size: 13px;
            font-weight: 700;
          }

          /* ---------- Tombol akun bulat ---------- */
          .sidebar-footer {
            position: relative;
            flex: 0 0 56px;
            padding: 0;
            display: flex;
            align-items: stretch;
          }

          /* Tombol logout/login versi desktop disembunyikan di mobile */
          .sidebar-footer > .sidebar-logout {
            display: none;
          }

          .sidebar-account {
            display: flex;
            position: relative;
            flex: 1 1 0;
          }

          .sidebar-account-btn {
            width: 56px;
            height: 56px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--color-line);
            border-radius: 50%;
            background: var(--color-surface, #ffffff);
            cursor: pointer;
          }

          .sidebar-account-btn.is-open {
            border-color: var(--color-ink, #111111);
          }

          .sidebar-account-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.02em;
          }

          .sidebar-account-avatar.is-sm {
            width: 34px;
            height: 34px;
            font-size: 12px;
          }

          /* ---------- Menu akun (tanpa shadow, cukup garis tepi) ---------- */
          .sidebar-account-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1;
            background: transparent;
          }

          .sidebar-account-menu {
            position: absolute;
            right: 0;
            bottom: calc(100% + 10px);
            z-index: 2;
            width: 248px;
            max-width: calc(100vw - 32px);
            padding: 6px;
            background: var(--color-surface, #ffffff);
            border: 1px solid var(--color-line-strong);
            border-radius: 18px;
          }

          .sidebar-account-who {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
          }

          .sidebar-account-who-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .sidebar-account-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-ink);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .sidebar-account-role {
            font-size: 12px;
            color: var(--color-ink-soft);
          }

          .sidebar-account-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 6px 10px;
          }

          .sidebar-account-row-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--color-ink-soft);
          }

          .sidebar-account-seg {
            display: flex;
            gap: 2px;
            padding: 2px;
            background: var(--color-panel);
            border: 1px solid var(--color-line);
            border-radius: 999px;
          }

          .sidebar-account-seg button {
            width: 40px;
            height: 30px;
            border: none;
            border-radius: 999px;
            background: transparent;
            color: var(--color-ink-soft);
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .sidebar-account-seg button.is-active {
            background: var(--color-ink, #111111);
            color: #ffffff;
          }

          .sidebar-account-divider {
            height: 1px;
            margin: 6px 4px;
            background: var(--color-line);
          }

          .sidebar-account-action {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 12px 10px;
            border: none;
            border-radius: 12px;
            background: transparent;
            color: var(--color-ink);
            font-family: inherit;
            font-size: 14px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
          }

          .sidebar-account-action.is-logout {
            color: #dc2626;
          }

          .sidebar-account-action:active {
            background: var(--color-panel);
          }
        }

        @media (max-width: 860px) and (prefers-reduced-motion: reduce) {
          .sidebar-link {
            transition: none;
          }
        }
      `}</style>
    </aside>
  );
}

function IconPerson() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}