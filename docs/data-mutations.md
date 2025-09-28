# Data Mutations

This document outlines the coding standards and patterns for data mutations in this Next.js application.

## Architecture Overview

Data mutations follow a three-layer architecture:

1. **Server Actions** (`actions.ts` files) - Handle form submissions and user interactions
2. **Data Helpers** (`src/data/` directory) - Contain business logic and database operations
3. **Database Layer** - Drizzle ORM for type-safe database interactions

## Server Actions

### File Organization

- Server actions MUST be placed in colocated `actions.ts` files within the relevant feature directory
- Each `actions.ts` file should contain actions related to that specific feature or page

```typescript
// Example file structure
src/app/workouts/actions.ts
src/app/exercises/actions.ts
src/app/profile/actions.ts
```

### Parameter Typing

- Server action parameters MUST be explicitly typed
- Parameters MUST NOT use the `FormData` type
- Use specific TypeScript interfaces or types for parameters

```typescript
// ✅ Correct - Explicit typing
interface CreateWorkoutParams {
  name: string;
  date: string;
  exercises: number[];
}

export async function createWorkout(params: CreateWorkoutParams) {
  // implementation
}

// ❌ Incorrect - Using FormData
export async function createWorkout(formData: FormData) {
  // don't do this
}
```

### Validation with Zod

- ALL server actions MUST validate their arguments using Zod schemas
- Validation should happen at the beginning of each server action
- Return validation errors in a consistent format

```typescript
import { z } from 'zod';

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  date: z.string().datetime(),
  exercises: z.array(z.number()).min(1, 'At least one exercise is required'),
});

export async function createWorkout(params: CreateWorkoutParams) {
  // Validate input
  const result = createWorkoutSchema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Proceed with mutation
  const validData = result.data;
  // ... rest of implementation
}
```

### Navigation and Redirects

- Server actions MUST NOT use the `redirect()` function from `next/navigation`
- Redirects should be handled client-side after the server action resolves
- Server actions should return success/error status and let the client handle navigation

```typescript
// ❌ Incorrect - Using redirect() in server action
import { redirect } from 'next/navigation';

export async function createWorkout(params: CreateWorkoutParams) {
  // ... validation and database operations

  redirect('/dashboard'); // DON'T DO THIS
}

// ✅ Correct - Return success and handle redirect client-side
export async function createWorkout(params: CreateWorkoutParams): Promise<ActionResult<Workout>> {
  // ... validation and database operations

  return {
    success: true,
    data: workout,
  };
}

// Client component handles the redirect
const onSubmit = async (data: FormData) => {
  const result = await createWorkout(data);

  if (result.success) {
    router.push('/dashboard'); // Handle redirect here
  }
};
```

### Error Handling

- Server actions should return a consistent result format
- Include both success/error status and relevant data/error messages

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> | string };

export async function createWorkout(params: CreateWorkoutParams): Promise<ActionResult<Workout>> {
  try {
    const result = createWorkoutSchema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
      };
    }

    const workout = await createWorkoutHelper(result.data);

    return {
      success: true,
      data: workout,
    };
  } catch (error) {
    return {
      success: false,
      errors: 'An unexpected error occurred',
    };
  }
}
```

## Data Helpers

### File Organization

- Data helpers MUST be placed in the `src/data/` directory
- Group related helpers by domain/feature
- Use descriptive naming conventions

```typescript
// Example file structure
src/data/workouts.ts
src/data/exercises.ts
src/data/users.ts
```

### Database Operations

- All database operations MUST use Drizzle ORM
- Data helpers should contain the business logic and database queries
- Keep database-specific logic separated from server actions

```typescript
// src/data/workouts.ts
import { db } from '@/lib/db';
import { workouts, exercises } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function createWorkoutHelper(data: {
  name: string;
  date: string;
  userId: string;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      name: data.name,
      date: new Date(data.date),
      userId: data.userId,
      createdAt: new Date(),
    })
    .returning();

  return workout;
}

export async function getWorkoutsByUser(userId: string) {
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}
```

### Type Safety

- Leverage Drizzle's type inference for database operations
- Export types from schema files for use in helpers and actions
- Use `InferSelectModel` and `InferInsertModel` for type generation

```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { workouts } from '@/lib/db/schema';

export type Workout = InferSelectModel<typeof workouts>;
export type NewWorkout = InferInsertModel<typeof workouts>;
```

## Complete Example

Here's a complete example following all the standards:

```typescript
// src/data/workouts.ts
import { db } from '@/lib/db';
import { workouts } from '@/lib/db/schema';

export async function createWorkoutHelper(data: {
  name: string;
  date: Date;
  userId: string;
}) {
  const [workout] = await db
    .insert(workouts)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();

  return workout;
}

// src/app/workouts/actions.ts
'use server';

import { z } from 'zod';
import { createWorkoutHelper } from '@/data/workouts';
import { auth } from '@/lib/auth'; // assuming auth helper exists

const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  date: z.string().datetime('Invalid date format'),
});

interface CreateWorkoutParams {
  name: string;
  date: string;
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> | string };

export async function createWorkout(params: CreateWorkoutParams): Promise<ActionResult<Workout>> {
  try {
    // Validate input
    const result = createWorkoutSchema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.flatten().fieldErrors,
      };
    }

    // Get authenticated user
    const user = await auth();
    if (!user) {
      return {
        success: false,
        errors: 'Authentication required',
      };
    }

    // Call data helper
    const workout = await createWorkoutHelper({
      name: result.data.name,
      date: new Date(result.data.date),
      userId: user.id,
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
```

## Best Practices

1. **Separation of Concerns**: Keep server actions focused on validation and coordination, while data helpers handle business logic
2. **Consistent Error Handling**: Always return results in a predictable format
3. **Type Safety**: Leverage TypeScript and Drizzle's type system throughout
4. **Validation**: Never trust client input - always validate with Zod
5. **Authentication**: Check user permissions in server actions before calling data helpers
6. **Logging**: Log errors appropriately for debugging while avoiding sensitive data exposure

## Anti-Patterns to Avoid

- ❌ Using `FormData` as server action parameters
- ❌ Skipping validation in server actions
- ❌ Placing database queries directly in server actions
- ❌ Not handling errors consistently
- ❌ Mixing concerns between actions and data helpers
- ❌ Using `redirect()` function within server actions