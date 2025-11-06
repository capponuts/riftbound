### Riftbound — League of Legends TCG: Portfolio & Collection

Next.js application to manage a trading card collection (OGN/OGS), with an admin page to mark owned/duplicate/foil and a PostgreSQL (Neon) backend.

### Features
- **Binder**: navigate by sets, search by name/number
- **Admin**: manage states (✅ owned, x2 duplicate, ✨ foil) — auto-save
- **Sync**: import from `public/liste.txt` into the `collection` table
- **Audio**: sound effects on selected cards (on detail click)

### Stack
- Next.js 16 (App Router), React 19, Tailwind v4
- PostgreSQL via `pg`

### Local development
```bash
npm ci
npm run dev
```
Open `http://localhost:3000`.

### Environment variables
- `DATABASE_URL` (PostgreSQL, e.g., Neon, with `sslmode=require`)
  - Example: `postgresql://user:pass@host/neondb?sslmode=require`
- `ADMIN_PASSWORD` (admin password)
- `ADMIN_SESSION_SECRET` (HMAC secret to sign the session cookie)

### Database
The schema is created on demand by `ensureSchema()` when you call an API (e.g., `/api/admin/ping`).

- Table: `collection(name text, number text, owned boolean, duplicate boolean, foil boolean, updated_at timestamptz)` with PK `(name, number)`.
- Import list: `POST /api/admin/sync` reads `public/liste.txt` and upserts each entry.

### Administration
- Access: `/admin` (protected by middleware)
- Login: `/admin/login` — password is read from `ADMIN_PASSWORD` (dev fallback `0806`)
- Session cookie: `admin_session` (HMAC-signed) with `ADMIN_SESSION_SECRET` (HttpOnly, SameSite=Lax)
- Admin loads rows via `GET /api/collection/rows` and applies changes via `PATCH /api/collection`.

### Useful endpoints
- `GET /api/admin/ping` — DB connectivity and schema creation
- `POST /api/admin/sync` — import/update the public list into `collection`
- `GET /api/collection/rows` — raw rows (admin)
- `GET /api/collection` — map `{ "name|||number": { owned, duplicate, foil } }` (binder frontend)
- `PATCH /api/collection` — upsert a card state

### Sounds (public/sounds)
- OGN-307 → `/sounds/teemo.ogg`
- OGN-308 → `/sounds/viktor.ogg`
- OGN-309 → `/sounds/missf.ogg`
- OGN-310 → `/sounds/sett.ogg`

### Code structure
- `src/app/` — pages (binder `/`, admin `/admin`, API `/api/*`)
- `src/components/` — UI components (e.g., `Binder.tsx`)
- `src/lib/db.ts` — PostgreSQL connection and `ensureSchema`
- `public/liste.txt` — import source for sync

### Deployment
- Set `DATABASE_URL` on your hosting provider (e.g., Vercel)
- Build: `npm run build`, Start: `npm start`

### Notes
- Minimal admin auth with a signed cookie; set a strong `ADMIN_SESSION_SECRET` in production.
