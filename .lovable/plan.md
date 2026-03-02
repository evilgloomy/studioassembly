

# Phase 1: Districts, Connections, and Enhanced Welcome Page

## Overview

This plan adds districts as a geographic layer, resident connections, an interactive map page, and upgrades the Caerhold welcome page with stats, featured content, and district navigation. All new tables use the `caerhold_` prefix to match existing conventions.

---

## 1. Database Migration

A single migration creates all new tables and alters existing ones.

### New Tables

**`caerhold_districts`**
- id, slug (unique), name, tagline, description, hero_image_url, sort_order, is_published, map_hotspot (jsonb, nullable), created_at, updated_at
- Indexes on sort_order and is_published
- RLS: public SELECT where is_published = true, full CRUD for caerhold admins/editors

**`caerhold_resident_connections`**
- id, resident_id (FK -> caerhold_residents), connected_resident_id (FK -> caerhold_residents), relation_type (text, default 'friend'), note (text), created_at
- Unique constraint on (resident_id, connected_resident_id)
- Indexes on both resident columns
- RLS: public SELECT (for published residents), full CRUD for caerhold admins/editors

**`caerhold_site_settings`**
- key (text, primary key), value (jsonb), updated_at
- RLS: public SELECT, admin/editor full CRUD
- Used to store `caerhold_welcome` config: featured_district_ids, featured_post_ids, map_image_url

### Altered Tables

**`caerhold_locations`** -- add column:
- `district_id` uuid (FK -> caerhold_districts, ON DELETE SET NULL, nullable)
- Index on district_id

**`caerhold_residents`** -- add columns:
- `home_district_id` uuid (FK -> caerhold_districts, ON DELETE SET NULL, nullable)
- `primary_work_location_id` uuid (FK -> caerhold_locations, ON DELETE SET NULL, nullable)
- Indexes on both new columns

### Trigger
- `update_updated_at_column` trigger on `caerhold_districts` (reuses existing function)

---

## 2. TypeScript Types

**`src/types/caerhold.ts`** -- add:
- `CaerholdDistrict` interface (matching new table)
- `CaerholdDistrictInput` interface
- `CaerholdResidentConnection` interface
- `CaerholdSiteSettings` interface
- Update `CaerholdResident` to include `home_district_id`, `primary_work_location_id`
- Update `CaerholdLocation` to include `district_id`
- Add `CaerholdResidentWithDistrict` extended type

---

## 3. Data Hooks (new files)

### `src/hooks/caerhold/useCaerholdDistricts.ts`
- `useCaerholdDistricts()` -- fetch all published districts ordered by sort_order
- `useCaerholdDistrict(slug)` -- single district by slug
- `useCreateCaerholdDistrict()` -- mutation
- `useUpdateCaerholdDistrict()` -- mutation
- `useDeleteCaerholdDistrict()` -- mutation

### `src/hooks/caerhold/useCaerholdConnections.ts`
- `useCaerholdResidentConnections(residentId)` -- fetch connections with joined resident data
- `useCreateConnection()` -- mutation
- `useDeleteConnection()` -- mutation

### `src/hooks/caerhold/useCaerholdSiteSettings.ts`
- `useCaerholdSiteSettings(key)` -- fetch settings by key
- `useUpdateCaerholdSiteSettings()` -- upsert mutation

### Updated hooks
- **`useCaerholdResidents.ts`** -- update `mapResident` and queries to join `home_district:caerhold_districts(*)` and `work_location:caerhold_locations(*)`
- **`useCaerholdLocations.ts`** -- update queries to join `district:caerhold_districts(*)`, add `useCaerholdLocationsByDistrict(districtId)`

---

## 4. Admin CMS Pages

### New: `src/pages/caerhold/admin/Districts.tsx`
- Table listing all districts with name, tagline, sort_order, published status
- Create dialog (name, slug, tagline, description, hero_image_url, sort_order, is_published)
- Delete with confirmation
- Edit link to district editor

### New: `src/pages/caerhold/admin/DistrictEditor.tsx`
- Full edit form: slug, name, tagline, description, hero_image_url, sort_order, is_published
- Map hotspot editor: simple form fields for rect (x, y, w, h) stored as JSON
- Publish/unpublish toggle

### New: `src/pages/caerhold/admin/WelcomeConfig.tsx`
- Select featured districts (multi-select from published districts)
- Select featured posts (multi-select from published posts)
- Set map image URL
- Saves to `caerhold_site_settings` with key `caerhold_welcome`

### Updated: `src/pages/caerhold/admin/Locations.tsx`
- Add `district_id` dropdown to the create dialog
- Show district badge in the table

