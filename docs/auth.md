# Authentication Standards

This document outlines the coding standards and best practices for authentication in this application.

## Authentication Provider

This application uses **Clerk** for authentication and user management.

## Key Principles

- **Single Source of Truth**: Clerk is the only authentication provider used in this application
- **Server-Side Protection**: Always verify authentication on the server side for protected routes
- **Type Safety**: Use proper TypeScript types for user data and authentication states

## Implementation Standards

### Client Components

```tsx
import { useUser } from "@clerk/nextjs"

export function ProfileComponent() {
  const { user, isLoaded, isSignedIn } = useUser()

  if (!isLoaded) return <div>Loading...</div>
  if (!isSignedIn) return <div>Please sign in</div>

  return <div>Welcome, {user.firstName}!</div>
}
```

### Server Components

```tsx
import { auth } from "@clerk/nextjs/server"

export default async function ProtectedPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Page content for authenticated users
}
```

### Route Protection

Use Clerk's middleware for route-level protection:

```tsx
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})
```

### API Routes

```tsx
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // API logic for authenticated users
}
```

## Required Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## File Organization

- Authentication components: `src/components/auth/`
- Protected pages: Follow standard App Router structure with proper auth checks
- Middleware configuration: `src/middleware.ts`

## Best Practices

1. **Never bypass Clerk**: Do not implement custom authentication logic
2. **Check authentication status**: Always verify `isLoaded` before checking `isSignedIn`
3. **Handle loading states**: Provide appropriate UI while authentication status is being determined
4. **Use proper redirects**: Redirect unauthenticated users to sign-in pages
5. **Protect API routes**: Always verify authentication in API endpoints that require it
6. **Type safety**: Use Clerk's TypeScript types for user objects and auth states