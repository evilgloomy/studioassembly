

# Redesign Resident Profile Page

## Overview

Rebuild the profile page layout to match the reference design -- a visually rich character showcase with an illustrated banner, overlapping portrait card, and polished detail sections with rounded styling.

## Layout Changes

### 1. Hero Banner with Overlapping Portrait

- Add a full-width decorative banner at the top of the page (below the header). Use a soft gradient or the existing `hero-city.jpg` asset as the banner background, giving it a muted/blurred treatment so it doesn't compete with the portrait.
- The resident's portrait sits **centered and overlapping** the bottom of the banner, inside a white card frame with rounded corners and a subtle shadow. The portrait will be larger than the current 288px -- roughly 280-320px, displayed with `object-contain` so it blends into the white card.
- The banner will be approximately 280px tall, with the portrait card offset so it overlaps the banner by about half.

### 2. Identity Block (Centered Below Portrait)

- Large bold display name
- Handle in muted text below
- Role title below the handle
- "Young Resident" badge if `is_child` is true

### 3. Bio Section

- The bio text displayed in a readable block with generous line-height, centered within a max-width container. Decorative leaf/botanical SVG accents on the sides are not feasible without custom artwork, so the bio will be styled cleanly with slightly larger font and relaxed spacing.

### 4. Detail Cards (Personality + Lore)

- **Personality** and **Lore** sections displayed **side-by-side** in rounded cards with subtle borders and background fills.
- Personality traits shown as **colored pill badges** (using a green/teal accent) instead of the current outline badges, matching the reference.
- Lore hooks shown as a bulleted list with bold keys.
- Backstory and Relationships sections integrated into additional cards if data exists.

### 5. Posts Section

- Remains at the bottom with a clean separator, largely unchanged.

### 6. Portrait Gallery

- If multiple portraits exist, shown in a small grid below the detail cards.

## Technical Details

**File to modify:** `src/pages/caerhold/ResidentProfile.tsx`

- Restructure the JSX to use: banner div (with background image) -> overlapping portrait card (negative margin) -> identity text -> bio -> detail grid -> posts
- Use explicit `rounded-2xl` and `rounded-xl` classes on the portrait card and detail sections (overriding the global 0px radius for this page's specific design)
- Add `shadow-lg` to the portrait card for the floating effect
- Import `hero-city.jpg` for the banner background
- Personality badges get custom green/teal background styling via className overrides
- No new components or hooks needed -- purely a layout and styling change within the existing page

**No database or backend changes required.**

