# NOTES.md

## Constraints 1 and 2

I satisfied both requirements by separating the interactive table from the printable table.

The interactive table uses memoized row components (`React.memo`) so rows whose props have not changed do not re-render when the search input changes. I verified this using React DevTools Profiler and render counts. Before optimization, unchanged rows re-rendered during search updates. After optimization, unchanged rows were skipped.

I intentionally did not use virtualization. Virtualization would improve scrolling performance, but it would break browser printing because only visible rows would exist in the DOM. Instead, I created a separate print table that receives the same filtered data and renders every matching row. The tradeoff is a larger DOM size, but 5,000 rows is acceptable for this use case and preserves correct Ctrl-P behavior.

## useEffect justification

I used `useEffect` only for browser and DOM side effects.

One effect registers a global keyboard listener for arrow-key navigation, Enter to open an order, and Escape to close the panel. This requires interacting with the browser event system and cannot be handled during rendering.

The second effect manages focus after the active row changes. The DOM update happens after React commits the state change, so focusing inside the keyboard handler would happen too early. The effect runs after the update and focuses the correct row.

I avoided using effects for derived values such as filtering because those can be calculated directly from current state and URL parameters.

## Decisions

### 1. No virtualization

Alternative rejected: `@tanstack/react-virtual`.

I rejected this because the browser print requirement needs all filtered rows available. Virtualization would be correct if printing was handled separately.

### 2. Separate interactive and print tables

Alternative rejected: one table for both purposes.

The interactive table needs keyboard support and focus management, while the print table only needs complete static output. Separating them reduces complexity.

### 3. URL-based filters

Alternative rejected: React state only.

The URL allows refresh and browser back/forward navigation to preserve the current filtered view.

## Not finished

I did not add automated tests for keyboard navigation and printing behavior. These were manually verified during development.