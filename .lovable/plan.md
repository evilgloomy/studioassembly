

# Enhanced Public Resident Profile Page

## Overview

Redesign the resident profile page to feel like a proper character showcase with a large hero portrait, structured detail sections, and a richer visual layout.

## Changes

### 1. Large Hero Portrait Section

Replace the small 24x24 circular avatar with a large, prominent portrait image. The avatar image will be displayed at a much bigger size (e.g., 280x280px) without the circular crop -- showing the full standardized portrait as a square/rectangular image that blends into the white background. The name, handle, and role title will sit below or beside the portrait in a centered hero layout.

### 2. Structured Detail Sections

Surface the rich data already stored in the database that's currently hidden:

- **Personality traits** -- pulled from the `personality` JSONB field, displayed as tags/badges
- **Lore hooks** -- pulled from `lore_hooks` JSONB, shown as narrative snippets or bullet points
- **Canon details** -- relationships, backstory from `canon_rules` shown in a "About" or "Dossier" style section
- **Child indicator** -- if `is_child` is true, show a subtle badge like "Young Resident"

### 3. Portrait Gallery

Query `caerhold_resident_portraits` to show all available portraits (source, standardized, etc.) in a small gallery below the main portrait, so visitors can see the character from different angles or in different styles.

### 4. Layout Restructuring

- Centered hero layout: large portrait on top, name/title below
- Bio in a dedicated readable block
- Detail cards in a clean grid (personality, lore, relationships)
- Posts section remains at the bottom but with a cleaner separator

## Technical Details

**Files to modify:**

1. **`src/pages/caerhold/ResidentProfile.tsx`** -- Complete redesign of the layout with larger portrait, detail sections, and portrait gallery
2. **`src/hooks/caerhold/useCaerholdResidents.ts`** -- Update the `useCaerholdResident` query to also fetch portrait gallery data from `caerhold_resident_portraits` joined with `caerhold_media`

**New data fetching:**
- Join `caerhold_resident_portraits` on `resident_id` to get all portrait media URLs
- The personality/lore_hooks/canon_rules JSONB fields are already returned but not displayed -- just need to render them

**No database changes needed** -- all the data is already in the schema, just not surfaced in the UI.
