"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { LoginForm } from "./LoginForm";
import { LoginModalProvider } from "./LoginModalContext";

export function AppShell({ session, children }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  function openLogin() {
    setLoginOpen(true);
  }

  function closeLogin() {
    setLoginOpen(false);
  }

  function handleLoginSuccess() {
    setLoginOpen(false);
    router.refresh();
  }

  return (
    <div className="app-shell">
      <Sidebar session={session} t={t} onRequestLogin={openLogin} />

      <div className="content-area">
        <Topbar session={session} onRequestLogin={openLogin} />
        <main className="main-content">
          <LoginModalProvider onRequestLogin={openLogin}>
            {children}
          </LoginModalProvider>
        </main>
      </div>

      {loginOpen ? (
        <div className="login-modal-overlay" onClick={closeLogin}>
          <div
            className="login-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <LoginForm onSuccess={handleLoginSuccess} onClose={closeLogin} />
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        :root {
          --shell-gutter: 32px;
          --shell-gutter-mobile: 16px;
          --bottom-nav-height: 64px;
        }

        .app-shell {
          display: flex;
          min-height: 100vh;
        }

        .content-area {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          padding: 28px var(--shell-gutter) 60px;
          overflow-y: auto;
          position: relative;
        }

        .login-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .login-modal-panel {
          width: 100%;
          max-width: 420px;
        }

        @media (max-width: 860px) {
          .app-shell {
            flex-direction: column;
          }

          .main-content {
            padding: 8px var(--shell-gutter-mobile)
              calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 20px);
          }
        }
      `}</style>
    </div>
  );
}