### Updated: `src/pages/caerhold/admin/ResidentEditor.tsx`
- Add `home_district_id` dropdown (in Identity or Lore section)
- Add `primary_work_location_id` dropdown
- Add Connections section: pick resident + relation_type + optional note, list existing connections with delete

### Updated: `src/components/admin/AdminSidebar.tsx`
- Add "Districts" nav item under Caerhold section
- Add "Welcome Config" nav item

---

## 5. Frontend Public Pages

### New Routes (added to App.tsx)
- `/caerhold/map` -- MapPage
- `/caerhold/districts` -- DistrictsIndex
- `/caerhold/districts/:slug` -- DistrictDetail

### New: `src/pages/caerhold/Map.tsx`
- Renders map image from site settings
- Overlays clickable hotspots from `caerhold_districts.map_hotspot`
- Each hotspot is an absolutely-positioned div using normalized coordinates (x*100%, y*100%, w*100%, h*100%)
- onClick navigates to `/caerhold/districts/:slug`
- Responsive: container is position:relative, image fills width

### New: `src/pages/caerhold/Districts.tsx`
- Grid of district cards (hero image + name + tagline)
- Links to `/caerhold/districts/:slug`

### New: `src/pages/caerhold/DistrictDetail.tsx`
- Hero section with district image, name, tagline, description
- Locations grid: locations where district_id matches
- Featured residents: residents where home_district_id matches
- "More coming soon" fallback if no locations/residents yet

### Updated: `src/pages/caerhold/Index.tsx` (Welcome page)
- **StatsBar**: counts of residents, locations, districts, posts (simple count queries)
- **Featured Districts grid**: from site settings or top N by sort_order
- **Featured Stories**: 3 post cards from site settings or latest published
- **Map preview**: small map image linking to /caerhold/map
- Keep existing hero + about sections, integrate new sections below

### Updated: `src/pages/caerhold/ResidentProfile.tsx`
- Add "Lives in" district link (if home_district_id set)
- Add "Works at" location link (if primary_work_location_id set)
- Add Connections section: chips/cards showing connected residents with relation type, linking to their profiles
- Add Appearances grid: post media images from this resident's published posts (already have `useCaerholdResidentPosts`)

### Updated: `src/components/caerhold/CaerholdHeader.tsx`
- Add "Map" and "Districts" to navigation links

---

## 6. New Components

### `src/components/caerhold/StatsBar.tsx`
- Displays 3-4 stat cards (residents, locations, districts, stories)
- Each stat shows count + label

### `src/components/caerhold/DistrictCard.tsx`
- Reusable card: hero image, name, tagline
- Used in welcome page and districts index

### `src/components/caerhold/FeaturedStories.tsx`
- Horizontal row of 3 post cards with image, caption excerpt, resident name

### `src/components/caerhold/MapHotspotImage.tsx`
- Renders map image with overlay hotspots
- Props: imageUrl, districts (with map_hotspot data)
- Reused on Map page and optionally on welcome page

### `src/components/caerhold/ResidentConnectionCard.tsx`
- Small card/chip showing connected resident avatar, name, relation type

---

## 7. Implementation Order

1. **Database migration** -- create all tables, alter existing ones, add RLS + indexes
2. **Types update** -- add new interfaces to caerhold.ts
3. **Data hooks** -- districts, connections, site settings (new files), update existing hooks
4. **Admin sidebar** -- add Districts + Welcome Config nav items
5. **Admin districts** -- list + editor pages
6. **Admin updates** -- location editor (district dropdown), resident editor (district + work location + connections)
7. **Admin welcome config** -- featured content picker
8. **Frontend components** -- StatsBar, DistrictCard, MapHotspotImage, FeaturedStories, ResidentConnectionCard
9. **Frontend pages** -- Districts index, District detail, Map page
10. **Welcome page upgrade** -- integrate StatsBar, featured districts, featured stories, map preview
11. **Resident profile upgrade** -- lives in, works at, connections, appearances
12. **Header update** -- add Map + Districts links
13. **Routes** -- register new routes in App.tsx

---

## 8. RLS Summary

| Table | Public SELECT | Admin CRUD |
|-------|--------------|------------|
| caerhold_districts | WHERE is_published = true | is_caerhold_admin_or_editor |
| caerhold_resident_connections | true (or via published residents) | is_caerhold_admin_or_editor |
| caerhold_site_settings | true | is_caerhold_admin_or_editor |

All policies use the existing `is_caerhold_admin_or_editor(auth.uid())` security definer function, matching the pattern of every other `caerhold_*` table.

