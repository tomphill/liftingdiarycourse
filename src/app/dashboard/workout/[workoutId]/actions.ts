'use server';

import { z } from 'zod';
import { getWorkoutByIdHelper, updateWorkoutHelper } from '@/data/workouts';
import { auth } from '@clerk/nextjs/server';
import type { InferSelectModel } from 'drizzle-orm';
import { workouts } from '@/db/schema';

type Workout = InferSelectModel<typeof workouts>;

const updateWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  startedAt: z.string().min(1, 'Start time is required').refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
});

interface UpdateWorkoutParams {
  workoutId: string;
  name: string;
  startedAt: string;
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> | string };

export async function updateWorkout(params: UpdateWorkoutParams): Promise<ActionResult<Workout>> {
  const result = updateWorkoutSchema.safeParse({
    name: params.name,
    startedAt: params.startedAt,
  });

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
    const existingWorkout = await getWorkoutByIdHelper(params.workoutId, userId);
    if (!existingWorkout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    const workout = await updateWorkoutHelper(params.workoutId, userId, {
      name: result.data.name,
      startedAt: new Date(result.data.startedAt),
    });

    return {
      success: true,
      data: workout,
    };
  } catch (error) {
    console.error('Failed to update workout:', error);
    return {
      success: false,
      errors: 'Failed to update workout',
    };
  }
}

export async function getWorkout(workoutId: string): Promise<ActionResult<Workout>> {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  try {
    const workout = await getWorkoutByIdHelper(workoutId, userId);
    if (!workout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    return {
      success: true,
      data: workout,
    };
  } catch (error) {
    console.error('Failed to get workout:', error);
    return {
      success: false,
      errors: 'Failed to get workout',
    };
  }
}