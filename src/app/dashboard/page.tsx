"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formatDateWithOrdinal = (date: Date) => {
    return format(date, "do MMM yyyy");
  };

  const mockWorkouts = [
    {
      id: 1,
      name: "Upper Body Strength",
      exercises: ["Bench Press", "Pull-ups", "Shoulder Press"],
      duration: "45 min",
      time: "9:00 AM"
    },
    {
      id: 2,
      name: "Cardio Session",
      exercises: ["Treadmill", "Rowing"],
      duration: "30 min",
      time: "6:00 PM"
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Workout Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Date</h2>
          <div className="border rounded-lg p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Workouts for {formatDateWithOrdinal(selectedDate)}
          </h2>

          <div className="space-y-4">
            {mockWorkouts.length > 0 ? (
              mockWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{workout.name}</h3>
                    <span className="text-sm text-muted-foreground">{workout.time}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {workout.exercises.map((exercise, index) => (
                        <span
                          key={index}
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                        >
                          {exercise}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Duration: {workout.duration}
                    </p>
                  </div>
                </div>
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
    </div>
  );
}