'use server';

import { z } from 'zod';
import { createWorkoutHelper } from '@/data/workouts';
import { auth } from '@clerk/nextjs/server';
import type { InferSelectModel } from 'drizzle-orm';
import { workouts } from '@/db/schema';

type Workout = InferSelectModel<typeof workouts>;

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  startedAt: z.string().datetime('Invalid date format'),
});

interface CreateWorkoutParams {
  name: string;
  startedAt: string;
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> | string };

export async function createWorkout(params: CreateWorkoutParams): Promise<ActionResult<Workout>> {
  const result = createWorkoutSchema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  try {
    const workout = await createWorkoutHelper({
      name: result.data.name,
      startedAt: new Date(result.data.startedAt),
      userId,
    });

    return {
      success: true,
      data: workout,
    };
  } catch (error) {
    console.error('Failed to create workout:', error);
    return {
      success: false,
      errors: 'Failed to create workout',
    };
  }
}