'use server';

import { z } from 'zod';
import { getWorkoutByIdHelper, updateWorkoutHelper } from '@/data/workouts';
import { auth } from '@clerk/nextjs/server';
import type { InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { workouts } from '@/db/schema';
import {
  getAllExercisesHelper,
  getWorkoutExercisesWithSetsHelper,
  addExerciseToWorkoutHelper,
  removeExerciseFromWorkoutHelper,
} from '@/data/exercises';
import { addSetHelper, updateSetHelper, deleteSetHelper } from '@/data/sets';
import { db } from '@/db';

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

export async function getWorkout(workoutId: string) {
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

    const exercisesWithSets = await getWorkoutExercisesWithSetsHelper(
      workoutId
    );

    return {
      success: true,
      data: {
        ...workout,
        exercises: exercisesWithSets,
      },
    };
  } catch (error) {
    console.error('Failed to get workout:', error);
    return {
      success: false,
      errors: 'Failed to get workout',
    };
  }
}

export async function getAllExercises() {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  try {
    const exercises = await getAllExercisesHelper();
    return {
      success: true,
      data: exercises,
    };
  } catch (error) {
    console.error('Failed to get exercises:', error);
    return {
      success: false,
      errors: 'Failed to get exercises',
    };
  }
}

const addExerciseSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
});

interface AddExerciseParams {
  workoutId: string;
  exerciseId: string;
}

export async function addExerciseToWorkout(params: AddExerciseParams) {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  const result = addExerciseSchema.safeParse({
    exerciseId: params.exerciseId,
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    // Verify workout ownership
    const workout = await getWorkoutByIdHelper(params.workoutId, userId);
    if (!workout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    // Get current max order
    const existingExercises = await getWorkoutExercisesWithSetsHelper(
      params.workoutId
    );
    const maxOrder = existingExercises.length > 0
      ? Math.max(...existingExercises.map((e) => e.order))
      : 0;

    const workoutExercise = await addExerciseToWorkoutHelper(
      params.workoutId,
      params.exerciseId,
      maxOrder + 1
    );

    return {
      success: true,
      data: workoutExercise,
    };
  } catch (error) {
    console.error('Failed to add exercise to workout:', error);
    return {
      success: false,
      errors: 'Failed to add exercise to workout',
    };
  }
}

interface RemoveExerciseParams {
  workoutId: string;
  workoutExerciseId: string;
}

export async function removeExerciseFromWorkout(params: RemoveExerciseParams) {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  try {
    // Verify workout ownership
    const workout = await getWorkoutByIdHelper(params.workoutId, userId);
    if (!workout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    await removeExerciseFromWorkoutHelper(params.workoutExerciseId);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Failed to remove exercise from workout:', error);
    return {
      success: false,
      errors: 'Failed to remove exercise from workout',
    };
  }
}

const logSetSchema = z.object({
  weight: z.string().optional(),
  reps: z.number().int().positive().optional(),
});

interface LogSetParams {
  workoutId: string;
  workoutExerciseId: string;
  setId?: string;
  weight?: string;
  reps?: number;
}

export async function logSet(params: LogSetParams) {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  const result = logSetSchema.safeParse({
    weight: params.weight,
    reps: params.reps,
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    // Verify workout ownership
    const workout = await getWorkoutByIdHelper(params.workoutId, userId);
    if (!workout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    let set;
    if (params.setId) {
      // Update existing set
      set = await updateSetHelper(params.setId, {
        weight: params.weight,
        reps: params.reps,
      });
    } else {
      // Add new set
      const exercisesWithSets = await getWorkoutExercisesWithSetsHelper(
        params.workoutId
      );
      const exercise = exercisesWithSets.find(
        (e) => e.id === params.workoutExerciseId
      );
      const nextSetNumber = exercise ? exercise.sets.length + 1 : 1;

      set = await addSetHelper({
        workoutExerciseId: params.workoutExerciseId,
        setNumber: nextSetNumber,
        weight: params.weight,
        reps: params.reps,
      });
    }

    return {
      success: true,
      data: set,
    };
  } catch (error) {
    console.error('Failed to log set:', error);
    return {
      success: false,
      errors: 'Failed to log set',
    };
  }
}

interface DeleteSetParams {
  workoutId: string;
  setId: string;
}

export async function deleteSet(params: DeleteSetParams) {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  try {
    // Verify workout ownership
    const workout = await getWorkoutByIdHelper(params.workoutId, userId);
    if (!workout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    await deleteSetHelper(params.setId);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Failed to delete set:', error);
    return {
      success: false,
      errors: 'Failed to delete set',
    };
  }
}

interface CompleteWorkoutParams {
  workoutId: string;
}

export async function completeWorkout(params: CompleteWorkoutParams) {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      errors: 'Authentication required',
    };
  }

  try {
    const workout = await getWorkoutByIdHelper(params.workoutId, userId);
    if (!workout) {
      return {
        success: false,
        errors: 'Workout not found',
      };
    }

    const updatedWorkout = await db
      .update(workouts)
      .set({
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workouts.id, params.workoutId))
      .returning();

    return {
      success: true,
      data: updatedWorkout[0],
    };
  } catch (error) {
    console.error('Failed to complete workout:', error);
    return {
      success: false,
      errors: 'Failed to complete workout',
    };
  }
}