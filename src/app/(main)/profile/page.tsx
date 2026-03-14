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
import DarkModeToggle from "@/components/DarkModeToggle";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import { useAuth } from "@/hooks/useAuth";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import type { User, WeightLog, ProgressPhoto } from "@/types";
import { ImageIcon } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const { logout, getSession } = useAuth();
    const { fetchWeights, addWeight, deleteWeight } = useWeightLogs();
    const { fetchProgressPhotos, addProgressPhoto, deleteProgressPhoto } = useProgressPhotos();

    const [user, setUser] = useState<User | null>(null);
    const [weights, setWeights] = useState<WeightLog[]>([]);
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [workoutDates, setWorkoutDates] = useState<string[]>([]);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const signOut = async () => {
        await logout();
        router.push("/");
    };

    useEffect(() => {
        const getUser = async () => {
            const userData = await getSession();
            if (userData) setUser({ id: userData.id ?? "", email: userData.email ?? "" });
        };
        getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        if (!user) return;
        try {
            const [weightData, photoData, datesRes] = await Promise.all([
                fetchWeights(),
                fetchProgressPhotos(),
                fetch("/api/workouts/dates"),
            ]);
            setWeights(weightData || []);
            setPhotos(photoData || []);
            if (datesRes.ok) {
                const datesJson = await datesRes.json();
                setWorkoutDates(datesJson.dates ?? []);
            }
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
            await addProgressPhoto({ photo, log_date: logDate, notes: notes || undefined });
            setShowPhotoModal(false);
            await loadData();
        } catch (error) {
            console.error("Error adding photo:", error);
        }
    };

    const handleDeletePhoto = async (id: string) => {
        if (!confirm("Delete this photo?")) return;
        try {
            await deleteProgressPhoto(id);
            await loadData();
        } catch (error) {
            console.error("Error deleting photo:", error);
        }
    };

    const handleDeleteWeight = async (id: string) => {
        if (!confirm("Delete this weight entry?")) return;
        try {
            await deleteWeight(id);
            await loadData();
        } catch (error) {
            console.error("Error deleting weight:", error);
        }
    };

    return (
        <ProtectedWrapper>
            <div className="w-full">
                {/* Page header */}
                <div className="page-header mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Profile</h1>
                        {user && <p className="text-sm text-[var(--muted-foreground)] mt-0.5 truncate max-w-[200px]">{user.email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Dark mode toggle — visible on mobile only (desktop has it in the sidebar) */}
                        <div className="md:hidden">
                            <DarkModeToggle />
                        </div>
                        <Button onClick={signOut} variant="secondary" className="text-sm shrink-0">Sign Out</Button>
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size={8} />
                    </div>
                )}

                {/* Weight Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-[var(--foreground)]">Weight History</h2>
                        <Button onClick={() => setShowWeightModal(true)} variant="primary" className="px-3 py-1.5 text-xs sm:text-sm">+ Log Weight</Button>
                    </div>
                    {/* Borderless card — chart fills full width on mobile */}
                    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 w-full">
                        <WeightHistoryChart weights={weights} loading={loading} onDelete={handleDeleteWeight} />
                    </div>
                </div>

                {/* Workout Calendar */}
                <div className="mb-6">
                    <h2 className="text-base font-bold text-[var(--foreground)] mb-3">Workout Calendar</h2>
                    <WorkoutCalendar workoutDates={workoutDates} />
                </div>

                {/* Progress Photos */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-[var(--foreground)]">Progress Photos</h2>
                        <Button onClick={() => setShowPhotoModal(true)} variant="primary" className="px-3 py-1.5 text-xs sm:text-sm">+ Add Photo</Button>
                    </div>
                    {photos.length === 0 ? (
                        <div className="text-center py-12 bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)]">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)]">No photos yet. Add your first progress photo!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {photos.map((photo) => (
                                <ProgressPhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Account */}
                <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5 mb-8">
                    <h2 className="text-sm font-bold text-[var(--foreground)] mb-3">Account Details</h2>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {user?.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm text-[var(--muted-foreground)] truncate">{user?.email || "Loading..."}</span>
                    </div>
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
