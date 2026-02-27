interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  log_date: string;
  notes?: string;
  created_at: string;
}

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
    <div className="bg-[var(--surface)] border-2 border-[var(--primary-600)] dark:border-[var(--primary-500)] rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-square">
        <img
          src={photo.photo_url}
          alt="Progress photo"
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onDelete(photo.id)}
          className="absolute top-2 right-2 p-2 bg-red-600 dark:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
          aria-label="Delete photo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {formatDate(photo.log_date)}
        </span>
        {photo.notes && (
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1">{photo.notes}</p>
        )}
      </div>
    </div>
  );
}
