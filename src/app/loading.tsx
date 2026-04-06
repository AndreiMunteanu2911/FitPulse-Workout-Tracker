import Skeleton from "react-loading-skeleton";

export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full p-8 space-y-4">
      <Skeleton width={160} height={32} className="mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={80} className="rounded-xl" />
        ))}
      </div>
      <Skeleton height={200} className="rounded-xl" />
    </div>
  );
}
