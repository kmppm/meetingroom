"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { AiOutlineLogin } from "react-icons/ai";
import { IconlyCategory, IconlyCalendar, IconlyPaper } from "./IconlyIcons";

const ICON_SIZE = 20;

export function Sidebar({ session, t, onRequestLogin }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  const navItems = [
    {
      href: "/dashboard",
      label: t.nav.dashboard,
      mobileLabel: "Home",
      icon: IconlyCategory,
      requiresAuth: false,
    },
    {
      href: "/booking",
      label: t.nav.booking,
      mobileLabel: "Pesan",
      icon: IconlyCalendar,
      requiresAuth: true,
    },
    {
      href: "/my-orders",
      label: session?.role === "admin" ? t.nav.allOrders : t.nav.myOrders,
      mobileLabel: "Saya",
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
            className="sidebar-logout is-logout"
            onClick={handleLogout}
            type="button"
          >
            <RiLogoutCircleRLine size={ICON_SIZE} />
            <span>{t.nav.logout}</span>
          </button>
        ) : (
          <button
            className="sidebar-logout"
            onClick={onRequestLogin}
            type="button"
          >
            <AiOutlineLogin size={ICON_SIZE} />
            <span>{t.login.submit}</span>
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

        @media (max-width: 860px) {
          .sidebar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            top: auto;
            width: 100%;
            height: auto;
            flex-direction: row;
            align-items: stretch;
            border-right: none;
            border-top: 1px solid var(--color-line);
            background: var(--color-surface, #ffffff);
            opacity: 1;
            backdrop-filter: none;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            z-index: 50;
            box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.12);
          }

          .sidebar-brand {
            display: none;
          }

          .sidebar-nav {
            flex: 1;
            flex-direction: row;
            padding: 6px 4px;
            gap: 2px;
          }

          .sidebar-link {
            flex: 1;
            flex-direction: column;
            justify-content: center;
            gap: 2px;
            padding: 6px 2px;
            font-size: 11px;
            text-align: center;
          }

          .sidebar-link.active {
            background: transparent;
            color: var(--color-sidebar-active-mobile, #111827);
            font-weight: 700;
          }

          .sidebar-link:hover {
            background: transparent;
          }

          .sidebar-link-label {
            display: none;
          }

          .sidebar-link-label-mobile {
            display: block;
          }

          .sidebar-link span {
            font-size: 11px;
            line-height: 1.1;
          }

          .sidebar-footer {
            flex-shrink: 0;
            border-top: none;
            padding: 6px 4px;
            display: flex;
          }

          .sidebar-logout {
            flex-direction: column;
            justify-content: center;
            gap: 2px;
            width: auto;
            padding: 6px 10px;
            font-size: 11px;
            text-align: center;
          }

          .sidebar-logout span {
            font-size: 11px;
            line-height: 1.1;
          }
        }
      `}</style>
    </aside>
  );
}