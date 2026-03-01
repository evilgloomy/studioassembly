

# Redesign Resident Profile Page -- Larger Photo, Color Badges, Decorative Botanicals

## Changes Overview

### 1. Larger Portrait Photo
The current portrait uses `object-contain` inside a 280x280 container, making the minifigure appear tiny. Fix by switching to `object-cover` and increasing the container size to ~320x380px so the figure fills the frame, matching the reference where the character is prominently displayed.

### 2. Color-Coded Personality Badges
The reference shows personality traits as colored pill badges (greens and teals). Add a rotating set of nature-inspired accent colors to the personality badges:
- Soft green (`#4CAF50`), teal (`#26A69A`), olive (`#7CB342`), forest (`#2E7D32`)
- Each trait gets a colored background with white text, rendered as rounded pills

### 3. Remove Portrait Gallery
Delete the entire "Portrait Gallery" section (lines 183-196) from the page. Only the main hero portrait will be shown.

### 4. Generate Botanical Leaf Decorations
The reference shows decorative botanical/leaf illustrations flanking the bio section and scattered around the page edges. Create an edge function that uses the AI image generation model to produce transparent PNG leaf/botanical decorative assets, then store them in the media bucket for use on the page.

Specifically, generate 2 assets:
- **Left botanical cluster** -- a watercolor-style arrangement of leaves/branches for the left side of the bio
- **Right botanical cluster** -- a mirrored/complementary arrangement for the right side

These will be stored in `public/caerhold/` and imported as static assets. The edge function generates them once, then we embed the resulting URLs.

**Alternative (simpler, recommended):** Instead of generating images via edge function, use inline SVG leaf decorations directly in the component. This avoids storage complexity and loads instantly. The SVGs will be subtle, muted-green botanical line drawings matching the reference aesthetic.

### 5. Overall Layout Polish
- Bio section gets the decorative leaf SVGs positioned absolutely on left and right
- Detail cards get slightly more padding and refined typography
- Personality card title bold and uppercase matching reference
- Lore card uses bullet points with bold keys matching reference exactly

## Technical Details

**File: `src/pages/caerhold/ResidentProfile.tsx`**

1. Change portrait container from `w-[280px] h-[280px]` to `w-[320px] h-[380px]`
2. Change image class from `object-contain` to `object-cover` with top alignment
3. Add color array for personality badges: cycle through green/teal colors
4. Remove portrait gallery section entirely (lines 183-196)
5. Add inline SVG botanical decorations positioned around the bio text
6. Style personality badges with colored backgrounds instead of the current `variant="secondary"`

No database changes needed. No new edge functions -- using inline SVGs for the botanical decorations keeps it simple and fast.

