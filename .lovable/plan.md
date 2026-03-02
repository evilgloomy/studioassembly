

## Plan: Add Avatar Images and Resident Tags to the Residents Directory

### 1. Show Avatar Images on Resident Cards

The `useCaerholdResidents` hook already fetches `avatar_url` from the database. The Residents listing page currently shows a placeholder circle with the resident's initial. We'll replace this with the actual avatar image when available, falling back to the initial.

**File: `src/pages/caerhold/Residents.tsx`**
- Import `Avatar`, `AvatarImage`, `AvatarFallback` from the existing UI components
- Replace the plain `div` circle with an `Avatar` component that shows the resident's portrait image (using `avatar_url`)
- Apply the same `scale-[2]` zoom technique used on the profile page so the minifig fills the circular frame
- Keep the initial letter as fallback for residents without an avatar

### 2. Create a Resident Tags System

Add a new `caerhold_resident_tags` table to allow tagging residents with searchable labels (e.g., "baker", "parent", "council member", "park district").

**Database Migration:**
- Create `caerhold_resident_tag_definitions` table (id, name, slug, color, created_at) for the tag library
- Create `caerhold_resident_tag_assignments` junction table (id, resident_id, tag_definition_id) linking residents to tags
- Add RLS: public SELECT on both tables, admin/editor full access
- Add unique constraints on slug and on the resident+tag pair

**Data Hook: `src/hooks/caerhold/useCaerholdResidentTags.ts`**
- Fetch all tag definitions
- Fetch tags for a specific resident
- CRUD mutations for tag definitions and assignments

**Residents List Page Updates (`src/pages/caerhold/Residents.tsx`):**
- Fetch resident tags alongside residents
- Display tag badges on each resident card below the bio
- Extend the search filter to also match against tag names
- Add clickable tag filter chips above the grid so users can filter by tag

**Admin Resident Editor Updates (`src/pages/caerhold/admin/ResidentEditor.tsx`):**
- Add a tags section where admins can assign/remove tags from a resident
- Allow creating new tags inline

### Technical Details

**Migration SQL:**
```sql
CREATE TABLE public.caerhold_resident_tag_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text DEFAULT '#4a7c59',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.caerhold_resident_tag_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags publicly viewable" ON public.caerhold_resident_tag_definitions
  FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON public.caerhold_resident_tag_definitions
  FOR ALL USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE TABLE public.caerhold_resident_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  tag_definition_id uuid NOT NULL REFERENCES public.caerhold_resident_tag_definitions(id) ON DELETE CASCADE,
  UNIQUE(resident_id, tag_definition_id)
);

ALTER TABLE public.caerhold_resident_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments publicly viewable" ON public.caerhold_resident_tag_assignments
  FOR SELECT USING (true);
CREATE POLICY "Admins manage assignments" ON public.caerhold_resident_tag_assignments
  FOR ALL USING (is_caerhold_admin_or_editor(auth.uid()));
```

**Query approach for the list page:**
- The `useCaerholdResidents` query will be updated to join through the assignment table to fetch tags inline, keeping it to a single query
- Alternatively, a separate lightweight query fetches all assignments + definitions and merges client-side (simpler, avoids complex join syntax in Supabase JS)

**Files to create/modify:**
1. **Database migration** -- new tables + RLS
2. **`src/hooks/caerhold/useCaerholdResidentTags.ts`** -- new hook file
3. **`src/pages/caerhold/Residents.tsx`** -- avatar images + tag display + tag filtering
4. **`src/pages/caerhold/admin/ResidentEditor.tsx`** -- tag management UI for admins

