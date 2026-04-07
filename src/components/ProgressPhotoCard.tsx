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
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden transition-all duration-200 group">
      <div className="relative aspect-square">
        <img
          src={photo.photo_url}
          alt="Progress photo"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Date badge */}
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-[#232323] opacity-0 group-hover:opacity-100 transition-opacity">
          {formatDate(photo.log_date)}
        </div>
        {/* Delete button */}
        <button
          onClick={() => onDelete(photo.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--color-destructive)] hover:text-white"
          aria-label="Delete photo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {photo.notes && (
        <div className="p-2.5">
          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{photo.notes}</p>
        </div>
      )}
    </div>
  );
}
