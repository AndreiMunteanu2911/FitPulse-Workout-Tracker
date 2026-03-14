import { create } from "zustand";
import { Workout, WorkoutExercise, Exercise } from "@/types";

interface WorkoutState {
  activeWorkout: Workout | null;
  isWorkoutActive: boolean;
  
  setActiveWorkout: (workout: Workout | null) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseIndex: number) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateWorkoutName: (name: string) => void;
  clearActiveWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  isWorkoutActive: false,

  setActiveWorkout: (workout) => {
    set({ activeWorkout: workout, isWorkoutActive: !!workout });
  },

  addExercise: (exercise: Exercise) => {
    const current = get().activeWorkout;
    if (!current) return;
    const newWorkoutExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      workout_id: current.id,
      exercise_id: exercise.exercise_id,
      order_index: (current.workout_exercises || []).length,
      exercise: exercise,
      sets: [{ id: crypto.randomUUID(), workout_exercise_id: "", set_number: 1, reps: 0, weight: 0 }],
    };
    set({ activeWorkout: { ...current, workout_exercises: [...(current.workout_exercises || []), newWorkoutExercise] } });
  },

  removeExercise: (exerciseIndex: number) => {
    const current = get().activeWorkout;
    if (!current) return;
    const updated = current.workout_exercises?.filter((_, i) => i !== exerciseIndex) || [];
    set({ activeWorkout: { ...current, workout_exercises: updated.map((we, i) => ({ ...we, order_index: i })) } });
  },

  addSet: (exerciseIndex: number) => {
    const current = get().activeWorkout;
    if (!current || !current.workout_exercises?.[exerciseIndex]) return;
    const exercise = current.workout_exercises[exerciseIndex];
    const newSetNumber = (exercise.sets || []).length + 1;
    const newSet = { id: crypto.randomUUID(), workout_exercise_id: exercise.id, set_number: newSetNumber, reps: 0, weight: 0 };
    const updatedExercises = [...current.workout_exercises];
    updatedExercises[exerciseIndex] = { ...exercise, sets: [...(exercise.sets || []), newSet] };
    set({ activeWorkout: { ...current, workout_exercises: updatedExercises } });
  },

  updateSet: (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => {
    const current = get().activeWorkout;
    if (!current || !current.workout_exercises?.[exerciseIndex]) return;
    const updatedExercises = [...current.workout_exercises];
    const exercise = updatedExercises[exerciseIndex];
    const updatedSets = [...(exercise.sets || [])];
    updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value };
    updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };
    set({ activeWorkout: { ...current, workout_exercises: updatedExercises } });
  },

  removeSet: (exerciseIndex: number, setIndex: number) => {
    const current = get().activeWorkout;
    if (!current || !current.workout_exercises?.[exerciseIndex]) return;
    const updatedExercises = [...current.workout_exercises];
    const exercise = updatedExercises[exerciseIndex];
    const updatedSets = (exercise.sets || []).filter((_, i) => i !== setIndex).map((set, i) => ({ ...set, set_number: i + 1 }));
    updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };
    set({ activeWorkout: { ...current, workout_exercises: updatedExercises } });
  },

  updateWorkoutName: (name: string) => {
    const current = get().activeWorkout;
    if (!current) return;
    set({ activeWorkout: { ...current, name } });
  },

  clearActiveWorkout: () => {
    set({ activeWorkout: null, isWorkoutActive: false });
  },
}));
