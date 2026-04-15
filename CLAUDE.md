# Conciertos LATAM — Project Documentation

## Overview
Conciertos LATAM is a music/events platform for Latin America. It serves two purposes:
1. **Public platform** — concerts, artists, venues, festivals, news, setlists for fans
2. **Internal operations** — accreditation tracking, team assignment, contacts for the media team

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite 5
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix primitives)
- **State:** TanStack React Query v5 (server state) + React Hook Form + Zod (forms)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Rich text editor:** Tiptap v2 (slash commands, bubble menu, drag & drop images)
- **Email:** Resend (free tier, automated via Edge Function + pg_cron)
- **Brand color:** `#004aad` (bg-brand-blue)

## Project Structure
```
src/
  components/
    admin/           # 73 files — admin panel components
      editor/        # Tiptap editor (toolbar, bubble menu, slash commands)
      news/          # News article editor (form, media, SEO, quality panel)
    ui/              # shadcn/ui components
  hooks/
    admin/           # useRequireAdmin, useNewsArticleQuality
    queries/         # React Query hooks (useAdminNews, useAccreditations, useContacts, etc.)
  pages/             # 38 route pages
    admin/           # NewsArticleEditor, SEOGuide
  services/          # 18 Supabase service classes (newsService, concertService, etc.)
  types/entities/    # TypeScript types derived from Supabase schema
  lib/               # Utilities (slugify, validation schemas, API helpers)
  integrations/      # Supabase client + generated types
supabase/
  functions/         # Edge Functions (notify-deadlines, ai-concert-assistant, spotify, etc.)
  migrations/        # SQL migrations
```

## Admin Architecture
The admin panel has a **portal entry** at `/admin` with two separate modules:

### Gestor de Contenido (`/admin/content`)
- Sidebar: blue (#004aad), defined in `AdminSidebar.tsx`
- Sections: Contenido, Catálogo, Comunidad, Monetización, Integraciones, Configuración
- Manages: news, artists, concerts, festivals, venues, promoters, users, ads, banners, spotify charts, social networks, media, gallery, fan projects, setlists, PWA, traffic

### Operaciones (`/admin/operations`)
- Sidebar: blue (#004aad), defined in `OperationsSidebar.tsx`
- Sections: Overview (Dashboard, Calendar), Gestión (Accreditations, Kanban, Contacts)
- Database tables: `accreditations`, `event_team_assignments`, `contacts`, `notification_log`

### News Article Editor (`/admin/news/new`, `/admin/news/edit/:id`)
- Full-screen page, no sidebar (maximizes writing space)
- Uses `react-hook-form` + `zod` (schema in `newsFormSchema.ts`)
- Tiptap editor with slash commands, bubble menu
- Quality panel with progress bar (word count, meta description, keywords, image, category, author)
- Collapsible sections: images, SEO, relations, gallery

## Key Patterns

### Data Fetching
All data goes through React Query hooks in `src/hooks/queries/`. Services in `src/services/` wrap Supabase calls. Query keys are centralized in `queryKeys.ts`.

### Auth Guard
`useRequireAdmin()` hook verifies admin role. Used by both Admin.tsx and standalone pages (NewsArticleEditor, AdminOperations).

### Forms
Prefer `react-hook-form` + `zod` + shadcn `FormField/FormItem/FormControl`. The news editor uses this pattern. Older admin forms still use manual `useState` — migrate when touching them.

### Accreditation Deadlines
- Concerts: **17 business days** before event (Mon-Fri only)
- Festivals: **30 business days** before event
- Calculated automatically when selecting an event, editable by user
- Email notifications via Resend at **7 days**, **3 days**, and **day of** deadline
- Cron runs daily at 8:00 AM Colombia time (13:00 UTC)

### Database
Supabase types are in `src/integrations/supabase/types.ts` (auto-generated). Extended types with relationships are in `src/types/entities/`. When the generated types are stale (e.g., `featured_image_mobile` not in types), use `as any` cast at the query level, not in components.

## Conventions
- Language: Spanish for all user-facing text (labels, placeholders, toasts)
- Commits: English, conventional commits format
- Components: named exports, one component per file, <300 LOC target
- No comments unless the WHY is non-obvious
- Delete confirmation: always use shadcn `AlertDialog`, never `window.confirm()`
- Dates: always append `T12:00:00` when parsing date-only strings to avoid timezone shift (Colombia is UTC-5)
- Author/team selectors: filter to admin role users only

## Environment Variables
```
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
VITE_SUPABASE_PROJECT_ID   # Project ref ID
SUPABASE_SERVICE_ROLE_KEY  # Service role key (server-side only, never expose to client)
RESEND_API_KEY             # Resend email API key (also set as Supabase secret)
```

## Edge Functions
Deploy with: `npx supabase functions deploy <function-name> --no-verify-jwt`
Set secrets with: `npx supabase secrets set KEY=value`

### notify-deadlines
- Triggered daily by pg_cron or manually via POST
- Checks accreditations in draft/pending status with deadline within 7 days
- Sends email to assigned team members via Resend
- Logs sent notifications to avoid duplicates same day
- From email: `onboarding@resend.dev` (change to custom domain after Resend verification)
