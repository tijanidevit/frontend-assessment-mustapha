## Q1

The explanation contains some misconceptions. Firstly, `React.memo` does not perform a deep comparison of props, it actually does a shallow comparison by comparing primitive values by value, and objects, arrays and functions by reference. Therefore, recreating the `columns` array on every render produces a new reference, causing the memoization check to fail even if the array contents are identical.

Wrapping `columns` in `useMemo` helps only if it is the sole source of reference instability. It won't fix the issue if other props, such as inline callbacks or newly created objects, also get new references each render.

**Two other common causes that defeat `React.memo`:**

- Inline callback functions created during render.
- Newly created object or array props.

The root cause is the parent's state update (the search input). When state changes, React re-renders the child tree. `React.memo` checks prop references, if any have changed, like a recreated `columns` array, `ProductRow` re-renders.

## Q2

The code has several defects:

- **Missing rollback for optimistic updates** (Highest Severity).
The mutation makes an **optimistic update** using `updateQueryData`, but if the request fails, the optimistic change is never reverted. The patch returned by `updateQueryData` should be rolled back using `patch.undo()` in the `catch` block. Otherwise, users continue seeing the updated status even though the server rejected the change, leaving the UI inconsistent with the backend. This is **the highest severity** because it compromises data integrity and can lead users to make incorrect business decisions.

- **Wrong cache key used in updateQueryData**.
The optimistic update targets `getProducts` with `{}` as `ProductFilters`, which only matches the cache entry for those exact query arguments. Users viewing filtered, searched, or paginated product lists may not see the optimistic update because their cache entry is different.

- **Overly broad cache invalidation**.
Using `invalidatesTags: ['Product']` invalidates every query providing the **Product** tag. Updating one product can unnecessarily refetch multiple product lists, increasing network traffic and reducing performance.

**The false comment is:**

```typescript
// ignore - the invalidation will refetch anyway
```

This is incorrect because invalidatesTags is only applied when the mutation succeeds. If the mutation fails, no refetch occurs, so the optimistic update must be rolled back using patch.undo().

> One thing that looks like a defect but is actually correct is performing `updateQueryData` before awaiting `queryFulfilled`. This is an intentional optimistic update that provides immediate UI feedback. The approach is valid as long as failed requests correctly undo the optimistic change.


## Q3
The fixed code:
```typescript
export function useSupplierName(supplierId: string) {
  const { data, isLoading, isError } = useGetSupplierQuery(supplierId);
  return { name: data?.name ?? '', isLoading, isError };
}

export const SupplierBadge = memo(({ supplierId }: { supplierId: string }) => {
  const { name, isLoading, isError } = useSupplierName(supplierId);
  if (isLoading) return <Skeleton className="h-5 w-24" />;
  if (isError) return null;
  return (
    <span className="rounded bg-muted px-2 py-0.5 text-xs">
      {name.toUpperCase()}
    </span>
  );
});
```

**Explanation**

- **I removed `useState`**, because `name` is derived directly from the query result and duplicating it creates unnecessary state that can become stale.
- **I removed `useEffect`**, because it only copied `data.name` into local state. This added an extra render and introduced a bug where a reused `SupplierBadge` instance could temporarily display the previous supplier's name until the effect ran again. Returning `data?.name` directly keeps a single source of truth and eliminates this stale-state issue.

**I removed `useMemo`**, because `name.toUpperCase()` is a trivial computation. Memoizing it adds overhead without providing a measurable performance benefit.

**The rewrite does not solve the 200-row performance problem.** Rendering one `SupplierBadge` per row still results in up to 200 supplier queries (an N+1 problem). The correct fix belongs in the API level, for example by returning supplier names with the product list or providing a bulk supplier endpoint.