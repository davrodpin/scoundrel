# Islands Context
Client-side interactivity rules.

## Rules
- **Hooks:** Only use standard Preact hooks (`useState`, `useEffect`).
- **State:** Prefer signals (`@preact/signals`) for global/shared state.
- **Restrictions:** Never import `Deno` namespace or server-only modules here.
- **Styling:** Use Tailwind CSS classes exclusively.
