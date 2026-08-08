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


## Q4

**The values actually displayed, in this order:**

```text
idle => saving => idle
```

Although `"saved"` is assigned, it is never painted. `"done"` is never assigned.

**Why some assigned values never appear:**

After the request succeeds, the code executes:

```typescript
setLabel('saved');
setLabel(label === 'saving' ? 'done' : label);
```

The `label` variable is a **stale closure** captured when `onClick` was created, so it still contains `"idle"`, not `"saving"`. Hence, the second call becomes `setLabel('idle')`.

In React 18, both updates occur after `await` in the same async continuation and are **automatically batched**. Since the last state update wins, React only paints `"idle"`, so `"saved"` is never displayed.

**The final displayed value is `idle`.**

The user loses confirmation that the update succeeded because the button returns to its initial state.

**The smallest fix is to remove the final state update:**

```typescript
// Remove this line
setLabel(label === 'saving' ? 'done' : label);
```

This allows the component to correctly display `"saved"` after a successful request and `"failed"` when the request fails.



## Q5

I would place an **API adapter layer** between the API and the application components. The adapter unwraps the API envelope, normalizes backend field names, and exposes a discriminated application-level result:

```typescript
type AppResult<T> =
  | { ok: true; data: T; meta: Meta }
  | { ok: false; error: AppError };

type AppError = {
  code: ErrorCode | string;
  message: string;
  field?: string;
};

function assertNever(value: never): never {
  throw new Error(`Unhandled error code: ${value}`);
}
```

Components then consume `AppResult<T>` rather than parsing `ApiResponse<T>` themselves. The form maps `error.field` to its field, the table shows a toast, and the background poll ignores the error.

**1.**. `if (response.error === null) {}` would be the determinant without the `AppResult` Adapter. But with the `AppResult` Adapter, `ok` is a discriminant. When `result.ok === true`, TypeScript narrows the union to the success branch, so `result.data` is `T`, not `T | null`, without a cast or non-null assertion.

**2.** Known `ErrorCode` values are handled with a `switch` ending in `assertNever(code)`. Adding a new union member makes the remaining `code` no longer `never`, producing a compile-time error.

**3.** Runtime codes can still be unknown because the backend may add new error codes. Therefore the adapter preserves `code` as a string and provides generic fallback handling, ensuring the error reaches the user rather than being swallowed.

**4.** If `error.field` does not match frontend field names, the form cannot attach the error correctly. Ideally the API contract is fixed; otherwise the adapter maps backend field names to canonical frontend names.
