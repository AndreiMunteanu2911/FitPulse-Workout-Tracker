"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WeightHistoryChart from "@/components/WeightHistoryChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import AddWeightModal from "@/components/AddWeightModal";
import { useAuth } from "@/hooks/useAuth";
import { useWeightLogs } from "@/hooks/useWeightLogs";

interface User {
    id: string;
    email: string;
}
interface WeightLog {
    id: string;
    log_date: string;
    weight: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { logout, getSession } = useAuth();
    const { fetchWeights, addWeight } = useWeightLogs();

    const [user, setUser] = useState<User | null>(null);
    const [weights, setWeights] = useState<WeightLog[]>([]);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Sign out function
    const signOut = async () => {
        await logout();
        router.push("/");
    };

    // Fetch current user
    useEffect(() => {
        const getUser = async () => {
            const userData = await getSession();
            if (userData) setUser({ id: userData.id ?? "", email: userData.email ?? "" });
        };
        getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch weights
    const loadWeights = useCallback(async () => {
        setLoading(true);
        if (!user) return;
        try {
            const data = await fetchWeights();
            setWeights(data || []);
        } catch (error) {
            console.error("Error fetching weights:", error);
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (user) loadWeights();
    }, [user, loadWeights]);

    return (
        <ProtectedWrapper>
            <div className="w-full p-4 md:p-8 mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="sticky top-0 py-4 bg-white/95 backdrop-blur-sm z-10 text-2xl sm:text-3xl font-semibold">Profile</div>
                    <Button onClick={signOut} className="px-5 py-2.5 text-sm sm:text-base">Sign Out</Button>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size={8} />
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-lg sm:text-xl font-semibold">My Weight History</div>
                        <Button onClick={() => setShowModal(true)} variant="primary" className="px-3 py-1.5 text-sm sm:text-base">+ New Entry</Button>
                    </div>
                    <div className="w-full aspect-video sm:aspect-[16/9] lg:aspect-[3/1] bg-white rounded-lg p-3 sm:p-4">
                        <WeightHistoryChart weights={weights} loading={loading} />
                    </div>
                </div>

                <div className="py-4 mt-6 border-t border-gray-200">
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Account Details</h2>
                    <p className="text-gray-600">Email: {user?.email || "Loading..."}</p>
                </div>

                <AddWeightModal
                    show={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={async (date, weight) => {
                        if (!weight || !date || !user) return;
                        try {
                            await addWeight(date, weight);
                            setNewWeight("");
                            setNewDate(new Date().toISOString().split("T")[0]);
                            loadWeights();
                            setShowModal(false);
                        } catch (error) {
                            console.error("Error adding weight:", error);
                        }
                    }}
                    initialDate={newDate}
                    initialWeight={newWeight}
                    setDate={setNewDate}
                    setWeight={setNewWeight}
                />
            </div>
        </ProtectedWrapper>
    );
}