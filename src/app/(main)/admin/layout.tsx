import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/auth-session";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await loadSessionUser();

  if (!user) {
    redirect("/login");
  }
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return children;
}
