"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WeightHistoryChart from "@/components/WeightHistoryChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import AddWeightModal from "@/components/AddWeightModal";
import ProgressPhotoCard from "@/components/ProgressPhotoCard";
import AddPhotoModal from "@/components/AddPhotoModal";
import { useAuth } from "@/hooks/useAuth";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";

interface User {
    id: string;
    email: string;
}
interface WeightLog {
    id: string;
    log_date: string;
    weight: number;
}
interface ProgressPhoto {
    id: string;
    user_id: string;
    photo_url: string;
    log_date: string;
    notes?: string;
    created_at: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { logout, getSession } = useAuth();
    const { fetchWeights, addWeight } = useWeightLogs();
    const { fetchProgressPhotos, addProgressPhoto, deleteProgressPhoto } = useProgressPhotos();

    const [user, setUser] = useState<User | null>(null);
    const [weights, setWeights] = useState<WeightLog[]>([]);
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

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

    // Fetch weights and photos
    const loadData = useCallback(async () => {
        setLoading(true);
        if (!user) return;
        try {
            const [weightData, photoData] = await Promise.all([
                fetchWeights(),
                fetchProgressPhotos(),
            ]);
            setWeights(weightData || []);
            setPhotos(photoData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const handleAddPhoto = async (photo: File, logDate: string, notes: string) => {
        try {
            await addProgressPhoto({
                photo,
                log_date: logDate,
                notes: notes || undefined,
            });
            setShowPhotoModal(false);
            await loadData();
        } catch (error) {
            console.error("Error adding photo:", error);
        }
    };

    const handleDeletePhoto = async (id: string) => {
        if (!confirm("Are you sure you want to delete this photo?")) return;
        try {
            await deleteProgressPhoto(id);
            await loadData();
        } catch (error) {
            console.error("Error deleting photo:", error);
        }
    };

    return (
        <ProtectedWrapper>
            <div className="w-full p-4 md:p-8 mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="sticky top-0 py-4 z-10 text-2xl sm:text-3xl font-semibold text-[var(--foreground)] bg-[var(--surface)]">Profile</div>
                    <Button onClick={signOut} className="px-5 py-2.5 text-sm sm:text-base">Sign Out</Button>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size={8} />
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">My Weight History</div>
                        <Button onClick={() => setShowWeightModal(true)} variant="primary" className="px-3 py-1.5 text-sm sm:text-base">+ New Entry</Button>
                    </div>
                    <div className="w-full aspect-video sm:aspect-[16/9] lg:aspect-[3/1] bg-[var(--surface)] rounded-lg p-3 sm:p-4">
                        <WeightHistoryChart weights={weights} loading={loading} />
                    </div>
                </div>

                <div className="py-4 mt-6 border-t border-[var(--border)]">
                    <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">Account Details</h2>
                    <p className="text-[var(--muted-foreground)]">Email: {user?.email || "Loading..."}</p>
                </div>

                <div className="py-4 mt-6 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">Progress Photos</h2>
                        <Button onClick={() => setShowPhotoModal(true)} variant="primary" className="px-3 py-1.5 text-sm sm:text-base">+ Add Photo</Button>
                    </div>
                    {photos.length === 0 ? (
                        <div className="text-center text-[var(--muted-foreground)] py-8 bg-[var(--surface)] rounded-lg">
                            No progress photos yet. Add your first photo to track your visual progress!
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {photos.map((photo) => (
                                <ProgressPhotoCard
                                    key={photo.id}
                                    photo={photo}
                                    onDelete={handleDeletePhoto}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <AddWeightModal
                    show={showWeightModal}
                    onClose={() => setShowWeightModal(false)}
                    onSubmit={async (date, weight) => {
                        if (!weight || !date || !user) return;
                        try {
                            await addWeight(date, weight);
                            setNewWeight("");
                            setNewDate(new Date().toISOString().split("T")[0]);
                            await loadData();
                            setShowWeightModal(false);
                        } catch (error) {
                            console.error("Error adding weight:", error);
                        }
                    }}
                    initialDate={newDate}
                    initialWeight={newWeight}
                    setDate={setNewDate}
                    setWeight={setNewWeight}
                />

                <AddPhotoModal
                    isOpen={showPhotoModal}
                    onClose={() => setShowPhotoModal(false)}
                    onAdd={handleAddPhoto}
                />
            </div>
        </ProtectedWrapper>
    );
}