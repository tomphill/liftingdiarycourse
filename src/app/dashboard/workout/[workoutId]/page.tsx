'use client';

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateWorkout, getWorkout } from './actions';

const formSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  startedAt: z.string().min(1, 'Start time is required'),
});

type FormData = z.infer<typeof formSchema>;

interface EditWorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]> | string | null>(null);
  const router = useRouter();

  const resolvedParams = use(params);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startedAt: '',
    },
  });

  useEffect(() => {
    async function loadWorkout() {
      setIsLoading(true);
      try {
        const result = await getWorkout(resolvedParams.workoutId);

        if (result?.success) {
          const workout = result.data;
          form.reset({
            name: workout.name,
            startedAt: new Date(workout.startedAt).toISOString().slice(0, 16),
          });
        } else {
          setErrors(result?.errors || 'Failed to load workout');
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        setErrors('An unexpected error occurred while loading the workout');
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkout();
  }, [resolvedParams.workoutId, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrors(null);

    try {
      const result = await updateWorkout({
        workoutId: resolvedParams.workoutId,
        name: data.name,
        startedAt: new Date(data.startedAt).toISOString(),
      });

      if (result?.success) {
        router.push('/dashboard');
      } else {
        setErrors(result?.errors || 'An error occurred');
      }
    } catch (error) {
      console.error('Error updating workout:', error);
      setErrors('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">Loading workout...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Edit Workout</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workout Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter workout name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errors && (
            <div className="text-red-600 text-sm">
              {typeof errors === 'string' ? errors : JSON.stringify(errors)}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Workout'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}