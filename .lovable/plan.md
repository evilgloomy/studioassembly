

# City of Caerhold - Sandbox Sub-App Implementation Plan

## Overview

This plan implements a fully isolated municipal-style city site with a triggered social content system under `/caerhold`. The core principle is **no tagged media = no posts** and **no auto-publishing ever**. Residents only create posts when admins explicitly tag them in uploaded media.

---

## Architecture Summary

```text
/caerhold (public)                    /caerhold/admin (protected)
+-------------------------+           +---------------------------+
| Homepage                |           | Dashboard                 |
| Feed                    |           | Media Library + Tagging   |
| Residents Directory     |           | Draft Review              |
| Resident Profiles       |           | Residents CRUD            |
| Locations Directory     |           | Locations CRUD            |
| Location Pages          |           | Draft Editor + AI Caption |
+-------------------------+           +---------------------------+
              |                                    |
              +------------------------------------+
                              |
                      Supabase Backend
              +------------------------------------+
              | Schema: public (prefixed tables)   |
              | caerhold_residents                 |
              | caerhold_locations                 |
              | caerhold_media                     |
              | caerhold_media_resident_tags       |
              | caerhold_media_location_tags       |
              | caerhold_posts                     |
              | caerhold_post_media                |
              | caerhold_post_generation_jobs      |
              +------------------------------------+
```

---

## Phase 1: Database Schema

### 1.1 New Role Type
Extend the existing `app_role` enum to include Caerhold-specific roles:

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caerhold_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caerhold_editor';
```

### 1.2 Caerhold Tables (Prefixed in public schema)

| Table | Purpose |
|-------|---------|
| `caerhold_residents` | Character profiles with tone_profile and canon_rules (JSONB) |
| `caerhold_locations` | Places in the city (landmarks, businesses, etc.) |
| `caerhold_media` | Uploaded images/videos with batch tracking |
| `caerhold_media_resident_tags` | Links media to tagged residents (triggers draft creation) |
| `caerhold_media_location_tags` | Links media to locations |
| `caerhold_posts` | Draft/approved/published posts with AI caption support |
| `caerhold_post_media` | Junction table linking posts to media |
| `caerhold_post_generation_jobs` | Idempotency tracking for draft creation |

### 1.3 Key Schema Details

**Residents Table:**
- `slug`, `display_name`, `handle` (e.g. @noah_caldwell)
- `role_title`, `bio`
- `tone_profile` JSONB (voice style, emoji preferences, cadence)
- `canon_rules` JSONB (allowed topics, forbidden claims)
- `posting_enabled` boolean
- `avatar_media_id` references caerhold_media

**Posts Table:**
- `author_type` enum: 'resident' or 'location'
- `resident_id` / `location_id` (one must be set based on author_type)
- `status` enum: 'draft', 'approved', 'scheduled', 'published'
- `caption` (editable), `ai_caption` (AI output), `admin_notes`
- `scheduled_at`, `published_at`
- Constraint: published posts must have `published_at NOT NULL`
- Constraint: posts must have at least one `post_media` row before publishing

**Post Generation Jobs (Idempotency):**
- `job_hash` = SHA256(resident_id + upload_batch_id + location_id or 'none')
- Prevents duplicate drafts when same resident is tagged multiple times

### 1.4 RLS Policies

**Public Access:**
- Read `caerhold_posts` WHERE `status = 'published'`
- Read `caerhold_residents`, `caerhold_locations` (public directory)
- Read `caerhold_media` joined through published posts

**Admin Access (caerhold_admin or caerhold_editor):**
- Full CRUD on all caerhold tables
- Security definer functions:
  - `has_caerhold_role(user_id, role)` - check Caerhold roles
  - `is_caerhold_admin_or_editor(user_id)` - shorthand check

---

## Phase 2: Draft Generation System

### 2.1 Trigger Logic (Database Trigger)
On INSERT into `caerhold_media_resident_tags`:

1. Calculate `job_hash` = SHA256(resident_id || upload_batch_id || COALESCE(location_id, 'none'))
2. Check if job exists in `caerhold_post_generation_jobs`
3. If exists: attach media to existing draft post via `caerhold_post_media`
4. If not exists:
   - Create draft post with `status = 'draft'`
   - Insert job record
   - Link media to post

### 2.2 Location Inference
When tagging a resident:
- Check if the media has exactly one location tag
- If yes: set `location_id` on the draft post
- If multiple or none: leave `location_id` NULL

### 2.3 Grouping Rules
Drafts are grouped by:
- `resident_id` + `upload_batch_id` + optional `location_id`

This ensures multiple photos from the same batch create ONE draft per resident.

---

## Phase 3: Edge Function - AI Caption Generation

### 3.1 Function: `generate-caerhold-caption`

**Input:**
```json
{
  "post_id": "uuid",
  "admin_notes": "optional context"
}
```

**Process:**
1. Authenticate user (require caerhold_admin or caerhold_editor role)
2. Fetch post with resident's tone_profile, canon_rules
3. Fetch tagged location(s) for context
4. Fetch attached media URLs
5. Call Lovable AI with structured prompt:
   - Character voice guidelines
   - Canon restrictions (no new facts)
   - Location context
   - Admin notes
6. Save output to `ai_caption` and copy to `caption`

**Output:**
```json
{
  "ai_caption": "Generated caption text",
  "success": true
}
```

---

## Phase 4: Public Routes and Components

### 4.1 Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/caerhold` | `CaerholdHome` | Municipal homepage with hero, history, attractions |
| `/caerhold/feed` | `CaerholdFeed` | Full feed of published posts (infinite scroll) |
| `/caerhold/residents` | `CaerholdResidents` | Directory with search/filter |
| `/caerhold/residents/:slug` | `CaerholdResidentProfile` | Bio + timeline of posts |
| `/caerhold/locations` | `CaerholdLocations` | Directory filtered by type |
| `/caerhold/locations/:slug` | `CaerholdLocationPage` | Description + tagged posts |

