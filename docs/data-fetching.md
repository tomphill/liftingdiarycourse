# Data Fetching Guidelines

## Core Principle: Server Components Only

**CRITICAL**: ALL data fetching within this application MUST be done via Server Components. This is a fundamental architectural requirement.

### ✅ Allowed Data Fetching Methods
- **Server Components** - The ONLY approved method for data fetching

### ❌ Prohibited Data Fetching Methods
- Route handlers (API routes)
- Client components
- Client-side fetching (useEffect, SWR, React Query, etc.)
- Any other method not explicitly listed as allowed

## Database Query Requirements

### Helper Functions in /data Directory
All database queries MUST be implemented as helper functions within the `/data` directory.

### Drizzle ORM Required
- **MUST** use Drizzle ORM for all database queries
- **NEVER** use raw SQL queries
- Follow Drizzle's type-safe query patterns

### Data Access Security
**CRITICAL SECURITY REQUIREMENT**:

A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.

- Always filter queries by the current user's ID
- Implement proper authorization checks in all data helper functions
- Validate user ownership before returning any data
- Never return data that doesn't belong to the authenticated user

## Implementation Pattern

```typescript
// Example: /data/user-workouts.ts
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth' // or your auth solution

export async function getUserWorkouts() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, session.user.id))
}
```

```typescript
// Example: Server Component usage
// /src/app/workouts/page.tsx
import { getUserWorkouts } from '@/data/user-workouts'

export default async function WorkoutsPage() {
  const workouts = await getUserWorkouts()

  return (
    <div>
      {workouts.map(workout => (
        <div key={workout.id}>{workout.name}</div>
      ))}
    </div>
  )
}
```

## Why This Approach?

1. **Security**: Server-side data fetching with proper authorization
2. **Performance**: No client-side data fetching waterfalls
3. **SEO**: Fully server-rendered content
4. **Type Safety**: Drizzle ORM provides full TypeScript support
5. **Consistency**: Single pattern for all data access