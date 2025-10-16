import Button from "./Button";

interface WorkoutHeaderProps {
    workoutStarted: boolean;
    onStart: () => void;
    onCancel: () => void;
    onFinish: () => void;
}

export default function WorkoutHeader({
                                          workoutStarted,
                                          onStart,
                                          onCancel,
                                          onFinish,
                                      }: WorkoutHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="text-3xl font-bold">Workout</div>
            {!workoutStarted ? (
                <Button onClick={onStart}>New Workout</Button>
            ) : (
                <div className="flex gap-2">
                    <Button onClick={onCancel}>Cancel Workout</Button>
                    <Button onClick={onFinish}>Finish Workout</Button>
                </div>
            )}
        </div>
    );
}