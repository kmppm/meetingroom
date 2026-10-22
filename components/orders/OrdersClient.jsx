"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { getUnitMeta } from "@/lib/units";
import { getResourceMeta } from "@/lib/resources";
import { todayISO } from "@/lib/time";

function isPastBooking(booking) {
  const today = todayISO();
  if (booking.date < today) return true;
  if (booking.date > today) return false;
  const now = new Date();
  return booking.endMinutes <= now.getHours() * 60 + now.getMinutes();
}

// Sedang berlangsung: hari ini, sudah lewat jam mulai tapi belum jam selesai
function isOngoingBooking(booking) {
  if (booking.date !== todayISO()) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return booking.startMinutes <= nowMinutes && nowMinutes < booking.endMinutes;
}

// Tanggal singkat, contoh: "Rab, 14 Okt 2026" (ID) / "Wed, Oct 14, 2026" (EN)
function formatDateShort(dateStr, locale) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    locale === "en" ? "en-US" : "id-ID",
    { weekday: "short", day: "numeric", month: "short", year: "numeric" }
  );
}

export function OrdersClient({ session }) {
  const { t, locale } = useLanguage();
  const isAdmin = session.role === "admin";
  const resourceLabel = locale === "en" ? "Room / Table" : "Ruangan / Meja";
  const todayLabel = locale === "en" ? "Today" : "Hari ini";
  const allOrdersLabel = locale === "en" ? "All orders" : "Semua pesanan";
  const ongoingLabel = locale === "en" ? "In progress" : "Sedang berlangsung";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");
  // Tanggal filter diisi setelah mount supaya tidak beda antara server dan browser
  const [selectedDate, setSelectedDate] = useState("");
  const [showAll, setShowAll] = useState(false);
  // Render ulang tiap 30 detik supaya status (akan datang / berlangsung / selesai) tetap akurat
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?scope=${isAdmin ? "all" : "mine"}`);
      const data = await res.json();
      setBookings(res.ok ? data.bookings : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedDate(todayISO());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePickDate(value) {
    if (!value) return;
    setSelectedDate(value);
    setShowAll(false);
  }

  function handleToday() {
    setSelectedDate(todayISO());
    setShowAll(false);
  }

  const visibleBookings =
    showAll || !selectedDate
      ? bookings
      : bookings.filter((b) => b.date === selectedDate);

  // Dipisah jadi dua kelompok: yang akan datang dan yang sudah selesai
  const upcomingBookings = visibleBookings.filter((b) => !isPastBooking(b));
  const finishedBookings = visibleBookings.filter((b) => isPastBooking(b));

  async function confirmCancel() {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${pendingCancel.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage(t.orders.cancelled);
        setBookings((prev) => prev.filter((b) => b.id !== pendingCancel.id));
        setTimeout(() => setMessage(""), 4000);
      }
    } finally {
      setCancelling(false);
      setPendingCancel(null);
    }
  }

  // Tabel untuk satu kelompok. Pesanan yang sudah selesai tidak bisa dibatalkan.
  function renderTable(list, finished) {
    if (list.length === 0) {
      return (
        <div className="card">
          <div className="empty-state">{t.common.noBookings}</div>
        </div>
      );
    }

    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t.common.date}</th>
              <th>{t.common.startTime}</th>
              <th>{t.common.endTime}</th>
              <th>{resourceLabel}</th>
              {isAdmin ? <th>{t.common.unit}</th> : null}
              <th>{t.common.purpose}</th>
              <th>{t.common.status}</th>
              <th>{t.common.action}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b, index) => {
              const meta = getUnitMeta(b.unit);
              const resourceMeta = getResourceMeta(b.resource);
              const canCancel = !finished && (isAdmin || b.unit === session.unit);
              const ongoing = !finished && isOngoingBooking(b);
              return (
                <tr key={b.id}>
                  <td className="col-index">
                    <span className="order-no-badge">{index + 1}</span>
                  </td>
                  <td data-label={t.common.date} className="col-date">
                    {formatDateShort(b.date, locale)}
                  </td>
                  <td data-label={t.common.startTime}>{b.startTime}</td>
                  <td data-label={t.common.endTime}>{b.endTime}</td>
                  <td data-label={resourceLabel}>{resourceMeta.name}</td>
                  {isAdmin ? (
                    <td data-label={t.common.unit}>
                      <span className="unit-pill">
                        <span
                          className="unit-dot"
                          style={{ background: meta?.color }}
                        />
                        {meta?.name}
                      </span>
                    </td>
                  ) : null}
                  <td data-label={t.common.purpose}>{b.purpose || "—"}</td>
                  <td data-label={t.common.status}>
                    <span
                      className={`status-badge ${
                        finished
                          ? "status-past"
                          : ongoing
                          ? "status-ongoing"
                          : "status-upcoming"
                      }`}
                    >
                      {finished
                        ? t.common.past
                        : ongoing
                        ? ongoingLabel
                        : t.common.upcoming}
                    </span>
                  </td>
                  <td data-label={t.common.action} className="col-action">
                    {canCancel ? (
                      <button
                        type="button"
                        className="btn btn-danger orders-cancel-btn"
                        onClick={() => setPendingCancel(b)}
                      >
                        {t.common.cancel}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="orders-page-fill">
      <div className="orders-card">
        <div className="orders-card-header">
          <div className="page-header">
            <h1 className="page-title">{isAdmin ? t.orders.titleAll : t.orders.titleMine}</h1>
            <p className="page-subtitle">
              {isAdmin ? t.orders.subtitleAll : t.orders.subtitleMine}
            </p>
          </div>

          <div className="orders-filter">
            <input
              type="date"
              className="input orders-filter-date"
              value={selectedDate}
              onChange={(e) => handlePickDate(e.target.value)}
              aria-label={t.common.date}
            />
            <button
              type="button"
              className={`btn orders-filter-btn ${
                !showAll && selectedDate === todayISO() ? "btn-primary" : "btn-secondary"
              }`}
              onClick={handleToday}
            >
              {todayLabel}
            </button>
            <button
              type="button"
              className={`btn orders-filter-btn ${showAll ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setShowAll(true)}
            >
              {allOrdersLabel}
            </button>
          </div>

          {message ? <div className="alert alert-success">{message}</div> : null}
        </div>

        <div className="orders-card-body">
          {loading ? (
            <div className="empty-state">{t.common.loading}</div>
          ) : (
            <>
              <section className="orders-section">
                <div className="orders-section-head">
                  <h2 className="orders-section-title">{t.common.upcoming}</h2>
                  <span className="orders-section-count">{upcomingBookings.length}</span>
                </div>
                {renderTable(upcomingBookings, false)}
              </section>

              <section className="orders-section">
                <div className="orders-section-head">
                  <h2 className="orders-section-title">{t.common.past}</h2>
                  <span className="orders-section-count">{finishedBookings.length}</span>
                </div>
                {renderTable(finishedBookings, true)}
              </section>
            </>
          )}
        </div>
      </div>

      {pendingCancel ? (
        <div className="modal-overlay" onClick={() => setPendingCancel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t.common.confirmCancelTitle}</h2>
            <p className="modal-subtitle">{t.common.confirmCancelBody}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary orders-modal-btn"
                onClick={() => setPendingCancel(null)}
                disabled={cancelling}
              >
                {t.common.keepBooking}
              </button>
              <button
                type="button"
                className="btn btn-danger orders-modal-btn"
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? t.common.loading : t.common.yesCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .orders-page-fill {
          position: absolute;
          top: 0;
          left: 0;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
        }

        .orders-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .orders-card-header {
          flex-shrink: 0;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-line);
        }

        .orders-card-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        /* ---------- Filter tanggal ---------- */

        .orders-filter {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .orders-filter-date {
          width: auto;
          min-width: 0;
          border-radius: 999px;
          padding: 8px 14px;
        }

        .orders-filter-btn {
          border-radius: 999px;
          padding: 8px 16px;
        }

        /* ---------- Kelompok: akan datang / selesai ---------- */

        .orders-section + .orders-section {
          margin-top: 28px;
        }

        .orders-section-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .orders-section-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }

        .orders-section-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          border: 1px solid var(--color-line);
          background: var(--color-bg);
          color: var(--color-ink-soft);
          font-size: 12px;
          font-weight: 700;
        }

        .table tbody tr td.col-date {
          white-space: nowrap;
        }

        /* ---------- Lencana status ---------- */

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.5;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .status-badge::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .status-upcoming {
          background: var(--color-success-soft);
          color: var(--color-success);
        }

        /* Sedang berlangsung: abu-abu netral dengan titik berkedip */
        .status-ongoing {
          background: var(--color-panel);
          color: var(--color-ink);
          border: 1px solid var(--color-line-strong);
        }

        .status-ongoing::before {
          animation: status-ongoing-blink 1.4s ease-in-out infinite;
        }

        @keyframes status-ongoing-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .status-ongoing::before {
            animation: none;
          }
        }

        .status-past {
          background: var(--color-bg);
          color: var(--color-ink-soft);
          border: 1px solid var(--color-line);
        }

        .order-no-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--color-panel);
          color: var(--color-ink-soft);
          font-size: 12px;
          font-weight: 700;
        }

        /* Ukuran disamakan dengan .status-badge (tinggi, teks, kapsul) */
        .btn.orders-cancel-btn {
          padding: 3px 10px;
          font-size: 12px;
          line-height: 1.5;
          border-radius: 999px;
        }

        .orders-modal-btn {
          border-radius: 999px;
        }

        @media (max-width: 860px) {
          /* Card tetap diam setinggi area antara topbar dan bottom nav,
             hanya .orders-card-body yang discroll. */
          .orders-page-fill {
            top: 8px;
            left: var(--shell-gutter-mobile);
            right: var(--shell-gutter-mobile);
            bottom: calc(
              var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 12px
            );
          }

          .orders-card {
            border-radius: 16px;
          }

          .orders-card-header {
            padding: 12px 14px;
          }

          .orders-card-header .page-header {
            margin-bottom: 0;
          }

          .orders-card-header .page-title {
            font-size: 18px;
            margin: 0;
          }

          .orders-card-header .page-subtitle {
            display: none;
          }

          .orders-card-header .alert {
            margin: 8px 0 0;
          }

          .orders-filter {
            margin-top: 10px;
          }

          .orders-filter-date {
            flex: 1 1 100%;
          }

          .orders-filter-btn {
            flex: 1;
          }

          .orders-card-body {
            padding: 16px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          .orders-section + .orders-section {
            margin-top: 22px;
          }

          /* ---------- Table -> stacked cards on mobile ---------- */

          .table-wrap {
            overflow-x: visible;
            margin: 0;
            padding: 0;
            border: none;
            background: transparent;
          }

          .table {
            min-width: 0;
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }

          .table thead {
            display: none;
          }

          .table tbody {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .table tbody tr {
            display: block;
            background: var(--color-surface);
            border: 1.4px solid var(--color-line);
            border-radius: var(--radius-lg);
            padding: 4px 14px;
          }

          .table tbody tr td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid var(--color-line);
            white-space: normal;
            text-align: right;
            font-weight: 600;
          }

          .table tbody tr td:last-child {
            border-bottom: none;
          }

          .table tbody tr td::before {
            content: attr(data-label);
            flex-shrink: 0;
            font-size: 10.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--color-ink-soft);
            opacity: 0.65;
            text-align: left;
          }

          .table tbody tr td.col-index {
            display: none;
          }

          .table tbody tr td.col-date {
            white-space: normal;
          }

          .table tbody tr td.col-action {
            justify-content: flex-end;
          }

          .table tbody tr td.col-action::before {
            display: none;
          }

          .orders-cancel-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}