"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { getUnitMeta } from "@/lib/units";
import { getResourceMeta } from "@/lib/resources";
import { formatDateLong, todayISO } from "@/lib/time";

function isPastBooking(booking) {
  const today = todayISO();
  if (booking.date < today) return true;
  if (booking.date > today) return false;
  const now = new Date();
  return booking.endMinutes <= now.getHours() * 60 + now.getMinutes();
}

export function OrdersClient({ session }) {
  const { t, locale } = useLanguage();
  const isAdmin = session.role === "admin";
  const resourceLabel = locale === "en" ? "Room / Table" : "Ruangan / Meja";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          {message ? <div className="alert alert-success">{message}</div> : null}
        </div>

        <div className="orders-card-body">
          {loading ? (
            <div className="empty-state">{t.common.loading}</div>
          ) : bookings.length === 0 ? (
            <div className="card">
              <div className="empty-state">{t.common.noBookings}</div>
            </div>
          ) : (
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
                  {bookings.map((b, index) => {
                    const past = isPastBooking(b);
                    const meta = getUnitMeta(b.unit);
                    const resourceMeta = getResourceMeta(b.resource);
                    const canCancel = isAdmin || b.unit === session.unit;
                    return (
                      <tr key={b.id}>
                        <td className="col-index">
                          <span className="order-no-badge">{index + 1}</span>
                        </td>
                        <td data-label={t.common.date}>{formatDateLong(b.date, locale)}</td>
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
                          {past ? t.common.past : t.common.upcoming}
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

        .orders-cancel-btn {
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

          .orders-card-body {
            padding: 16px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
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