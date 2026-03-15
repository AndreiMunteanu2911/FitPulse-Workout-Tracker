import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "@/components/DashboardStats";

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
      <div className="w-full">
        <div className="page-header mb-6">
          <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Your fitness overview</p>
        </div>
        <DashboardStats />
      </div>
    </ProtectedWrapper>
  );
}