### 4.2 Shared Components

- `CaerholdHeader` - Municipal-style navigation (can optionally share Studio Assembly styles)
- `CaerholdFooter` - City footer with links
- `CaerholdPostCard` - Display component for feed items (avatar, caption, media grid)
- `CaerholdResidentCard` - Card for directory listings
- `CaerholdLocationCard` - Card for location listings
- `CaerholdMediaGrid` - Responsive grid for post media

### 4.3 Layout
- `CaerholdLayout` - Wraps all public pages with Header/Footer
- Uses existing design system (Tailwind, shadcn/ui) but with Caerhold-specific styling

---

## Phase 5: Admin Routes and Components

### 5.1 Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/caerhold/admin` | `CaerholdAdminDashboard` | Drafts needing review, scheduled posts, quick upload |
| `/caerhold/admin/media` | `CaerholdAdminMedia` | Batch upload, gallery, tagging interface |
| `/caerhold/admin/drafts` | `CaerholdAdminDrafts` | List/filter drafts by resident |
| `/caerhold/admin/drafts/:id` | `CaerholdDraftEditor` | Caption editor, AI buttons, publish controls |
| `/caerhold/admin/residents` | `CaerholdAdminResidents` | CRUD residents |
| `/caerhold/admin/residents/:id` | `CaerholdResidentEditor` | Edit resident with tone/canon editors |
| `/caerhold/admin/locations` | `CaerholdAdminLocations` | CRUD locations |
| `/caerhold/admin/locations/:id` | `CaerholdLocationEditor` | Edit location details |

### 5.2 Admin Layout
- `CaerholdAdminLayout` - Sidebar navigation for Caerhold admin
- Protected by `CaerholdProtectedRoute` component
- Checks for `caerhold_admin` or `caerhold_editor` role

### 5.3 Key Admin Features

**Media Upload & Tagging:**
- Batch upload creates unique `upload_batch_id`
- Multi-select residents for tagging
- Single-select primary location
- Shows "Draft created" vs "Draft updated" feedback
- Drafts appear immediately in drafts list

**Draft Editor:**
- Caption text editor
- "Generate Caption" / "Regenerate" buttons
- Admin notes field (context for AI)
- Media preview grid
- Schedule datetime picker
- Approve / Publish Now buttons
- Block publish if zero media attached

**Publish Guards:**
- Cannot publish without media
- Rate limiting: max 1 published post per resident per 24h (configurable)

---

## Phase 6: Hooks and State Management

### 6.1 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useCaerholdAuth` | Check Caerhold-specific roles |
| `useCaerholdResidents` | CRUD operations for residents |
| `useCaerholdLocations` | CRUD operations for locations |
| `useCaerholdMedia` | Upload, list, tag media |
| `useCaerholdPosts` | Post operations (drafts, publishing) |
| `useCaerholdFeed` | Paginated published posts |
| `useCaerholdDrafts` | Admin draft management |

### 6.2 Query Keys
All Caerhold queries prefixed with `['caerhold', ...]` for isolation.

---

## Phase 7: File Organization

