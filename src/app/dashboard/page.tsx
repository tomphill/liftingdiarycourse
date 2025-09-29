import { getUserWorkouts } from "@/data/user-workouts";
import { format } from "date-fns";
import { CalendarClient } from "./calendar-client";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Workout Dashboard</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardContent searchParams={params} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ searchParams }: { searchParams: { date?: string } }) {
  const formatDateWithOrdinal = (date: Date) => {
    return format(date, "do MMM yyyy");
  };

  const parseDateFromString = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDate = searchParams.date ? parseDateFromString(searchParams.date) : new Date();
  const workouts = await getUserWorkouts(selectedDate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <CalendarClient />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Workouts for {formatDateWithOrdinal(selectedDate)}
        </h2>

        <div className="space-y-4">
          {workouts.length > 0 ? (
            workouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/dashboard/workout/${workout.id}`}
                className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{workout.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {format(workout.startedAt, "h:mm a")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {workout.completedAt ? "Completed" : "In Progress"}
                    </span>
                    {workout.completedAt && (
                      <span className="text-sm text-muted-foreground">
                        • Duration: {Math.round(
                          (new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) / (1000 * 60)
                        )} min
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No workouts logged for this date</p>
              <Button className="mt-4">
                Log New Workout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}