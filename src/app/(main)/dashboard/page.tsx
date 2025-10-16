import ProtectedWrapper from "@/components/ProtectedWrapper";

export default function DashboardPage() {
    return (
        <ProtectedWrapper>
            <div className="min-w-full rounded-sm p-6 md:p-8 bg-[var(--surface)] text-[var(--color-foreground)]">
                <div className="text-3xl font-semibold mb-3">Dashboard</div>
                <p>Welcome back! Here you will see a summary of your recent workouts.</p>
                {/* TODO: Add summary stats or charts */}
            </div>
        </ProtectedWrapper>

    );
}
