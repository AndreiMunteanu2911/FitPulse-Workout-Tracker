import ProtectedWrapper from "@/components/ProtectedWrapper";

export default function DashboardPage() {
    return (
        <ProtectedWrapper>
            <div className="w-full rounded-sm p-4 md:p-8 bg-[var(--surface)] text-[var(--color-foreground)]">
                <div className="sticky top-0 py-4 z-10 text-2xl md:text-3xl font-semibold mb-3 bg-[var(--surface)]">Dashboard</div>
                <p>TODO: Add things here</p>
            </div>
        </ProtectedWrapper>
    );
}