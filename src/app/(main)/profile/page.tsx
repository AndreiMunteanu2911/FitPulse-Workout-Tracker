"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/Button";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import WeightHistoryChart from "@/components/WeightHistoryChart";
import AddWeightModal from "@/components/AddWeightModal";
import ProgressPhotoCard from "@/components/ProgressPhotoCard";
import AddPhotoModal from "@/components/AddPhotoModal";
import ToggleSwitch from "@/components/ToggleSwitch";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import NumberPicker from "@/components/NumberPicker";
import DatePicker from "@/components/DatePicker";
import ModalWrapper from "@/components/ModalWrapper";
import { useAuthSession } from "@/components/AuthSessionProvider";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import type { User, WeightLog, ProgressPhoto } from "@/types";
import {
  Scale,
  Calendar as CalendarIcon,
  Camera,
  LogOut,
  ImageIcon,
  Moon,
  Sun,
  Pencil,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import UserAvatar from "@/components/UserAvatar";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "N/A";
  }
}

function calcAge(birthday: string | null): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialGender: "male" | "female" | "other" | null;
  initialBirthday: string | null;
  initialHeight: number | null;
  onSave: (data: {
    display_name: string;
    gender: "male" | "female" | "other" | null;
    birthday: string | null;
    height_cm: number | null;
  }) => Promise<boolean>;
}

