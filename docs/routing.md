# Routing Standards

This document outlines the routing architecture and standards for the lifting diary application.

## Route Structure

All application routes should be accessed via the `/dashboard` prefix:

```
/dashboard           - Main dashboard page
/dashboard/workout   - Workout-related pages
/dashboard/profile   - User profile pages
/dashboard/settings  - Application settings
```

## Route Protection

### Protected Routes

All routes under `/dashboard` and its sub-pages are protected routes that require user authentication. These routes should only be accessible to logged-in users.

### Middleware Implementation

Route protection must be implemented using Next.js middleware (`middleware.ts` at the project root):

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Check authentication status
  // Redirect to login if not authenticated
  // Allow access if authenticated
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### Key Requirements

1. **Authentication Check**: Middleware must verify user authentication status
2. **Redirect Logic**: Unauthenticated users should be redirected to login
3. **Path Matching**: Use matcher pattern `/dashboard/:path*` to protect all dashboard routes
4. **Session Validation**: Validate session tokens or authentication cookies

## Route Conventions

- Use kebab-case for route segments: `/dashboard/workout-history`
- Organize related functionality under common prefixes
- Keep URLs semantic and user-friendly
- Use dynamic routes with brackets: `/dashboard/workout/[workoutId]`

## Error Handling

- Implement proper error pages for protected routes
- Handle authentication failures gracefully
- Provide clear messaging for access denied scenarios