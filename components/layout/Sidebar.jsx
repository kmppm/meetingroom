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
      icon: IconlyCategory,
      requiresAuth: false,
    },
    {
      href: "/booking",
      label: t.nav.booking,
      icon: IconlyCalendar,
      requiresAuth: true,
    },
    {
      href: "/my-orders",
      label: session?.role === "admin" ? t.nav.allOrders : t.nav.myOrders,
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
              <span>{item.label}</span>
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
            position: static;
            width: 100%;
            height: auto;
            flex-direction: row;
            align-items: center;
            border-right: none;
            border-bottom: 1px solid var(--color-line);
          }

          .sidebar-brand {
            border-bottom: none;
            padding: 14px 16px;
          }

          .sidebar-nav {
            flex-direction: row;
            padding: 8px;
            overflow-x: auto;
          }

          .sidebar-footer {
            border-top: none;
            padding: 8px 12px 8px 0;
          }
        }
      `}</style>
    </aside>
  );
}