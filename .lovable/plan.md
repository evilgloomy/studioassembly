

# Add "Is Child" Toggle for Caerhold Residents

## Overview

Add a boolean `is_child` column to the `caerhold_residents` table and integrate it into the AI profile generation and the admin editor. When the AI analyzes a minifig photo, it will detect shorter legs (a hallmark of LEGO child figures) and set this flag. The generated bio and personality will reflect a child character. Admins can also manually toggle this in the editor.

## Changes

### 1. Database Migration

Add a new `is_child` boolean column to `caerhold_residents`:

```sql
ALTER TABLE public.caerhold_residents
  ADD COLUMN is_child boolean NOT NULL DEFAULT false;
```

No RLS changes needed -- existing policies cover all columns.

### 2. Edge Function: `generate-resident-profile/index.ts`

**System prompt update** -- add child-detection guidance:
- Instruct the AI to look for shorter/stubby legs (the key visual indicator of a LEGO child minifigure)
- When detected, the bio, occupation, and personality should reflect a child (e.g., student, young dreamer, mentions school or playground)

**Tool schema update** -- add `is_child` to the function parameters:
```json
"is_child": {
  "type": "boolean",
  "description": "True if the minifigure has short/stubby legs indicating a child character"
}
```

Add `is_child` to the `required` array.

**Resident insert/update** -- pass `profile.is_child` when creating or updating the resident record.

### 3. Resident Editor: `src/pages/caerhold/admin/ResidentEditor.tsx`

- Load `is_child` into the form state from the resident data
- Add a toggle in the Identity section: "Is Child" switch
- Save `is_child` alongside the other direct fields (in the `supabase.update` call)

### 4. TypeScript Types: `src/types/caerhold.ts`

- Add `is_child: boolean` to `CaerholdResident` interface
- Add `is_child?: boolean` to `CaerholdResidentInput` interface

### 5. Public Profile (optional display)

No changes needed for the public profile page -- the bio text itself will reflect whether the character is a child, so no separate UI indicator is required.

## Technical Summary

- **Database**: 1 migration adding `is_child boolean NOT NULL DEFAULT false`
- **Edge function**: Prompt and schema updates in `generate-resident-profile/index.ts`, plus passing the field on insert/update
- **Frontend**: Form state + toggle in `ResidentEditor.tsx`
- **Types**: 2 small additions to `src/types/caerhold.ts`

