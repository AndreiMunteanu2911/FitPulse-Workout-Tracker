import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "./DashboardStats";

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
        <div className="w-full">
            <div className="sticky top-0 py-4 z-10 text-2xl sm:text-3xl font-semibold text-[var(--foreground)] mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6 bg-[var(--surface)]"> Dashboard
        </div>
        <DashboardStats />
      </div>
    </ProtectedWrapper>
  );
}
