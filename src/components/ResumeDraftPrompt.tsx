import Button from "./Button";

interface DraftWorkout {
    id: string;
    name: string;
    workout_date: string;
}

interface ResumeDraftPromptProps {
    show: boolean;
    draftWorkout: DraftWorkout | null;
    onResume: () => void;
    onDiscard: () => void;
}

export default function ResumeDraftPrompt({
                                              show,
                                              draftWorkout,
                                              onResume,
                                              onDiscard,
                                          }: ResumeDraftPromptProps) {
    if (!show || !draftWorkout) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-sm p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Resume Workout?</h3>
                <p className="mb-6 text-gray-700">
                    You have an unfinished workout named "{draftWorkout.name}" from{" "}
                    {new Date(draftWorkout.workout_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}.
                    Would you like to resume it or start fresh?
                </p>
                <div className="flex gap-3">
                    <Button onClick={onResume} className="flex-1">
                        Resume
                    </Button>
                    <button
                        onClick={onDiscard}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
}