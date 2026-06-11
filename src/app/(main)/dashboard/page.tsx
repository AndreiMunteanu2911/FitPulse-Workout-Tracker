import ProtectedWrapper from "@/components/ProtectedWrapper";
import DashboardStats from "@/components/DashboardStats";
import DashboardShortcuts from "@/components/DashboardShortcuts";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <ProtectedWrapper>
      <div className="page-stack">
        <PageHeader
          title="Dashboard"
          description="Your training activity, progress, and shortcuts in one place."
        />

        <DashboardStats />
        <DashboardShortcuts />
      </div>
    </ProtectedWrapper>
  );
}
