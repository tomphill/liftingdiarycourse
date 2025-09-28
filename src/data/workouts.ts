import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function createWorkoutHelper(data: {
  name: string;
  startedAt: Date;
  userId: string;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      name: data.name,
      startedAt: data.startedAt,
      userId: data.userId,
      createdAt: new Date(),
    })
    .returning();

  return workout;
}

export async function getWorkoutByIdHelper(workoutId: string, userId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  return workout;
}

export async function updateWorkoutHelper(
  workoutId: string,
  userId: string,
  data: {
    name?: string;
    startedAt?: Date;
  }
) {
  const [workout] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return workout;
}