```text
src/
├── pages/
│   └── caerhold/
│       ├── Index.tsx              # /caerhold
│       ├── Feed.tsx               # /caerhold/feed
│       ├── Residents.tsx          # /caerhold/residents
│       ├── ResidentProfile.tsx    # /caerhold/residents/:slug
│       ├── Locations.tsx          # /caerhold/locations
│       ├── LocationPage.tsx       # /caerhold/locations/:slug
│       └── admin/
│           ├── Dashboard.tsx      # /caerhold/admin
│           ├── Media.tsx          # /caerhold/admin/media
│           ├── Drafts.tsx         # /caerhold/admin/drafts
│           ├── DraftEditor.tsx    # /caerhold/admin/drafts/:id
│           ├── Residents.tsx      # /caerhold/admin/residents
│           ├── ResidentEditor.tsx # /caerhold/admin/residents/:id
│           ├── Locations.tsx      # /caerhold/admin/locations
│           └── LocationEditor.tsx # /caerhold/admin/locations/:id
├── components/
│   └── caerhold/
│       ├── CaerholdHeader.tsx
│       ├── CaerholdFooter.tsx
│       ├── CaerholdLayout.tsx
│       ├── CaerholdAdminLayout.tsx
│       ├── CaerholdAdminSidebar.tsx
│       ├── CaerholdProtectedRoute.tsx
│       ├── CaerholdPostCard.tsx
│       ├── CaerholdResidentCard.tsx
│       ├── CaerholdLocationCard.tsx
│       ├── CaerholdMediaGrid.tsx
│       ├── CaerholdMediaTagger.tsx
│       └── CaerholdCaptionEditor.tsx
├── hooks/
│   └── caerhold/
│       ├── useCaerholdAuth.ts
│       ├── useCaerholdResidents.ts
│       ├── useCaerholdLocations.ts
│       ├── useCaerholdMedia.ts
│       ├── useCaerholdPosts.ts
│       ├── useCaerholdFeed.ts
│       └── useCaerholdDrafts.ts
└── types/
    └── caerhold.ts               # TypeScript interfaces

supabase/
├── functions/
│   └── generate-caerhold-caption/
│       └── index.ts
└── migrations/
    └── [timestamp]_caerhold_schema.sql
```

---

## Implementation Order

### Batch 1: Foundation
1. Database migration (all tables, RLS, triggers)
2. Security functions for role checking
3. TypeScript types for Caerhold entities
4. Basic hooks skeleton

### Batch 2: Admin Infrastructure
5. CaerholdAdminLayout and CaerholdAdminSidebar
6. CaerholdProtectedRoute component
7. Route configuration in App.tsx
8. Residents CRUD (admin pages + hooks)
9. Locations CRUD (admin pages + hooks)

### Batch 3: Media and Tagging
10. Media upload with batch ID tracking
11. Resident tagging interface (triggers draft creation)
12. Location tagging interface
13. Drafts list page

### Batch 4: Draft Editing and Publishing
14. Draft editor page
15. AI caption edge function
16. Publish flow with guards
17. Rate limiting logic

### Batch 5: Public Pages
18. CaerholdLayout, Header, Footer
19. Homepage
20. Feed (infinite scroll)
21. Residents directory and profile pages
22. Locations directory and detail pages

### Batch 6: Polish
23. Acceptance tests verification
24. Edge cases and error handling
25. Performance optimization (pagination limits, lazy loading)

---

## Technical Constraints

### Non-Negotiable Rules
1. **No posts without media** - Enforced at database level (trigger) and UI level
2. **No auto-publish** - Status can only change to 'published' via explicit admin action
3. **Idempotent draft creation** - Job hash prevents duplicate drafts
4. **Complete isolation** - No reuse of Studio Assembly Journal logic

### Security
- All Caerhold admin routes protected by role check
- RLS policies enforce data access rules
- Edge function validates role before AI generation
- Input validation with Zod on all forms

### Storage
- Caerhold media uses existing `media` bucket with a `caerhold/` prefix path
- Or create dedicated `caerhold-media` bucket (recommended for isolation)

---

## Acceptance Criteria (MVP Done)

1. Upload 5 photos in one batch, tag Resident A on all, system creates 1 draft with all 5 media attached
2. Retag same photo - no duplicate post, draft remains same
3. No resident tag - no drafts created
4. Attempt to publish without media - blocked
5. Public feed shows only published posts
6. Resident profile shows only their published posts
7. Admin can edit caption, approve, schedule, publish
8. No system path can publish automatically without admin action

