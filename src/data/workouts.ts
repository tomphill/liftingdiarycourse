import { db } from '@/db';
import { workouts } from '@/db/schema';

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