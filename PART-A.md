## Q1

The explanation contains some misconceptions. First of all, `React.memo` does not perform a deep comparison of props, it actually does a shallow comparison by comparing primitive values by value, and objects, arrays and functions by reference. Therefore, recreating the `columns` array on every render produces a new reference, causing the memoization check to fail even if the array contents are identical.

Wrapping `columns` in `useMemo` can help if its changing reference is the only reason `React.memo` cannot bail out. However, it will not necessarily fix the issue if other props, such as inline callback functions (e.g., onClick={() => ...}) or newly created objects/arrays, also receive new references on every render.

**Two other things that commonly defeat `React.memo` are:**

- Inline callback functions created during render.
- Newly created object or array props.

The real cause of the re-render is the parent component's state update (the search input value). The component re-renders when the state is updated. React renders its child tree. React.memo then checks whether it can skip rendering ProductRow. If any prop reference has changed, such as a recreated columns array, React cannot bail out and ProductRow is rendered again.