# Routes Context
Server-side route handlers and page rendering.

## Rules

### Handlers
- Use `define.handlers()` and `define.page()` from `@/utils.ts` for typing
- Handlers must not contain business logic — delegate to `lib/` modules
- Keep handlers thin: validate input, call a `lib/` module, return the response
- Data fetching (DB queries via Prisma) belongs in the handler, not in JSX

### Pages
- Use `define.page()` for page components
- Pages receive data from handlers via `ctx` — no direct data fetching in JSX
- Use Tailwind CSS classes for styling

### Security
- CSRF protection is mandatory for all state-changing routes (POST, PUT, PATCH, DELETE)

### API Routes
- See `routes/api/CLAUDE.md` for API-specific conventions
