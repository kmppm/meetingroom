"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { DateNav } from "@/components/ui/DateNav";
import { BookingForm } from "@/components/booking/BookingForm";
import { BookedSchedule } from "@/components/booking/BookedSchedule";
import { RESOURCES, DEFAULT_RESOURCE } from "@/lib/resources";
import { todayISO } from "@/lib/time";

// Nama pendek khusus tampilan mobile, mis. "Ruangan Meeting Sadiman" -> "Ruangan Sadiman"
function shortResourceName(name) {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : name;
}

export function BookingPageClient({ session }) {
  const { t, locale } = useLanguage();
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Ruangan yang dipilih di form ("" = belum dipilih) dan ruangan yang sedang
  // dilihat di tab "Jadwal yang sudah dipesan". Keduanya terhubung dua arah.
  const [resource, setResource] = useState("");
  const [viewResource, setViewResource] = useState(DEFAULT_RESOURCE);

  // Mobile: dropdown ruangan di form disembunyikan (diganti segmented control
  // di header), jadi ruangan default langsung dipilih supaya form siap dipakai.
  useEffect(() => {
    if (window.matchMedia("(max-width: 860px)").matches) {
      setResource((r) => r || DEFAULT_RESOURCE);
    }
  }, []);

  // Pilih di dropdown form -> tab jadwal ikut berpindah.
  function handleResourceSelect(code) {
    setResource(code);
    setViewResource(code);
  }

  // Klik tab jadwal / segmented control -> dropdown form ikut terpilih.
  function handleTabClick(code) {
    setViewResource(code);
    if (code !== resource) setResource(code);
  }

  // Daftar ketersediaan menampilkan SEMUA booking di tanggal itu (Sadiman + Heksagon),
  // jadi tidak difilter per resource. Tiap section memfilter sendiri.
  async function loadBookings(forDate) {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/bookings?date=${forDate}`);
      const data = await res.json();
      setBookings(res.ok ? data.bookings : []);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadBookings(date);
  }, [date]);

  return (
    <div className="booking-page-fill">
      <div className="booking-card">
        <div className="booking-card-header">
          <div className="page-header">
            <h1 className="page-title">{t.booking.title}</h1>
            <p className="page-subtitle">{t.booking.subtitle}</p>
          </div>

          {/* Hanya tampil di mobile */}
          <div className="booking-seg" role="tablist" aria-label={t.booking.title}>
            {Object.values(RESOURCES).map((r) => (
              <button
                key={r.code}
                type="button"
                role="tab"
                aria-selected={resource === r.code}
                aria-label={r.name}
                className={`booking-seg-btn${resource === r.code ? " is-active" : ""}`}
                onClick={() => handleTabClick(r.code)}
              >
                {shortResourceName(r.name)}
              </button>
            ))}
          </div>

          <DateNav
            date={date}
            onChange={setDate}
            t={t}
            locale={locale}
            mobileCompact
          />
        </div>

        <div className="booking-card-body">
          <div className="two-col">
            <BookingForm
              session={session}
              date={date}
              onDateChange={setDate}
              bookings={bookings}
              resource={resource}
              onResourceChange={handleResourceSelect}
              onBooked={() => loadBookings(date)}
            />

            <BookedSchedule
              bookings={bookings}
              loading={loadingList}
              viewResource={viewResource}
              onTabChange={handleTabClick}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .booking-page-fill {
          position: absolute;
          top: 0;
          left: 0;
          right: 24px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
        }

        .booking-card {
          background: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .booking-card-header {
          flex-shrink: 0;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-line);
        }

        .booking-card-header .date-nav {
          margin-bottom: 0;
        }

        .booking-card-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        /* Segmented control ruangan: khusus mobile */
        .booking-seg {
          display: none;
        }

        @media (max-width: 860px) {
          /* Card tetap diam setinggi area antara topbar dan bottom nav,
             hanya .booking-card-body yang discroll. */
          .booking-page-fill {
            top: 8px;
            left: var(--shell-gutter-mobile);
            right: var(--shell-gutter-mobile);
            bottom: calc(
              var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 12px
            );
          }

          .booking-card {
            border-radius: 16px;
          }

          .booking-card-header {
            padding: 12px;
          }

          /* Judul disembunyikan secara visual (bottom nav sudah menandai
             halaman aktif), tetap ada untuk screen reader. */
          .booking-card-header .page-header {
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

          /* ---------- Segmented control ruangan ---------- */
          .booking-seg {
            display: flex;
            gap: 2px;
            padding: 3px;
            margin-bottom: 10px;
            background: var(--color-panel);
            border: 1px solid var(--color-line);
            border-radius: 999px;
          }

          .booking-seg-btn {
            flex: 1 1 0;
            min-width: 0;
            height: 36px;
            padding: 0 8px;
            border: none;
            border-radius: 999px;
            background: transparent;
            color: var(--color-ink-soft);
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            line-height: 1;
            white-space: nowrap;
            cursor: pointer;
          }

          .booking-seg-btn.is-active {
            background: var(--color-ink);
            color: #fff;
          }

          /* Kontrol tanggal: satu baris penuh (diatur di DateNav) */
          .booking-card-header .date-nav {
            width: 100%;
          }

          .booking-card-body {
            padding: 14px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          .two-col {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}