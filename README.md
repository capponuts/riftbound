### Riftbound — League of Legends TCG: Portfolio & Collection

Application Next.js pour gérer une collection de cartes (OGN/OGS), avec page admin pour marquer possédé/doublon/foil et synchronisation avec une base PostgreSQL (Neon).

### Fonctionnalités
- **Binder**: navigation par sets, recherche par nom/numéro
- **Admin**: gestion des états (✅ possédé, x2 doublon, ✨ foil) — enregistrement auto
- **Sync**: import depuis `public/liste.txt` vers la table `collection`
- **Audio**: effets sonores sur certaines cartes (clic détaillé)

### Stack
- Next.js 16 (App Router), React 19, Tailwind v4
- PostgreSQL via `pg`

### Démarrage local
```bash
npm ci
npm run dev
```
Ouvrir `http://localhost:3000`.

### Variables d’environnement
- `DATABASE_URL` (PostgreSQL, ex. Neon, avec `sslmode=require`)
  - Exemple: `postgresql://user:pass@host/neondb?sslmode=require`
- `ADMIN_PASSWORD` (mot de passe admin)
- `ADMIN_SESSION_SECRET` (secret HMAC pour signer le cookie de session)

### Base de données
Le schéma est créé à la volée via `ensureSchema()` lorsque vous appelez une API (ex: `/api/admin/ping`).

- Table: `collection(name text, number text, owned boolean, duplicate boolean, foil boolean, updated_at timestamptz)` avec PK `(name, number)`.
- Import de la liste: `POST /api/admin/sync` lit `public/liste.txt` et upsert chaque entrée.

### Administration
- Accès: `/admin` (protégé par middleware)
- Login: `/admin/login` — mot de passe lu depuis `ADMIN_PASSWORD` (fallback dev `0806`)
- Cookie: `admin_session` signé (HMAC) avec `ADMIN_SESSION_SECRET` (HttpOnly, SameSite=Lax)
- L’admin charge les lignes via `GET /api/collection/rows` et applique les changements via `PATCH /api/collection`.

### Endpoints utiles
- `GET /api/admin/ping` — test connexion DB et création schéma
- `POST /api/admin/sync` — import/maj de la liste publique dans `collection`
- `GET /api/collection/rows` — lignes brutes (pour l’admin)
- `GET /api/collection` — map `{ "name|||number": { owned, duplicate, foil } }` (pour le front binder)
- `PATCH /api/collection` — upsert d’un état de carte

### Sons (public/sounds)
- OGN-307 → `/sounds/teemo.ogg`
- OGN-308 → `/sounds/viktor.ogg`
- OGN-309 → `/sounds/missf.ogg`
- OGN-310 → `/sounds/sett.ogg`

### Structure du code
- `src/app/` — pages (binder `/`, admin `/admin`, API `/api/*`)
- `src/components/` — composants UI (ex. `Binder.tsx`)
- `src/lib/db.ts` — connexion PostgreSQL et `ensureSchema`
- `public/liste.txt` — source d’import pour la synchro

### Déploiement
- Définir `DATABASE_URL` sur l’hébergeur (ex. Vercel)
- Build: `npm run build`, Start: `npm start`

### Notes
- Auth admin minimaliste avec cookie signé; changez `ADMIN_SESSION_SECRET` en prod.
