import type { ProgressPhoto } from "@/types";
import { Trash2 } from "lucide-react";

interface ProgressPhotoCardProps {
  photo: ProgressPhoto;
  onDelete: (id: string) => void;
}

export default function ProgressPhotoCard({ photo, onDelete }: ProgressPhotoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] overflow-hidden hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="relative aspect-square">
        <img
          src={photo.photo_url}
          alt="Progress photo"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onDelete(photo.id)}
          className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
          aria-label="Delete photo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <span className="text-sm font-semibold text-[var(--foreground)]">{formatDate(photo.log_date)}</span>
        {photo.notes && (
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-0.5">{photo.notes}</p>
        )}
      </div>
    </div>
  );
}
