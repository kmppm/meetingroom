import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/layout/AdminLoginForm";

// Halaman login khusus admin: /admin/login
export default async function AdminLoginPage() {
  const session = await getSession();

  // Kalau sudah login sebagai admin, langsung ke dashboard.
  if (session?.role === "admin") {
    redirect("/dashboard");
  }

  return <AdminLoginForm />;
}