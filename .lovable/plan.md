

# Resident Auto-Profile From Minifig Photo (V1)

## Overview

Add an admin workflow where uploading minifig portrait photos triggers AI image analysis to auto-generate draft resident profiles. Admins review, edit, and publish these profiles before they become visible publicly.

---

## Phase 1: Database Schema Changes

### 1.1 New Table: `caerhold_resident_profile_jobs`

Tracks idempotent AI generation jobs per media item.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| job_hash | text UNIQUE NOT NULL | sha256(media_id) |
| upload_batch_id | uuid NOT NULL | |
| media_id | uuid NOT NULL | FK to caerhold_media |
| status | text NOT NULL | 'queued', 'processing', 'complete', 'failed' |
| result_resident_id | uuid NULLABLE | FK to caerhold_residents |
| raw_model_output | jsonb | Default '{}' |
| error_message | text | Default '' |
| created_by | uuid NOT NULL | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Only caerhold_admin/caerhold_editor can read/write.

### 1.2 Extend `caerhold_residents` Table

Add new columns:

| Column | Type | Notes |
|--------|------|-------|
| first_name | text NULLABLE | |
| last_name | text NULLABLE | |
| personality | jsonb | Default '{}' - traits, quirks, values |
| lore_hooks | jsonb | Default '{}' - home district, affiliations, motifs |
| profile_status | text NOT NULL | Default 'draft' - 'draft' or 'published' |
| source_media_id | uuid NULLABLE | Portrait source reference |

### 1.3 Update Public Residents RLS

Change the public SELECT policy on `caerhold_residents` from `true` to `profile_status = 'published' OR is_caerhold_admin_or_editor(auth.uid())` so draft residents are hidden from public view.

---

## Phase 2: Edge Function - `generate-resident-profile`

### Purpose
Accepts a media ID (with its public URL), sends the image to AI for analysis, and returns a structured resident profile JSON.

### Flow
1. Authenticate caller (require caerhold_admin or caerhold_editor role)
2. Fetch the media record to get the public_url
3. Update job status to 'processing'
4. Call Lovable AI (google/gemini-3-flash-preview) with the image URL and a structured prompt
5. Use tool calling to extract the structured JSON output (first_name, last_name, handle, occupation, bio, tone_profile, personality, lore_hooks, canon_rules)
6. Create a draft resident record with all generated fields + source_media_id + avatar_media_id
7. Update the job with result_resident_id and raw_model_output
8. Return the generated profile

### Prompt Constraints (enforced in system prompt)
- No real-person claims
- No illegal/sexual/violent content
- Municipal + wholesome city life tone
- Only infer from visible design cues in the photo
- Include grounding rule in canon_rules

---

## Phase 3: Frontend - Hooks and State

### 3.1 New Hook: `useCaerholdResidentImport`

Located at `src/hooks/caerhold/useCaerholdResidentImport.ts`

Functions:
- `useCaerholdProfileJobs()` - list all profile generation jobs
- `useImportResidents()` - mutation: upload portraits, create jobs, call edge function per image
- `useRegenerateResidentProfile()` - mutation: re-run AI on existing job
- `usePublishResident()` - mutation: set profile_status to 'published'

### 3.2 Update `useCaerholdResidents`
- Update the public residents query to filter by `profile_status = 'published'` for public pages (already handled by RLS change, but explicit filter is good practice)

---

## Phase 4: Admin Pages

### 4.1 New Route: `/caerhold/admin/residents/import`

**Import Page** (`src/pages/caerhold/admin/ResidentImport.tsx`):
- File upload area for minifig portrait photos (single or batch)
- On upload: creates media records, creates profile jobs, calls AI for each
- Shows progress: "Generating 3 of 10 profiles..."
- Results list showing generated draft cards with thumbnail + name + occupation
- "View Drafts" button to navigate to drafts list

### 4.2 New Route: `/caerhold/admin/residents/drafts`

**Drafts Page** (`src/pages/caerhold/admin/ResidentDrafts.tsx`):
- List of all residents with `profile_status = 'draft'`
- Each card shows: portrait thumbnail, display_name, occupation, status badge
- Buttons: Edit, Regenerate, Publish
- Regenerate calls AI again on the same source media

### 4.3 Enhanced Route: `/caerhold/admin/residents/:id`

**Resident Editor** (`src/pages/caerhold/admin/ResidentEditor.tsx`):
- Full edit form with all fields:
  - First name, last name, display name
  - Handle, slug
  - Occupation (role_title)
  - Bio (textarea)
  - Tone profile editor (dropdowns for voice, emoji_level, length)
  - Personality editor (tag lists for traits, quirks, values)
  - Lore hooks editor (home_district input, affiliations/motifs tag lists)
  - Canon rules editor (tag lists for allowed_topics, cannot_claim)
  - posting_enabled toggle
- Portrait preview (source_media_id image)
- "Publish" button (sets profile_status to 'published')
- "Regenerate" button (re-runs AI, overwrites draft fields)

### 4.4 Update Admin Sidebar

Add "Import Residents" link with an Upload icon to the sidebar navigation.

### 4.5 Update Existing Residents Admin Page

- Add "Import from Photos" button alongside "Add Resident"
- Show profile_status badge (Draft/Published) in the table
- Filter tabs: All / Drafts / Published

---

## Phase 5: Public Page Updates

### 5.1 Residents Directory (`/caerhold/residents`)
- Already queries all residents; with the updated RLS policy, only published residents will be returned
- No code changes needed if RLS is correct, but add explicit filter as safety

### 5.2 Resident Profile (`/caerhold/residents/:slug`)
- Show portrait image from avatar_media_id if available (instead of initial letter)
- Show occupation, bio, affiliations from lore_hooks
- Posts timeline (already implemented)

---

## Phase 6: Route Registration

Add to `App.tsx`:
```text
/caerhold/admin/residents/import  -> ResidentImport
/caerhold/admin/residents/drafts  -> ResidentDrafts
/caerhold/admin/residents/:id     -> ResidentEditor
```

These go inside the existing Caerhold admin layout route group.

---

## Implementation Order

1. **Database migration** - Add `caerhold_resident_profile_jobs` table, extend `caerhold_residents` with new columns, update RLS
2. **Edge function** - Create `generate-resident-profile` with AI image analysis via Lovable AI
3. **Hooks** - Create `useCaerholdResidentImport` hook with import/regenerate/publish mutations
4. **Admin pages** - Build Import, Drafts, and Editor pages
5. **Route wiring** - Register new routes in App.tsx and update sidebar
6. **Public updates** - Update resident profile to show portrait image and extended fields

---

## Technical Notes

- The edge function uses `google/gemini-3-flash-preview` with multimodal (image) input for analyzing minifig photos
- Tool calling is used to extract structured JSON output from the AI model
- Job idempotency: `job_hash = sha256(media_id)` ensures reprocessing the same photo updates the same job rather than creating duplicates
- The `generate-resident-profile` edge function config entry needs `verify_jwt = false` (JWT validated in code per project conventions)
- All new columns on `caerhold_residents` are nullable or have defaults, so existing data is unaffected
- The updated RLS policy on `caerhold_residents` changes from `true` (all public) to `profile_status = 'published'` for public SELECT, which means existing residents without `profile_status` set will need the default value of 'draft' - the migration should UPDATE existing rows to 'published' to avoid hiding them

