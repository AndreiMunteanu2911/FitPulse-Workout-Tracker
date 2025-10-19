"use client";

import { useEffect, useState } from "react";
import supabase from "@/helper/supabaseClient";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WeightHistoryChart from "@/components/WeightHistoryChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import AddWeightModal from "@/components/AddWeightModal";

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [weights, setWeights] = useState<any[]>([]);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Sign out function
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.push("/");
    };

    // Fetch current user
    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (error) console.error("Error fetching user:", error);
            else setUser(data.user);
        };
        getUser();
    }, []);

    // Fetch weights
    useEffect(() => {
        if (user) fetchWeights();
    }, [user]);

    const fetchWeights = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("weight_logs")
            .select("id, log_date, weight")
            .eq("user_id", user.id)
            .order("log_date", { ascending: true });

        if (error) console.error("Error fetching weights:", error);
        else setWeights(data);
        setLoading(false);
    };

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
                        if (!weight || !date) return;
                        const { error } = await supabase.from("weight_logs").insert([
                            {
                                user_id: user.id,
                                log_date: date,
                                weight: parseFloat(weight),
                            },
                        ]);
                        if (!error) {
                            setNewWeight("");
                            setNewDate(new Date().toISOString().split("T")[0]);
                            fetchWeights();
                            setShowModal(false);
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