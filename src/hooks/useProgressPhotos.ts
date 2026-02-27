"use client";

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  log_date: string;
  notes?: string;
  body_part?: string;
  created_at: string;
}

export function useProgressPhotos() {
  const fetchProgressPhotos = async (): Promise<ProgressPhoto[]> => {
    const res = await fetch("/api/progress-photos");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch progress photos");
    return data.photos || [];
  };

  const addProgressPhoto = async (data: {
    photo?: File;
    photo_url?: string;
    log_date?: string;
    notes?: string;
    body_part?: string;
  }): Promise<ProgressPhoto> => {
    const formData = new FormData();
    if (data.photo) formData.append("photo", data.photo);
    if (data.photo_url) formData.append("photo_url", data.photo_url);
    if (data.log_date) formData.append("log_date", data.log_date);
    if (data.notes) formData.append("notes", data.notes);
    if (data.body_part) formData.append("body_part", data.body_part);

    const res = await fetch("/api/progress-photos", {
      method: "POST",
      body: formData,
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to add progress photo");
    return resData.photo;
  };

  const deleteProgressPhoto = async (id: string): Promise<void> => {
    const res = await fetch(`/api/progress-photos?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete progress photo");
  };

  return {
    fetchProgressPhotos,
    addProgressPhoto,
    deleteProgressPhoto,
  };
}
