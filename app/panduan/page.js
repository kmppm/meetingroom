import { GuideClient } from "@/components/guide/GuideClient";

// Halaman panduan berdiri sendiri: tidak ada di menu dan tidak ditautkan dari halaman mana pun.
// "noindex" supaya tidak muncul di hasil pencarian Google; hanya orang yang tahu link-nya yang bisa buka.
export const metadata = {
  title: "Panduan Pemesanan Ruangan dan Meja Meeting",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PanduanBookingPage() {
  return <GuideClient />;
}