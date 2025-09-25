import { db } from '@/db'
import { workouts, workoutExercises, exercises } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

export async function getUserWorkouts(date?: Date) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const query = db
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      createdAt: workouts.createdAt,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt))

  const workoutData = await query

  // If a specific date is provided, filter by that date
  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return workoutData.filter(workout => {
      const workoutDate = new Date(workout.startedAt)
      return workoutDate >= startOfDay && workoutDate <= endOfDay
    })
  }

  return workoutData
}

export async function getUserWorkoutWithExercises(workoutId: string) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await db
    .select({
      workout: {
        id: workouts.id,
        name: workouts.name,
        startedAt: workouts.startedAt,
        completedAt: workouts.completedAt,
        userId: workouts.userId,
      },
      exercise: {
        id: exercises.id,
        name: exercises.name,
      },
      workoutExercise: {
        id: workoutExercises.id,
        order: workoutExercises.order,
      },
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
    .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .orderBy(workoutExercises.order)

  if (result.length === 0) {
    return null
  }

  const workout = result[0].workout
  const exercisesList = result
    .filter(row => row.exercise?.id)
    .map(row => row.exercise!.name)

  return {
    ...workout,
    exercises: exercisesList,
  }
}