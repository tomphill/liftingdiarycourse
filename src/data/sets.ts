import { db } from '@/db';
import { sets } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function addSetHelper(data: {
  workoutExerciseId: string;
  setNumber: number;
  weight?: string;
  reps?: number;
}) {
  const [set] = await db
    .insert(sets)
    .values({
      workoutExerciseId: data.workoutExerciseId,
      setNumber: data.setNumber,
      weight: data.weight || null,
      reps: data.reps || null,
      createdAt: new Date(),
    })
    .returning();

  return set;
}

export async function updateSetHelper(
  setId: string,
  data: {
    weight?: string;
    reps?: number;
  }
) {
  const [set] = await db
    .update(sets)
    .set({
      weight: data.weight !== undefined ? data.weight : undefined,
      reps: data.reps !== undefined ? data.reps : undefined,
    })
    .where(eq(sets.id, setId))
    .returning();

  return set;
}

export async function deleteSetHelper(setId: string) {
  await db.delete(sets).where(eq(sets.id, setId));
}