

# Regenerate Profile + Undo for Resident Editor

## Overview

Add two new buttons to the Resident Editor: a "Regenerate Profile" button (with a confirmation dialog warning that it will overwrite all current data) and an "Undo" button that restores the most recently saved version of the profile.

## Changes

### 1. ResidentEditor.tsx -- Regenerate Button with Confirmation

- Import `AlertDialog` components and `Undo2` icon from lucide-react
- Add state: `showRegenConfirm` (boolean) to control the confirmation dialog
- Add a "Regenerate Profile" button (with `RefreshCw` icon) in the Actions bar
- Clicking it opens an `AlertDialog` with:
  - Title: "Regenerate Profile?"
  - Description: "This will use AI to create a completely new profile from the source photo. All current information (name, bio, personality, tone, lore, canon rules) will be overwritten and cannot be recovered unless you save first."
  - Cancel button
  - Destructive "Regenerate" confirm button
- On confirm: look up the resident's profile job from `caerhold_resident_profile_jobs` (by `result_resident_id`), then call `useGenerateResidentProfile` with that job ID. On success, invalidate queries so the editor reloads with the new data.

### 2. ResidentEditor.tsx -- Undo (Revert to Last Saved)

- Add state: `savedSnapshot` that captures the full form state whenever the resident data loads from the database (set in the `useEffect` that populates the form)
- Add an "Undo" button (with `Undo2` icon) in the Actions bar
- Clicking it restores `form` to `savedSnapshot`, effectively discarding any unsaved edits
- The button is disabled when the form matches the saved snapshot (no changes to undo)
- This is a client-side revert to the last database-saved state -- simple and instant

### 3. Job Lookup for Regeneration

The edge function expects a `job_id`. To find it from the editor:
- Query `caerhold_resident_profile_jobs` where `result_resident_id = resident.id` and pick the most recent one
- If no job exists (manually created resident with no source media), disable the Regenerate button and show a tooltip: "No source photo available for regeneration"

## Technical Summary

- **Single file change**: `src/pages/caerhold/admin/ResidentEditor.tsx`
- No database changes needed -- the existing `caerhold_resident_profile_jobs` table already links jobs to residents via `result_resident_id`
- No edge function changes -- the existing regeneration path (updating an existing resident when `job.result_resident_id` is set) already works
- Undo is purely client-side (restores last loaded DB state), not a versioning system

