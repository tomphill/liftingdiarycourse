'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createWorkout } from './actions';

const formSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  startedAt: z.string().min(1, 'Start time is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewWorkoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | string | null>(null);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startedAt: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrors(null);

    try {
      const result = await createWorkout({
        name: data.name,
        startedAt: new Date(data.startedAt).toISOString(),
      });

      if (result?.success) {
        router.push('/dashboard');
      } else {
        setErrors(result?.errors || 'An error occurred');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      setErrors('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Workout</h1>

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
              {isSubmitting ? 'Creating...' : 'Create Workout'}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}