# Server Components Standards

This document outlines the coding standards and patterns for Server Components in this Next.js 15 application.

## Next.js 15 Breaking Changes

### Async Params Requirement

**CRITICAL**: In Next.js 15, all `params` and `searchParams` are now Promises and MUST be awaited in Server Components.

This is a breaking change from previous versions where params were synchronous objects.

## Server Components Params Pattern

### ✅ Correct Implementation

```typescript
// Server Component - params MUST be awaited
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function ServerPage({ params, searchParams }: PageProps) {
  // MUST await params and searchParams
  const { id } = await params;
  const { filter } = await searchParams;

  // Use the resolved values
  const data = await getData(id, filter);

  return (
    <div>
      <h1>Item {id}</h1>
      {data && <ItemDetails data={data} />}
    </div>
  );
}
```

### ❌ Incorrect Implementation

```typescript
// DON'T DO THIS - Will cause runtime errors in Next.js 15
export default async function ServerPage({ params }: PageProps) {
  // ❌ Direct access without await - WILL FAIL
  const data = await getData(params.id);

  return <div>{data}</div>;
}
```

## Client Components Params Pattern

### ✅ Correct Implementation

Client Components must use `React.use()` to unwrap Promise params:

```typescript
'use client';

import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientPage({ params }: PageProps) {
  // MUST use React.use() to unwrap Promise
  const { id } = use(params);

  // Use the resolved value
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData(id).then(setData);
  }, [id]);

  return <div>Item {id}</div>;
}
```

### ❌ Incorrect Implementation

```typescript
'use client';

// DON'T DO THIS
export default function ClientPage({ params }: PageProps) {
  // ❌ Direct access without use() - WILL FAIL
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData(params.id).then(setData); // Runtime error
  }, [params.id]);

  return <div>{data}</div>;
}
```

## Type Definitions

### Server Components

```typescript
interface ServerPageProps {
  params: Promise<{
    id: string;
    slug?: string;
  }>;
  searchParams: Promise<{
    filter?: string;
    page?: string;
  }>;
}
```

### Client Components

```typescript
interface ClientPageProps {
  params: Promise<{
    id: string;
    slug?: string;
  }>;
}
```

## Migration from Pre-Next.js 15

### Before (Next.js 14 and earlier)

```typescript
// Old synchronous pattern
interface PageProps {
  params: { id: string };          // Synchronous object
  searchParams: { filter: string }; // Synchronous object
}

export default async function Page({ params, searchParams }: PageProps) {
  const data = await getData(params.id, searchParams.filter);
  return <div>{data}</div>;
}
```

### After (Next.js 15+)

```typescript
// New asynchronous pattern
interface PageProps {
  params: Promise<{ id: string }>;          // Promise
  searchParams: Promise<{ filter: string }>; // Promise
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { filter } = await searchParams;

  const data = await getData(id, filter);
  return <div>{data}</div>;
}
```

## Error Handling

### Server Components

```typescript
export default async function ServerPage({ params }: PageProps) {
  try {
    const { id } = await params;

    if (!id) {
      return <div>Invalid ID</div>;
    }

    const data = await getData(id);
    return <DataDisplay data={data} />;
  } catch (error) {
    console.error('Error resolving params:', error);
    return <div>Error loading page</div>;
  }
}
```

### Client Components

```typescript
'use client';

import { use } from 'react';

export default function ClientPage({ params }: PageProps) {
  try {
    const { id } = use(params);

    return <div>Item {id}</div>;
  } catch (error) {
    console.error('Error resolving params:', error);
    return <div>Error loading page</div>;
  }
}
```

## Common Patterns

### 1. Multiple Dynamic Segments

```typescript
interface PageProps {
  params: Promise<{
    category: string;
    productId: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { category, productId } = await params;

  const product = await getProduct(category, productId);
  return <ProductDetails product={product} />;
}
```

### 2. Optional Segments

```typescript
interface PageProps {
  params: Promise<{
    slug: string[];  // Catch-all routes
  }>;
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;

  // slug is an array: ['category', 'subcategory', 'item']
  const [category, subcategory, item] = slug || [];

  return <Navigation category={category} subcategory={subcategory} item={item} />;
}
```

### 3. Combined Params and SearchParams

```typescript
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    sort?: 'asc' | 'desc';
    page?: string;
  }>;
}

export default async function DetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'overview', sort = 'asc', page = '1' } = await searchParams;

  const data = await getDetailData({
    id,
    tab,
    sort,
    page: parseInt(page, 10),
  });

  return <DetailView data={data} currentTab={tab} />;
}
```

## Parallel Awaiting

For better performance, you can await params and searchParams in parallel:

```typescript
export default async function OptimizedPage({ params, searchParams }: PageProps) {
  // Await both promises in parallel
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const { id } = resolvedParams;
  const { filter } = resolvedSearchParams;

  const data = await getData(id, filter);
  return <DataDisplay data={data} />;
}
```

## Layout Components

Layout components also receive async params:

```typescript
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}

export default async function CategoryLayout({ children, params }: LayoutProps) {
  const { category } = await params;

  const categoryData = await getCategoryData(category);

  return (
    <div>
      <CategoryHeader category={categoryData} />
      {children}
    </div>
  );
}
```

## Best Practices

1. **Always Type Params as Promises**: Never assume params are synchronous objects
2. **Destructure After Awaiting**: Always await first, then destructure
3. **Handle Missing Params**: Check for undefined values after destructuring
4. **Use Parallel Awaiting**: When possible, await multiple promises concurrently
5. **Error Boundaries**: Wrap param resolution in try-catch blocks
6. **Consistent Patterns**: Use the same patterns across all components in the project

## Anti-Patterns to Avoid

### ❌ Don't Access Params Directly

```typescript
// DON'T DO THIS
export default async function BadPage({ params }: PageProps) {
  const data = await getData(params.id); // Will cause runtime error
  return <div>{data}</div>;
}
```

### ❌ Don't Mix Async/Sync Patterns

```typescript
// DON'T DO THIS
interface InconsistentProps {
  params: { id: string };        // Sync (wrong for Next.js 15)
  searchParams: Promise<{ q: string }>; // Async (correct)
}
```

### ❌ Don't Forget React.use() in Client Components

```typescript
'use client';

// DON'T DO THIS
export default function BadClientPage({ params }: PageProps) {
  useEffect(() => {
    // params.id will be undefined/cause errors
    fetchData(params.id);
  }, [params.id]);

  return <div>...</div>;
}
```

## Migration Checklist

When upgrading to Next.js 15:

- [ ] Update all `params` type definitions to `Promise<{}>`
- [ ] Update all `searchParams` type definitions to `Promise<{}>`
- [ ] Add `await` before all `params` access in Server Components
- [ ] Add `await` before all `searchParams` access in Server Components
- [ ] Import and use `React.use()` for Client Components accessing params
- [ ] Update all useEffect dependencies that reference params
- [ ] Test all dynamic routes to ensure they work correctly
- [ ] Update any middleware or API routes that access params

## Related Documentation

- [Data Fetching Guidelines](./data-fetching.md)
- [UI Coding Standards](./ui.md)
- [Data Mutations](./data-mutations.md)