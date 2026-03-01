

# Guarantee Pure White Background via Post-Processing

## Problem

The AI prompt already asks for a #FFFFFF white background, but the model doesn't always comply perfectly -- some renders come back with slightly grey or off-white backdrops. Prompt tweaks alone can't guarantee pixel-perfect results every time.

## Solution

Add a **post-processing step** after the AI generates the image but before uploading it to storage. This step will scan every pixel and force any near-white pixels (above a brightness threshold) to pure #FFFFFF white. This guarantees the background blends seamlessly with the website regardless of what the AI produces.

The approach:
1. Decode the AI-generated PNG into raw pixel data
2. For each pixel, if R, G, and B are all above a threshold (e.g., 220), set them to 255 (pure white)
3. Re-encode to PNG and upload

Since Deno doesn't have Canvas natively, we'll use a lightweight approach: decode the base64 image, use a simple pixel manipulation library, and re-encode. We'll use the `imagescript` Deno library which supports PNG read/write and per-pixel operations without needing a full Canvas API.

## Technical Details

**File:** `supabase/functions/standardize-portrait/index.ts`

Changes:
1. Import `Image` from `imagescript` (a Deno-native image processing library)
2. After receiving the base64 image from the AI (step 3 in current code), decode it into an `Image` object
3. Iterate over all pixels -- if R >= 220, G >= 220, and B >= 220, set the pixel to (255, 255, 255, 255)
4. Re-encode to PNG bytes
5. Upload the cleaned image instead of the raw AI output

This threshold-based whitening preserves the minifigure's colors and details while ensuring any near-white background area becomes pure white, matching the website background perfectly.

