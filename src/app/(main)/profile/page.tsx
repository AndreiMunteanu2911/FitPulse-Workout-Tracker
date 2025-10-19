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
            <div className="min-w-full p-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="sticky top-0 py-4 bg-white z-10 text-3xl font-semibold">Profile</div>
                    <Button onClick={signOut} className="px-7.5">Sign Out</Button>
                </div>

                {/* Weight History Chart */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold">My Weight History</h2>
                        <Button onClick={() => setShowModal(true)} variant="primary">+ New Entry</Button>
                    </div>
                    <WeightHistoryChart weights={weights} loading={loading} />
                </div>

                {/* Modal for Add Weight Entry */}
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
