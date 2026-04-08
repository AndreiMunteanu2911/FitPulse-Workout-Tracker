"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/Button";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import { useRouter } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import WeightHistoryChart from "@/components/WeightHistoryChart";
import AddWeightModal from "@/components/AddWeightModal";
import ProgressPhotoCard from "@/components/ProgressPhotoCard";
import AddPhotoModal from "@/components/AddPhotoModal";
import ToggleSwitch from "@/components/ToggleSwitch";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import NumberPicker from "@/components/NumberPicker";
import ModalWrapper from "@/components/ModalWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import type { User, WeightLog, ProgressPhoto } from "@/types";
import {
  User as UserIcon,
  Scale,
  Calendar as CalendarIcon,
  Camera,
  LogOut,
  ChevronRight,
  ImageIcon,
  Moon,
  Sun,
  Zap,
  Ruler,
  Pencil,
  X,
  Save,
  Loader2,
  Heart,
} from "lucide-react";

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

function bmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm === 0) return null;
  const hm = heightCm / 100;
  return Math.round((weightKg / (hm * hm)) * 10) / 10;
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
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-md p-6 max-h-[90vh] overflow-y-auto">
      <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
      <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Edit Profile</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Full Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Gender</label>
          <div className="flex gap-2">
            {(["male", "female", "other"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  gender === g
                    ? "bg-[var(--primary-500)] text-white"
                    : "bg-[var(--surface-raised)] text-[var(--muted-foreground)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Birthday</label>
          <input
            className="input"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Height (cm) — {height} cm
          </label>
          <div className="bg-[var(--surface-raised)] rounded-lg p-2">
            <NumberPicker value={height} onChange={setHeight} min={120} max={220} height={160} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !name.trim()} block>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save</>}
        </Button>
      </div>
    </ModalWrapper>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const router = useRouter();
    const { logout, getSession } = useAuth();
    const { profile, fetchProfile, updateProfile } = useUserProfile();
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
        const getUser = async () => {
            const userData = await getSession();
            if (userData) setUser({ id: userData.id ?? "", email: userData.email ?? "", ...userData });
            await fetchProfile();
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
    const bmiValue = bmi(latestWeight, profile?.height_cm ?? null);
    const userInitial = displayName[0]?.toUpperCase() ?? "?";

    if (loading) {
        return (
            <ProtectedWrapper>
                <div className="w-full">
                    <div className="page-header mb-5">
                        <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>Profile</h1>
                    </div>
                    <div className="bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-400)] rounded-[var(--radius-lg)] p-5 mb-5 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white/20" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-40 bg-white/20 rounded-[var(--radius-sm)]" />
                                <div className="h-3 w-16 bg-white/20 rounded-[var(--radius-sm)]" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)]" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3.5 w-28 bg-[var(--surface-raised)] rounded-[var(--radius-sm)]" />
                                        <div className="h-2.5 w-16 bg-[var(--surface-raised)] rounded-[var(--radius-sm)]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ProtectedWrapper>
        );
    }

    return (
        <ProtectedWrapper>
            <div className="w-full">
                {/* Page header */}
                <div className="page-header mb-5">
                    <h1 className="hidden md:block text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>My Profile</h1>
                </div>

                {/* ── User Info Card — purple gradient ── */}
                <div className="bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-400)] rounded-[var(--radius-lg)] p-5 mb-5 relative">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        title="Edit profile"
                    >
                        <Pencil className="w-4 h-4 text-white" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-extrabold mb-3 overflow-hidden">
                            {userInitial}
                        </div>
                        <p className="text-lg font-bold text-white">{displayName}</p>
                        <p className="text-xs text-white/60">{displayEmail}</p>
                        {profile?.birthday && (
                            <p className="text-xs text-white/40 mt-0.5">Birthday: {formatDate(profile.birthday)}</p>
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                        <div className="text-center">
                            <p className="text-sm font-bold text-white">{latestWeight ?? "—"} <span className="text-xs font-normal text-white/60">kg</span></p>
                            <p className="text-xs text-white/50">Weight</p>
                        </div>
                        <div className="text-center border-x border-white/20">
                            <p className="text-sm font-bold text-white">{age ?? "—"} <span className="text-xs font-normal text-white/60">yrs</span></p>
                            <p className="text-xs text-white/50">Age</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-white">{profile?.height_cm ?? "—"} <span className="text-xs font-normal text-white/60">cm</span></p>
                            <p className="text-xs text-white/50">Height</p>
                        </div>
                    </div>
                </div>

                {/* ── Settings Sections ── */}
                <div className="space-y-5">
                    {/* Dark Mode */}
                    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                    {darkMode ? <Sun className="w-4 h-4 text-[var(--primary-600)]" /> : <Moon className="w-4 h-4 text-[var(--primary-600)]" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--foreground)]">{darkMode ? "Light Mode" : "Dark Mode"}</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">Toggle app appearance</p>
                                </div>
                            </div>
                            <ToggleSwitch checked={darkMode} onChange={toggleDarkMode} size="sm" />
                        </div>
                    </div>

                    {/* Weight History */}
                    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                    <Scale className="w-4 h-4 text-[var(--primary-600)]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-[var(--foreground)]">Weight History</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{weights.length} entries</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowWeightModal(true)} variant="primary" className="px-3 py-1.5 text-xs">+ Log</Button>
                        </div>
                        <div className="px-5 pb-5 pt-1">
                            <div className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-3">
                                <WeightHistoryChart weights={weights} loading={false} onDelete={handleDeleteWeight} />
                            </div>
                        </div>
                    </div>

                    {/* Workout Calendar */}
                    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden">
                        <div className="px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                    <CalendarIcon className="w-4 h-4 text-[var(--primary-600)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--foreground)]">Workout Calendar</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{workoutDates.length} days active</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 pb-5 pt-1">
                            <WorkoutCalendar workoutDates={workoutDates} />
                        </div>
                    </div>

                    {/* Progress Photos */}
                    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-[var(--primary-600)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--foreground)]">Progress Photos</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">{photos.length} photos</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowPhotoModal(true)} variant="primary" className="px-3 py-1.5 text-xs">+ Add</Button>
                        </div>
                        {photos.length === 0 ? (
                            <div className="px-5 pb-5 pt-1 text-center py-6">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)]">No photos yet.</p>
                            </div>
                        ) : (
                            <div className="px-5 pb-5 pt-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {photos.map((photo) => (
                                        <ProgressPhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sign Out */}
                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-5 py-4 bg-[var(--surface)] rounded-[var(--radius-lg)] hover:bg-[var(--surface-raised)] transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[var(--color-destructive-bg)] flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-[var(--color-destructive)]" />
                        </div>
                        <span className="flex-1 text-left text-sm font-semibold text-[var(--color-destructive)]">Sign Out</span>
                        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                    </button>
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
                            const res = await fetch("/api/auth/session");
                            if (res.ok) {
                                const json = await res.json();
                                setUser(json.user);
                            }
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
