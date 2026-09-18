import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }) {
  const session = await getSession();

  return <AppShell session={session}>{children}</AppShell>;
}