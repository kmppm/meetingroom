"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { DateNav } from "@/components/ui/DateNav";
import { BookingForm } from "@/components/booking/BookingForm";
import { BookedSchedule } from "@/components/booking/BookedSchedule";
import { DEFAULT_RESOURCE } from "@/lib/resources";
import { todayISO } from "@/lib/time";

export function BookingPageClient({ session }) {
  const { t, locale } = useLanguage();
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Ruangan yang dipilih di form ("" = belum dipilih) dan ruangan yang sedang
  // dilihat di tab "Jadwal yang sudah dipesan". Keduanya terhubung dua arah.
  const [resource, setResource] = useState("");
  const [viewResource, setViewResource] = useState(DEFAULT_RESOURCE);

  // Pilih di dropdown form -> tab jadwal ikut berpindah.
  function handleResourceSelect(code) {
    setResource(code);
    setViewResource(code);
  }

  // Klik tab jadwal -> dropdown form ikut terpilih.
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

          <DateNav date={date} onChange={setDate} t={t} locale={locale} />
        </div>

        <div className="booking-card-body">
          <div className="two-col">
            <BookingForm
              session={session}
              date={date}
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
            padding: 12px 14px;
          }

          .booking-card-header .page-header {
            margin-bottom: 8px;
          }

          .booking-card-header .page-title {
            font-size: 18px;
            margin: 0;
          }

          .booking-card-header .page-subtitle {
            display: none;
          }

          /* Kontrol tanggal: semua kapsul 36px, sama dengan halaman Dashboard */
          .booking-page-fill .booking-card-header .date-nav {
            gap: 8px;
          }

          .booking-page-fill .booking-card-header .date-nav-label {
            display: none;
          }

          .booking-page-fill .booking-card-header .date-nav button,
          .booking-page-fill .booking-card-header .date-nav input {
            height: 36px;
            min-height: 36px;
            padding-top: 0;
            padding-bottom: 0;
            font-size: 13px;
            line-height: 1;
            border-radius: 999px;
          }

          .booking-page-fill .booking-card-header .date-nav button:has(svg) {
            width: 36px;
            min-width: 36px;
            padding: 0;
          }

          .booking-page-fill .booking-card-header .date-nav input {
            padding-left: 12px;
            padding-right: 12px;
          }

          .booking-card-body {
            padding: 12px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          .two-col {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}