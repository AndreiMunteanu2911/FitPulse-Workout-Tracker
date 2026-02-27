import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "./DashboardStats";

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
      <div className="w-full p-4 md:p-8 mx-auto max-w-6xl">
        <div className="sticky top-0 py-4 z-10 text-2xl md:text-3xl font-semibold mb-6 text-[var(--foreground)] bg-[var(--surface)]">
          Dashboard
        </div>
        <DashboardStats />
      </div>
    </ProtectedWrapper>
  );
}
