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


## Q6

I would **not accept the virtualization proposal as the primary fix** because it breaks two existing warehouse workflows.

Virtualization renders only the rows near the viewport. Therefore, **Ctrl-F may not find an order that is outside the rendered DOM**, even though it exists in the filtered dataset. It also makes **Ctrl-P unreliable**, because the complete filtered list is not necessarily present in the DOM for printing. Both regressions affect warehouse staff who rely on browser search and printed lists.

I would first profile the six-second delay to identify whether the bottleneck is data fetching, rendering, expensive row work, or unnecessary re-renders. I would then optimize the existing table without removing the complete searchable/printable dataset from the DOM where required.

For printing, I would separate printing from screen rendering: preserve the current filters and have a dedicated print/export path request the **complete filtered result from the backend** and generate a PDF/print document containing all matching orders.

The cost is additional engineering and backend work, plus maintaining a separate print representation. However, this preserves the warehouse's existing Ctrl-F and printing workflows while allowing us to optimize the interactive table based on the actual bottleneck.


## Q7

I would choose **(b) Fix the three forms**.

The forms silently discarding user input after server-side validation fails is a **data-loss bug**. It directly destroys user work and can cause users to abandon or incorrectly resubmit their data and can lead to frustration. With only two working days, fixing three forms is also a bounded, achievable change.

The table's **~4-second freeze remains broken** because I am not choosing virtualization. That is a performance problem, but it does not destroy user data.

I would tell the person requesting virtualization:

> “I’m prioritizing the form data-loss issue for the supplier demo because it causes users to lose their work. I’ll address the virtualization work after the demo.”



## Q8

There is **one definite conflict: requirements 4 and 5**.

**4 + 5 — API limit vs. atomicity:** If more than 500 products are selected, the API cannot process them in one request. Splitting the operation into multiple requests could allow one batch to succeed while another fails, violating the **atomicity requirement**. I would keep **#5**, atomicity protects data consistency during a bulk price change.

**Ticket:** “Bulk price updates must remain atomic for selections above 500 products. Provide a server-side mechanism that supports the complete selection atomically.”

**Business question:** “Is all-or-nothing behavior mandatory above 500 selected products?”


**2 + 3 appears contradictory**

If the current filter matches a very large number of products, #2 requires selecting products that have not been loaded into the client, while #3 requires displaying the exact list of affected SKUs before confirmation. Satisfying #3 literally could require fetching and rendering thousands of SKUs solely for confirmation, creating a potentially impractical and slow confirmation step.

I would keep: #2, because selecting every product matching the current filter is the core bulk-selection requirement.

**Ticket:** Replace the exact-list requirement with a scalable confirmation showing the total affected count and filter criteria.

**5 + 6 appears contradictory**, because reporting individual successes and failures suggests partial success. However, they can both be true: with atomicity, the toast can report `100 succeeded, 0 failed` or `0 succeeded, 100 failed`. It only becomes contradictory if requirement 6 means partial success must be possible. I would clarify that interpretation rather than assume a conflict.


## Q9

1. **`FilterBar.tsx` — `clear()` violates AC-2.** `window.location.href = '/products'` causes a full page reload, directly contradicting the requirement that clearing returns to the unfiltered state without one. Replace it with state/query updates that trigger the unfiltered query without navigation.

2. **`FilterBar.tsx` — AC-1 cannot be verified from this diff alone.** The UI now stores `suppliers: string[]`, but the diff does not show whether the query type, serialization, and API actually accept multiple suppliers. Verify the `Filters` type, request serialization, and API behavior with a multi-supplier test.

3. **`FilterBar.tsx` — individual selections cannot be removed.** Once a supplier is added, there is no way to remove only that supplier. Add a removal mechanism so users can revise a multi-supplier selection without clearing everything.

4. **`useProducts.ts` — unrelated refetch behavior.** `refetchOnMountOrArgChange: true` is unrelated to either AC and changes query behavior. Remove it or justify it against a specific bug in a separate change.

5. **Scope — unrelated refactoring.** The controlled-component conversion and date-helper extraction are outside this ticket. Split them into separate changes so this PR remains focused and independently reversible.

**Deliberately not commented on:** autocomplete and duplicate prevention, because neither is explicitly required by the two acceptance criteria.

**Acceptance criteria:** AC-1 **cannot be confirmed from the diff alone**; I would inspect the API contract and test multiple suppliers. AC-2 **is not met** because `clear()` performs a full page reload.
