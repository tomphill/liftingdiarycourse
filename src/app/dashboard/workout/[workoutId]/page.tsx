'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getWorkout,
  getAllExercises,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  logSet,
  deleteSet,
  completeWorkout,
} from './actions';

interface WorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

type Exercise = {
  id: string;
  name: string;
};

type Set = {
  id: string;
  setNumber: number;
  weight: string | null;
  reps: number | null;
};

type WorkoutExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  exercise: {
    id: string;
    name: string;
  };
  sets: Set[];
};

type Workout = {
  id: string;
  name: string;
  startedAt: Date;
  completedAt: Date | null;
  exercises: WorkoutExercise[];
};

export default function WorkoutPage({ params }: WorkoutPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [errors, setErrors] = useState<string | null>(null);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const router = useRouter();

  const resolvedParams = use(params);

  const loadWorkout = async () => {
    try {
      const result = await getWorkout(resolvedParams.workoutId);

      if (result?.success) {
        setWorkout(result.data as Workout);
      } else {
        setErrors(result?.errors as string || 'Failed to load workout');
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      setErrors('An unexpected error occurred while loading the workout');
    }
  };

  const loadExercises = async () => {
    try {
      const result = await getAllExercises();
      if (result?.success) {
        setExercises(result.data as Exercise[]);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await Promise.all([loadWorkout(), loadExercises()]);
      setIsLoading(false);
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.workoutId]);

  const handleAddExercise = async () => {
    if (!selectedExerciseId) return;

    try {
      const result = await addExerciseToWorkout({
        workoutId: resolvedParams.workoutId,
        exerciseId: selectedExerciseId,
      });

      if (result?.success) {
        await loadWorkout();
        setAddExerciseDialogOpen(false);
        setSelectedExerciseId('');
      } else {
        setErrors(result?.errors as string || 'Failed to add exercise');
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
      setErrors('An unexpected error occurred');
    }
  };

  const handleRemoveExercise = async (workoutExerciseId: string) => {
    try {
      const result = await removeExerciseFromWorkout({
        workoutId: resolvedParams.workoutId,
        workoutExerciseId,
      });

      if (result?.success) {
        await loadWorkout();
      } else {
        setErrors(result?.errors as string || 'Failed to remove exercise');
      }
    } catch (error) {
      console.error('Error removing exercise:', error);
      setErrors('An unexpected error occurred');
    }
  };

  const handleLogSet = async (
    workoutExerciseId: string,
    setId: string | undefined,
    weight: string,
    reps: string
  ) => {
    try {
      const result = await logSet({
        workoutId: resolvedParams.workoutId,
        workoutExerciseId,
        setId,
        weight: weight || undefined,
        reps: reps ? parseInt(reps) : undefined,
      });

      if (result?.success) {
        await loadWorkout();
      } else {
        setErrors(result?.errors as string || 'Failed to log set');
      }
    } catch (error) {
      console.error('Error logging set:', error);
      setErrors('An unexpected error occurred');
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      const result = await deleteSet({
        workoutId: resolvedParams.workoutId,
        setId,
      });

      if (result?.success) {
        await loadWorkout();
      } else {
        setErrors(result?.errors as string || 'Failed to delete set');
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      setErrors('An unexpected error occurred');
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const result = await completeWorkout({
        workoutId: resolvedParams.workoutId,
      });

      if (result?.success) {
        router.push('/dashboard');
      } else {
        setErrors(result?.errors as string || 'Failed to complete workout');
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      setErrors('An unexpected error occurred');
    }
  };

  const formatDateWithOrdinal = (date: Date) => {
    return format(new Date(date), 'do MMM yyyy');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">Loading workout...</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center text-red-600">
          {errors || 'Workout not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{workout.name}</h1>
          <p className="text-muted-foreground mt-1">
            {formatDateWithOrdinal(workout.startedAt)} •{' '}
            {workout.completedAt ? 'Completed' : 'In Progress'}
          </p>
        </div>
        <div className="flex gap-2">
          {!workout.completedAt && (
            <Button onClick={handleCompleteWorkout}>Complete Workout</Button>
          )}
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {errors && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {errors}
        </div>
      )}

      <div className="space-y-6">
        {workout.exercises.map((workoutExercise) => (
          <ExerciseCard
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            onRemove={() => handleRemoveExercise(workoutExercise.id)}
            onLogSet={handleLogSet}
            onDeleteSet={handleDeleteSet}
            isCompleted={!!workout.completedAt}
          />
        ))}

        {!workout.completedAt && (
          <Dialog
            open={addExerciseDialogOpen}
            onOpenChange={setAddExerciseDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                + Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Exercise</DialogTitle>
                <DialogDescription>
                  Select an exercise to add to your workout
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select
                  value={selectedExerciseId}
                  onValueChange={setSelectedExerciseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleAddExercise} disabled={!selectedExerciseId}>
                    Add Exercise
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddExerciseDialogOpen(false);
                      setSelectedExerciseId('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  onRemove: () => void;
  onLogSet: (
    workoutExerciseId: string,
    setId: string | undefined,
    weight: string,
    reps: string
  ) => void;
  onDeleteSet: (setId: string) => void;
  isCompleted: boolean;
}

function ExerciseCard({
  workoutExercise,
  onRemove,
  onLogSet,
  onDeleteSet,
  isCompleted,
}: ExerciseCardProps) {
  const [newSetWeight, setNewSetWeight] = useState('');
  const [newSetReps, setNewSetReps] = useState('');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const handleAddSet = async () => {
    await onLogSet(workoutExercise.id, undefined, newSetWeight, newSetReps);
    setNewSetWeight('');
    setNewSetReps('');
  };

  const handleUpdateSet = async (setId: string) => {
    await onLogSet(workoutExercise.id, setId, editWeight, editReps);
    setEditingSetId(null);
  };

  const startEditing = (set: Set) => {
    setEditingSetId(set.id);
    setEditWeight(set.weight || '');
    setEditReps(set.reps?.toString() || '');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{workoutExercise.exercise.name}</CardTitle>
          {!isCompleted && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Set</TableHead>
              <TableHead>Weight (lbs)</TableHead>
              <TableHead>Reps</TableHead>
              {!isCompleted && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {workoutExercise.sets.map((set) => (
              <TableRow key={set.id}>
                <TableCell>{set.setNumber}</TableCell>
                <TableCell>
                  {editingSetId === set.id ? (
                    <Input
                      type="text"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="Weight"
                      className="w-24"
                    />
                  ) : (
                    set.weight || '-'
                  )}
                </TableCell>
                <TableCell>
                  {editingSetId === set.id ? (
                    <Input
                      type="number"
                      value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      placeholder="Reps"
                      className="w-24"
                    />
                  ) : (
                    set.reps || '-'
                  )}
                </TableCell>
                {!isCompleted && (
                  <TableCell>
                    {editingSetId === set.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateSet(set.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSetId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(set)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteSet(set.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!isCompleted && (
              <TableRow>
                <TableCell>{workoutExercise.sets.length + 1}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={newSetWeight}
                    onChange={(e) => setNewSetWeight(e.target.value)}
                    placeholder="Weight"
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newSetReps}
                    onChange={(e) => setNewSetReps(e.target.value)}
                    placeholder="Reps"
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={handleAddSet}>
                    Add Set
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}