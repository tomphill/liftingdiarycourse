import { db } from '@/db';
import { exercises, workoutExercises, sets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getAllExercisesHelper() {
  return await db
    .select()
    .from(exercises)
    .orderBy(exercises.name);
}

export async function getWorkoutExercisesWithSetsHelper(
  workoutId: string
) {
  const result = await db
    .select({
      workoutExercise: {
        id: workoutExercises.id,
        workoutId: workoutExercises.workoutId,
        exerciseId: workoutExercises.exerciseId,
        order: workoutExercises.order,
      },
      exercise: {
        id: exercises.id,
        name: exercises.name,
      },
      set: {
        id: sets.id,
        setNumber: sets.setNumber,
        weight: sets.weight,
        reps: sets.reps,
      },
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .leftJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(workoutExercises.order, sets.setNumber);

  // Group by workout exercise
  const exercisesMap = new Map();

  for (const row of result) {
    const weId = row.workoutExercise.id;

    if (!exercisesMap.has(weId)) {
      exercisesMap.set(weId, {
        id: row.workoutExercise.id,
        workoutId: row.workoutExercise.workoutId,
        exerciseId: row.workoutExercise.exerciseId,
        order: row.workoutExercise.order,
        exercise: row.exercise,
        sets: [],
      });
    }

    if (row.set && row.set.id) {
      exercisesMap.get(weId).sets.push(row.set);
    }
  }

  return Array.from(exercisesMap.values());
}

export async function addExerciseToWorkoutHelper(
  workoutId: string,
  exerciseId: string,
  order: number
) {
  const [workoutExercise] = await db
    .insert(workoutExercises)
    .values({
      workoutId,
      exerciseId,
      order,
      createdAt: new Date(),
    })
    .returning();

  return workoutExercise;
}

export async function removeExerciseFromWorkoutHelper(
  workoutExerciseId: string
) {
  await db
    .delete(workoutExercises)
    .where(eq(workoutExercises.id, workoutExerciseId));
}

export async function reorderWorkoutExercisesHelper(
  updates: { id: string; order: number }[]
) {
  for (const update of updates) {
    await db
      .update(workoutExercises)
      .set({ order: update.order })
      .where(eq(workoutExercises.id, update.id));
  }
}