function EditProfileModal({
  isOpen,
  onClose,
  initialName,
  initialGender,
  initialBirthday,
  initialHeight,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(initialGender);
  const [height, setHeight] = useState(initialHeight ?? 170);
  const [saving, setSaving] = useState(false);
  const [birthday, setBirthday] = useState(initialBirthday ?? "");

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setGender(initialGender);
      setHeight(initialHeight ?? 170);
      setBirthday(initialBirthday ?? "");
    }
  }, [isOpen, initialName, initialGender, initialHeight, initialBirthday]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const success = await onSave({
      display_name: name.trim(),
      gender,
      birthday: birthday || null,
      height_cm: height,
    });
    setSaving(false);
    if (success) onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-md max-h-[90vh] overflow-y-auto p-0">
      <div className="relative overflow-hidden border-b border-[var(--border)] p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)]" />
        <p className="eyebrow">Account details</p>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Edit profile</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Keep your training profile accurate.</p>
      </div>
      <button
        type="button"
        aria-label="Close edit profile"
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        onClick={onClose}
      >
        <X className="size-4" />
      </button>

      <div className="space-y-5 p-6">
        <div>
          <label className="eyebrow block">Display name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="eyebrow block">Gender</label>
          <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-1">
            {(["male", "female", "other"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`min-h-10 rounded-[var(--radius-md)] text-sm font-semibold capitalize transition-colors ${
                  gender === g
                    ? "bg-[var(--surface)] text-[var(--primary-600)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="eyebrow block">Birthday</label>
          <DatePicker
            value={birthday}
            onChange={setBirthday}
            placeholder="Select your birthday"
          />
        </div>

        <div>
          <label className="eyebrow block">
            Height (cm) — {height} cm
          </label>
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-2">
            <NumberPicker value={height} onChange={setHeight} min={120} max={220} height={160} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button onClick={onClose} variant="secondary" block disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} block>
            {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : <><Save className="size-4" />Save</>}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter();
    const { logout } = useAuth();
    const { profile, fetchProfile, updateProfile } = useUserProfile();
    const { fetchWeights, addWeight, deleteWeight } = useWeightLogs();
    const { fetchProgressPhotos, addProgressPhoto, deleteProgressPhoto } = useProgressPhotos();
    const { user: sessionUser, refreshSession } = useAuthSession();

    const [user, setUser] = useState<User | null>(null);
    const [weights, setWeights] = useState<WeightLog[]>([]);
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [workoutDates, setWorkoutDates] = useState<string[]>([]);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<{ type: "weight" | "photo"; id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const signOut = async () => {
        await logout();
        router.push("/");
    };

    useEffect(() => {
        setDarkMode(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setDarkMode(!darkMode);
    };

    useEffect(() => {
        setUser(sessionUser ?? null);
    }, [sessionUser]);

    useEffect(() => {
        if (sessionUser) {
            void fetchProfile();
        }
    }, [sessionUser, fetchProfile]);

    const loadData = useCallback(async () => {
        setLoading(true);
        if (!user) {
            setLoading(false);
            return;
        }
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
        const tempId = crypto.randomUUID();
        const localUrl = URL.createObjectURL(photo);
        const newPhoto = { id: tempId, photo_url: localUrl, log_date: logDate, notes: notes || undefined, created_at: new Date().toISOString() } as ProgressPhoto;
        setPhotos((prev) => [newPhoto, ...prev]);
        setShowPhotoModal(false);
        try {
            await addProgressPhoto({ photo, log_date: logDate, notes: notes || undefined });
            URL.revokeObjectURL(localUrl);
        } catch (error) {
            console.error("Error adding photo:", error);
            setPhotos((prev) => prev.filter((p) => p.id !== tempId));
        }
    };

    const handleDeletePhoto = (id: string) => {
        const photo = photos.find((p) => p.id === id);
        setDeleteTarget({ type: "photo", id, name: `photo from ${photo?.log_date || "unknown date"}` });
    };

    const handleDeleteWeight = (id: string) => {
        const log = weights.find((w) => w.id === id);
        const dateStr = log?.log_date ? new Date(log.log_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "unknown date";
        setDeleteTarget({ type: "weight", id, name: `${log?.weight || 0} kg — ${dateStr}` });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        const target = deleteTarget;
        if (target.type === "photo") {
            setPhotos((prev) => prev.filter((p) => p.id !== target.id));
        } else {
            setWeights((prev) => prev.filter((w) => w.id !== target.id));
        }
        try {
            if (target.type === "photo") {
                await deleteProgressPhoto(target.id);
            } else {
                await deleteWeight(target.id);
            }
        } catch (error) {
            console.error(`Error deleting ${target.type}:`, error);
            if (target.type === "photo") {
                const photo = photos.find((p) => p.id === target.id);
                if (photo) setPhotos((prev) => [photo, ...prev]);
            } else {
                const log = weights.find((w) => w.id !== target.id);
                if (log) setWeights((prev) => [...prev, log]);
            }
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
    const displayEmail = user?.email ?? "";
    const age = calcAge(profile?.birthday ?? null);
    // Latest weight from weight_logs
    const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="flex min-h-[18rem] w-full items-center justify-center">
                    <LoadingSpinner />
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="page-stack">
                <PageHeader
                    title="Profile"
                    description="Manage your personal details and review your progress."
                />

                {/* ── User Info Card — purple gradient ── */}
                <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-700)] via-[var(--primary-600)] to-[var(--primary-400)] p-5 text-white shadow-[0_18px_42px_rgba(116,87,245,0.26)] sm:p-7">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="absolute right-4 top-4 z-10 inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                        title="Edit profile"
                    >
                        <Pencil className="size-3.5" />
                        Edit
                    </button>

                    <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
                        <UserAvatar name={displayName} size="xl" className="mb-3 ring-4 ring-white/15 shadow-none sm:mb-0 sm:mr-5" />
                        <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Training profile</p>
                        <p className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-white">{displayName}</p>
                        <p className="text-sm text-white/65">{displayEmail}</p>
                        {profile?.birthday && (
                            <p className="text-xs text-white/40 mt-0.5">Birthday: {formatDate(profile.birthday)}</p>
                        )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/15 pt-5">
                        <div className="rounded-[var(--radius-lg)] bg-white/10 p-3 text-center">
                            <p className="text-sm font-bold text-white">{latestWeight ?? "—"} <span className="text-xs font-normal text-white/60">kg</span></p>
                            <p className="text-xs text-white/50">Weight</p>
                        </div>
                        <div className="rounded-[var(--radius-lg)] bg-white/10 p-3 text-center">
                            <p className="text-sm font-bold text-white">{age ?? "—"} <span className="text-xs font-normal text-white/60">yrs</span></p>
                            <p className="text-xs text-white/50">Age</p>
                        </div>
                        <div className="rounded-[var(--radius-lg)] bg-white/10 p-3 text-center">
                            <p className="text-sm font-bold text-white">{profile?.height_cm ?? "—"} <span className="text-xs font-normal text-white/60">cm</span></p>
                            <p className="text-xs text-white/50">Height</p>
                        </div>
                    </div>
                </div>

                {/* ── Settings Sections ── */}
                <div className="grid gap-5 xl:grid-cols-2">
                    {/* Dark Mode */}
                    <div className="card p-5 xl:col-span-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-tile !size-10">
                                    {darkMode ? <Sun className="w-4 h-4 text-[var(--primary-600)]" /> : <Moon className="w-4 h-4 text-[var(--primary-600)]" />}
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--foreground)]">Appearance</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{darkMode ? "Dark theme is active" : "Light theme is active"}</p>
                                </div>
                            </div>
                            <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} size="sm" />
                        </div>
                    </div>

                    {/* Weight History */}
                    <div className="card xl:col-span-2">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="icon-tile !size-10">
                                    <Scale className="w-4 h-4 text-[var(--primary-600)]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[var(--foreground)]">Weight history</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{weights.length} entries</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowWeightModal(true)} variant="primary" className="px-4 py-2 text-xs sm:px-4 sm:py-2 sm:text-xs">Log weight</Button>
                        </div>
                        <div className="px-5 pb-5 pt-1">
                            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3 sm:p-4">
                                <WeightHistoryChart weights={weights} loading={false} onDelete={handleDeleteWeight} />
                            </div>
                        </div>
                    </div>

                    {/* Workout Calendar */}
                    <div className="card">
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="icon-tile !size-10">
                                    <CalendarIcon className="w-4 h-4 text-[var(--primary-600)]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--foreground)]">Workout calendar</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{workoutDates.length} days active</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 pb-5 pt-1">
                            <WorkoutCalendar workoutDates={workoutDates} />
                        </div>
                    </div>

                    {/* Progress Photos */}
                    <div className="card">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="icon-tile !size-10">
                                    <Camera className="w-4 h-4 text-[var(--primary-600)]" />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--foreground)]">Progress photos</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{photos.length} photos</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowPhotoModal(true)} variant="primary" className="px-4 py-2 text-xs sm:px-4 sm:py-2 sm:text-xs">Add photo</Button>
                        </div>
                        <AnimatePresence mode="popLayout" initial={false}>
                        {photos.length === 0 ? (
                            <motion.div
                                key="empty"
                                className="px-5 pb-7 pt-3 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.14 }}
                            >
                                <div className="icon-tile mx-auto mb-2 !size-10">
                                    <ImageIcon className="w-5 h-5 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                                </div>
                                <p className="text-sm font-semibold text-[var(--foreground)]">No progress photos yet</p>
                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Add your first photo to compare changes over time.</p>
                            </motion.div>
                        ) : (
                            <motion.div key="photos" layout className="px-5 pb-5 pt-1">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    <AnimatePresence initial={false} mode="popLayout">
                                    {photos.map((photo) => (
                                        <motion.div
                                            layout
                                            key={photo.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.96 }}
                                            transition={{ duration: 0.16, ease: "easeOut" }}
                                        >
                                            <ProgressPhotoCard photo={photo} onDelete={handleDeletePhoto} />
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    {/* Sign Out */}
                    <div className="xl:col-span-2">
                        <Button onClick={signOut} variant="secondary" block>
                            <LogOut className="size-4" />
                            Sign out
                        </Button>
                    </div>
                </div>

                {/* ── Modals ── */}
                <AddWeightModal
                    show={showWeightModal}
                    onClose={() => setShowWeightModal(false)}
                    onSubmit={async (date, weight) => {
                        if (!weight || !date || !user) return;
                        setShowWeightModal(false);
                        const tempId = crypto.randomUUID();
                        const newLog = { id: tempId, log_date: date, weight: parseFloat(weight) } as WeightLog;
                        setWeights((prev) => [...prev, newLog].sort((a, b) => a.log_date.localeCompare(b.log_date)));
                        setNewWeight("");
                        setNewDate(new Date().toISOString().split("T")[0]);
                        try {
                            await addWeight(date, weight);
                        } catch (error) {
                            console.error("Error adding weight:", error);
                            setWeights((prev) => prev.filter((w) => w.id !== tempId));
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

                <EditProfileModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    initialName={profile?.display_name ?? user?.email?.split("@")[0] ?? ""}
                    initialGender={profile?.gender ?? null}
                    initialBirthday={profile?.birthday ?? null}
                    initialHeight={profile?.height_cm ?? null}
                    onSave={async (data) => {
                        const ok = await updateProfile(data);
                        if (ok) {
                            const nextUser = await refreshSession();
                            if (nextUser) setUser(nextUser);
                        }
                        return ok;
                    }}
                />

                <ConfirmDeleteModal
                    isOpen={deleteTarget !== null}
                    onClose={() => setDeleteTarget(null)}
                    title={`Delete ${deleteTarget?.type === "weight" ? "Weight Entry" : "Photo"}`}
                    itemName={deleteTarget?.name ?? ""}
                    onConfirm={confirmDelete}
                    loading={deleteLoading}
                />
            </div>
        </ProtectedWrapper>
    );
}
