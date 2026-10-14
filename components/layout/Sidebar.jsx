"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { AiOutlineLogin } from "react-icons/ai";
import { IconlyCategory, IconlyCalendar, IconlyPaper } from "./IconlyIcons";
import { useLanguage } from "./LanguageProvider";

const ICON_SIZE = 20;

// Label pendek untuk bottom nav mobile, mengikuti bahasa aplikasi.
const MOBILE_LABELS = {
  en: { home: "Home", booking: "Book", orders: "Orders", logoutHint: "Tap again to log out" },
  id: {
    home: "Beranda",
    booking: "Pesan",
    orders: "Saya",
    ordersAdmin: "Semua",
    logoutHint: "Ketuk lagi untuk keluar",
  },
};

export function Sidebar({ session, t, onRequestLogin }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const labels = locale === "en" ? MOBILE_LABELS.en : MOBILE_LABELS.id;
  const [confirming, setConfirming] = useState(false);

  // Konfirmasi logout di mobile otomatis batal setelah 3 detik.
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(id);
  }, [confirming]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  // Desktop: langsung logout. Mobile: ketuk dua kali supaya tidak kepencet.
  function handleLogoutClick() {
    const isMobile = window.matchMedia("(max-width: 860px)").matches;
    if (isMobile && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    handleLogout();
  }

  const isAdmin = session?.role === "admin";

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

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">{t.appName}</div>
      <nav className="sidebar-nav">
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
      </nav>
      <div className="sidebar-footer">
        {session ? (
          <button
            className={`sidebar-logout is-logout${confirming ? " is-confirming" : ""}`}
            onClick={handleLogoutClick}
            aria-label={t.nav.logout}
            type="button"
          >
            <RiLogoutCircleRLine size={ICON_SIZE} />
            <span className="sidebar-logout-label">{t.nav.logout}</span>
            {confirming ? (
              <span className="sidebar-logout-hint" role="status">
                {labels.logoutHint}
              </span>
            ) : null}
          </button>
        ) : (
          <button
            className="sidebar-logout"
            onClick={onRequestLogin}
            aria-label={t.login.submit}
            type="button"
          >
            <AiOutlineLogin size={ICON_SIZE} />
            <span className="sidebar-logout-label">{t.login.submit}</span>
          </button>
        )}
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

        /* Petunjuk konfirmasi logout: khusus mobile */
        .sidebar-logout-hint {
          display: none;
        }

        @media (max-width: 860px) {
          /* Dua elemen melayang berdampingan: kapsul navigasi + tombol logout bulat */
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

          /* ---------- Tombol logout / login bulat ---------- */
          .sidebar-footer {
            position: relative;
            flex: 0 0 56px;
            padding: 0;
            display: flex;
            align-items: stretch;
          }

          .sidebar-logout {
            width: 56px;
            height: 56px;
            padding: 0;
            justify-content: center;
            gap: 0;
            border: 1px solid var(--color-line);
            border-radius: 50%;
            background: var(--color-surface, #ffffff);
          }

          .sidebar-logout:hover {
            background: var(--color-surface, #ffffff);
          }

          .sidebar-logout-label {
            display: none;
          }

          .sidebar-logout svg {
            width: 22px;
            height: 22px;
          }

          /* Ketukan pertama: tombol jadi merah penuh + petunjuk di atasnya */
          .sidebar-logout.is-logout.is-confirming,
          .sidebar-logout.is-logout.is-confirming:hover {
            background: #dc2626;
            border-color: #dc2626;
            color: #ffffff;
          }

          .sidebar-logout-hint {
            display: block;
            position: absolute;
            right: 0;
            bottom: calc(100% + 10px);
            padding: 7px 12px;
            border-radius: 10px;
            background: var(--color-ink, #111111);
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
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