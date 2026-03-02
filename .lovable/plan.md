

# Enhanced Locations: AI Profiles, Owners, and Rich Detail Pages

## Overview

This plan enriches Caerhold locations with AI-generated profiles (from images), owner assignments (residents who run a location), and richer public detail pages. It mirrors the resident profile generation pattern already in the codebase.

---

## 1. Database Migration

### Expand `caerhold_location_type` enum

Add new values: `cafe`, `restaurant`, `retail`, `civic`, `service`, `entertainment`, `office`

### Add columns to `caerhold_locations`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| is_published | boolean | false | Publish workflow |
| hero_image_url | text | null | Display hero (separate from hero_media_id) |
| ai_status | text | 'idle' | idle / queued / generated / error |
| ai_generated_json | jsonb | null | Raw AI output |
| ai_prompt_version | text | 'loc_v1' | Track prompt version |
| ai_locked_fields | text[] | '{}' | Fields manually edited (skip on regenerate) |
| short_blurb | text | null | 140-char summary |
| category | text | null | cafe/shop/civic/etc (display label) |
| vibe_tags | text[] | null | cozy, modern, etc |
| signature_items | text[] | null | Menu items, products |
| visitor_tips | text[] | null | Tips for visitors |

### New table: `caerhold_location_media`

Multiple images per location (hero selection, AI input).

```text
id           uuid PK
location_id  uuid FK -> caerhold_locations ON DELETE CASCADE
media_id     uuid FK -> caerhold_media ON DELETE CASCADE
sort_order   int default 0
UNIQUE(location_id, media_id)
```

RLS: public SELECT, admin/editor full CRUD.

### New table: `caerhold_location_owners`

Assign residents as owners/managers of a location.

```text
id           uuid PK
location_id  uuid FK -> caerhold_locations ON DELETE CASCADE
resident_id  uuid FK -> caerhold_residents ON DELETE CASCADE
role         text default 'owner'
note         text
created_at   timestamptz
UNIQUE(location_id, resident_id, role)
```

RLS: public SELECT, admin/editor full CRUD.

### Trigger

`update_updated_at_column` on `caerhold_locations` (reuse existing function).

---

## 2. Edge Function: `generate-location-profile`

New edge function modeled on `generate-resident-profile`.

- **Input**: `{ location_id: string }`
- **Flow**:
  1. Verify auth + caerhold admin role
  2. Fetch location + its `caerhold_location_media` images (up to 6)
  3. Set `ai_status = 'processing'`
  4. Call Lovable AI (google/gemini-2.5-flash) with vision + tool calling
  5. Parse structured JSON response
  6. Sanitize strings (reuse existing sanitizer pattern)
  7. Map fields to location columns, respecting `ai_locked_fields`
  8. Set `ai_status = 'generated'`, store raw output in `ai_generated_json`

- **Tool schema** returned by AI:
  - name, category, short_blurb, description, vibe_tags, signature_items, visitor_tips, notable_details, confidence (name/category scores)

- **Prompt**: Municipal tourism directory tone, infer only from visible cues, strict JSON via tool calling. Categories: cafe, restaurant, retail, residential, civic, park, service, landmark, entertainment, office.

- **Config**: `verify_jwt = false` in config.toml (validate in code like existing functions).

---

## 3. TypeScript Types

Update `src/types/caerhold.ts`:

- Update `CaerholdLocationType` to include new enum values
- Add new fields to `CaerholdLocation` interface (is_published, ai_status, short_blurb, category, vibe_tags, signature_items, visitor_tips, hero_image_url, ai_generated_json, ai_locked_fields)
- Add `CaerholdLocationMedia` interface
- Add `CaerholdLocationOwner` interface
- Add `CaerholdLocationInput` updates for new fields

---

## 4. Data Hooks

### New: `src/hooks/caerhold/useCaerholdLocationMedia.ts`
- `useCaerholdLocationMedia(locationId)` -- fetch media for a location
- `useAddLocationMedia()` -- link existing caerhold_media to location
- `useRemoveLocationMedia()` -- unlink
- `useReorderLocationMedia()` -- update sort_order

### New: `src/hooks/caerhold/useCaerholdLocationOwners.ts`
- `useCaerholdLocationOwners(locationId)` -- fetch owners with joined resident data
- `useAddLocationOwner()` -- mutation
- `useRemoveLocationOwner()` -- mutation

### Updated: `useCaerholdLocations.ts`
- Update `mapLocation` to include new fields
- Update create/update mutations to handle new columns
- Add `useGenerateLocationProfile()` mutation (calls edge function)

---

## 5. Admin CMS Changes

### New: Location Editor page (`src/pages/caerhold/admin/LocationEditor.tsx`)

Full edit page (like ResidentEditor) with sections:

- **Core fields**: Name, slug, type, district dropdown, is_published toggle, description, short_blurb, category
- **Media section**: Upload/pick images from caerhold_media, set hero, reorder. Shows grid of attached images.
- **AI Panel**: "Generate from Images" button, status indicator, after generation shows editable fields (category, short_blurb, description, vibe_tags, signature_items, visitor_tips). Tracks locked fields.
- **Owner Panel**: Search/select residents, assign role (owner/co-owner/manager/founder), display owner cards with remove button.
- **Detail fields**: vibe_tags, signature_items, visitor_tips (comma-separated inputs)

### Updated: Admin Locations list (`src/pages/caerhold/admin/Locations.tsx`)
- Add district_id dropdown to create dialog
- Show district badge + published status in table
- Add edit link to new LocationEditor page

### Updated: `src/App.tsx`
- Add route: `caerhold/locations/:id` -> LocationEditor

---

## 6. Public Frontend Updates

### Updated: Locations index (`src/pages/caerhold/Locations.tsx`)
- Show hero image instead of MapPin placeholder
- Add category badge, district badge
- Show owner mini-chip ("Owned by Name")
- Add category filter alongside type filter

### Updated: Location detail page (`src/pages/caerhold/LocationPage.tsx`)
- Hero image section
- Short blurb + full description
- "Visitor Info" blocks: tips, signature items, vibe tags as styled badges
- Owner section with resident card(s) linking to profiles
- Keep existing posts section

---

## 7. Implementation Order

1. Database migration (expand enum, add columns, create tables, RLS)
2. Types update
3. Edge function: generate-location-profile
4. Data hooks (location media, owners, updated locations)
5. Admin LocationEditor page
6. Admin Locations list updates + route
7. Public Locations index upgrade
8. Public LocationPage detail upgrade

---

## 8. RLS Summary

| Table | Public SELECT | Admin CRUD |
|-------|--------------|------------|
| caerhold_location_media | true | is_caerhold_admin_or_editor |
| caerhold_location_owners | true | is_caerhold_admin_or_editor |

Existing `caerhold_locations` policies remain; the `is_published` filter will be added to the public SELECT policy.

