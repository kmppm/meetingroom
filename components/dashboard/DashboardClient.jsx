"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { useLoginModal } from "@/components/layout/LoginModalContext";
import { DateNav } from "@/components/ui/DateNav";
import { ScheduleGrid } from "./ScheduleGrid";
import { ScheduleSkeleton } from "./ScheduleSkeleton";
import { BookingModal } from "@/components/booking/BookingModal";
import { todayISO } from "@/lib/time";

export function DashboardClient({ session }) {
  const { t, locale } = useLanguage();
  const requestLogin = useLoginModal();
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStart, setModalStart] = useState(null);
  const [success, setSuccess] = useState("");

  async function loadBookings(forDate) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${forDate}`);
      const data = await res.json();
      setBookings(res.ok ? data.bookings : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings(date);
  }, [date]);

  function handleCreated() {
    setModalStart(null);
    setSuccess(t.booking.success);
    loadBookings(date);
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
          <DateNav date={date} onChange={setDate} t={t} locale={locale} />
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
            />
          )}
        </div>
      </div>

      {modalStart && session ? (
        <BookingModal
          date={date}
          initialStart={modalStart}
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