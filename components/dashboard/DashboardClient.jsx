"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { useLoginModal } from "@/components/layout/LoginModalContext";
import { DateNav } from "@/components/ui/DateNav";
import { ScheduleGrid } from "./ScheduleGrid";
import { ScheduleSkeleton } from "./ScheduleSkeleton";
import { BookingModal } from "@/components/booking/BookingModal";
import { RESOURCES, DEFAULT_RESOURCE } from "@/lib/resources";
import { todayISO } from "@/lib/time";

// Nama pendek khusus tampilan mobile, mis. "Ruangan Meeting Sadiman" -> "Ruangan Sadiman"
function shortResourceName(name) {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : name;
}

export function DashboardClient({ session }) {
  const { t, locale } = useLanguage();
  const requestLogin = useLoginModal();
  const [date, setDate] = useState(todayISO());
  const [resource, setResource] = useState(DEFAULT_RESOURCE);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStart, setModalStart] = useState(null);
  const [success, setSuccess] = useState("");

  async function loadBookings(forDate, forResource) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bookings?date=${forDate}&resource=${forResource}`
      );
      const data = await res.json();
      setBookings(res.ok ? data.bookings : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings(date, resource);
  }, [date, resource]);

  function handleCreated() {
    setModalStart(null);
    setSuccess(t.booking.success);
    loadBookings(date, resource);
    setTimeout(() => setSuccess(""), 4000);
  }

  function handleSlotClick(startTime) {
    if (!session) {
      requestLogin();
      return;
    }
    setModalStart(startTime);
  }

  return (
    <div className="dashboard-page-fill">
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="page-header">
            <h1 className="page-title">{t.dashboard.title}</h1>
            <p className="page-subtitle">{t.dashboard.subtitle} {t.dashboard.hint}</p>
          </div>

          {success ? <div className="alert alert-success">{success}</div> : null}

          <div className="dashboard-toolbar">
            <div
              className="dashboard-resource-tabs"
              role="tablist"
              aria-label={t.dashboard.title}
            >
              {Object.values(RESOURCES).map((r) => (
                <button
                  key={r.code}
                  type="button"
                  role="tab"
                  aria-selected={resource === r.code}
                  className={`btn resource-btn ${
                    resource === r.code ? "btn-primary" : "btn-secondary"
                  }`}
                  aria-label={r.name}
                  onClick={() => setResource(r.code)}
                >
                  <span className="resource-name-full">{r.name}</span>
                  <span className="resource-name-short" aria-hidden="true">
                    {shortResourceName(r.name)}
                  </span>
                </button>
              ))}
            </div>

            <DateNav
              date={date}
              onChange={setDate}
              t={t}
              locale={locale}
              hideLabel
              mobileCompact
            />
          </div>
        </div>

        <div className="dashboard-card-body">
          {loading ? (
            <ScheduleSkeleton />
          ) : (
            <ScheduleGrid
              date={date}
              bookings={bookings}
              onSlotClick={handleSlotClick}
              t={t}
              locale={locale}
            />
          )}
        </div>
      </div>

      {modalStart && session ? (
        <BookingModal
          date={date}
          initialStart={modalStart}
          resource={resource}
          session={session}
          t={t}
          locale={locale}
          onClose={() => setModalStart(null)}
          onCreated={handleCreated}
        />
      ) : null}

      <style jsx global>{`
        .dashboard-page-fill {
          position: absolute;
          top: 0;
          left: 0;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
        }

        .dashboard-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .dashboard-card-header {
          flex-shrink: 0;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-line);
        }

        .dashboard-card-header .date-nav {
          margin-bottom: 0;
        }

        .dashboard-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 16px;
          margin-top: 12px;
        }

        .dashboard-resource-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dashboard-toolbar .resource-btn {
          border-radius: 999px;
        }

        .dashboard-toolbar .date-nav {
          flex: 1 1 460px;
          min-width: 0;
          margin-bottom: 0;
        }

        .dashboard-card-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .resource-name-short {
          display: none;
        }

        @media (max-width: 860px) {
          /* Card tetap diam setinggi area antara topbar dan bottom nav,
             hanya .dashboard-card-body yang discroll. */
          .dashboard-page-fill {
            top: 8px;
            left: var(--shell-gutter-mobile);
            right: var(--shell-gutter-mobile);
            bottom: calc(
              var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 12px
            );
          }

          .dashboard-card {
            border-radius: 16px;
          }

          .dashboard-card-header {
            padding: 12px;
          }

          /* Judul & subjudul disembunyikan secara visual (bottom nav sudah
             menandai halaman aktif), tetap ada untuk screen reader. */
          .dashboard-card-header .page-header {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0 0 0 0);
            white-space: nowrap;
            border: 0;
          }

          .dashboard-toolbar {
            flex-direction: column;
            align-items: stretch;
            flex-wrap: nowrap;
            gap: 10px;
            margin-top: 0;
          }

          /* ---------- Segmented control ruangan ---------- */
          .dashboard-resource-tabs {
            flex-wrap: nowrap;
            width: 100%;
            gap: 2px;
            padding: 3px;
            background: var(--color-panel);
            border: 1px solid var(--color-line);
            border-radius: 999px;
          }

          .dashboard-toolbar .resource-btn {
            flex: 1 1 0;
            min-width: 0;
            height: 36px;
            padding: 0 8px;
            font-size: 13px;
            line-height: 1;
            white-space: nowrap;
          }

          /* Pilihan non-aktif melebur ke wadah; yang aktif tetap pil gelap */
          .dashboard-toolbar .resource-btn.btn-secondary {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
            color: var(--color-ink-soft);
          }

          /* Kontrol tanggal: satu baris penuh (diatur di DateNav) */
          .dashboard-toolbar .date-nav {
            flex: none;
            width: 100%;
          }

          .resource-name-full {
            display: none;
          }

          .resource-name-short {
            display: inline;
          }

          .dashboard-card-body {
            padding: 12px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
        }
      `}</style>
    </div>
  );
}