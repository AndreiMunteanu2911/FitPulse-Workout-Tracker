import LoadingSpinner from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <LoadingSpinner />
    </div>
  );
}
