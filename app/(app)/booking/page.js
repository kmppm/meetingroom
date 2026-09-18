import { getSession } from "@/lib/auth";
import { BookingPageClient } from "@/components/booking/BookingPageClient";

export default async function BookingPage() {
  const session = await getSession();
  return <BookingPageClient session={session} />;
}
