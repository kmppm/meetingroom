import { getSession } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  return <DashboardClient session={session} />;
}
