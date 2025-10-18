"use client";

import { useEffect, useState } from "react";
import supabase from "@/helper/supabaseClient";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [weights, setWeights] = useState<any[]>([]);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);

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

    // Add new weight entry
    const handleAddWeight = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWeight) return;

        const { error } = await supabase.from("weight_logs").insert([
            {
                user_id: user.id,
                log_date: newDate,
                weight: parseFloat(newWeight),
            },
        ]);

        if (error) console.error("Error inserting weight:", error);
        else {
            setNewWeight("");
            setNewDate(new Date().toISOString().split("T")[0]);
            fetchWeights();
        }
    };

    return (
        <ProtectedWrapper>
            <div className="min-w-full p-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="sticky top-0 py-4 bg-white z-10 text-3xl font-semibold">Profile</div>
                    <Button onClick={signOut}>Sign Out</Button>
                </div>

                {/* Weight History Chart */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">My Weight History</h2>
                    {loading ? (
                        <div className="flex justify-center items-center py-8"><LoadingSpinner size={8} /></div>
                    ) : weights.length === 0 ? (
                        <p>No weight logs yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={weights}>
                                <CartesianGrid stroke="#ccc" />
                                <XAxis dataKey="log_date" />
                                <YAxis dataKey="weight" />
                                <Tooltip />
                                <Line type="monotone" dataKey="weight" stroke="#8884d8" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Add Weight Entry Form */}
                <form onSubmit={handleAddWeight} className="space-y-2 max-w-sm">
                    <div>
                        <label className="block mb-1 text-sm">Date</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm">Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <Button type="submit">Add Entry</Button>
                </form>
            </div>
        </ProtectedWrapper>
    );
}
