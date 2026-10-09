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
            <div className="dashboard-resource-tabs">
              {Object.values(RESOURCES).map((r) => (
                <button
                  key={r.code}
                  type="button"
                  className={`btn resource-btn ${
                    resource === r.code ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setResource(r.code)}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <DateNav date={date} onChange={setDate} t={t} locale={locale} hideLabel />
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

        @media (max-width: 860px) {
          .dashboard-page-fill {
            position: static;
            inset: auto;
            display: block;
          }

          .dashboard-card {
            flex: none;
            min-height: 0;
            border-radius: 16px;
          }

          .dashboard-card-header {
            padding: 16px 16px 12px;
          }

          .dashboard-card-body {
            flex: none;
            overflow-y: visible;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}