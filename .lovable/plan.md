

# Auto-Generate Standardized Portrait from Upload

## Overview

When a resident photo is uploaded during import, automatically run it through Gemini's image editing model to produce a clean, standardized portrait: white background, centered minifigure, consistent studio-style lighting -- matching the template style you shared.

## How It Works

### 1. New Edge Function: `standardize-portrait`

A dedicated edge function that:
- Takes a source image URL (the raw uploaded photo)
- Sends it to `google/gemini-2.5-flash-image` with a fixed prompt describing the desired output style
- Receives the generated base64 image back
- Uploads the result to storage as a new file (e.g., `caerhold/{batchId}/portrait_{uuid}.png`)
- Creates a new `caerhold_media` record for the standardized portrait
- Returns the new media ID and public URL

**Prompt (preset for every image):**
```
Transform this LEGO minifigure photo into a clean, professional portrait.
Requirements:
- Pure white background, seamless, no shadows on the background
- Minifigure centered in frame, shot from roughly chest/waist up or full body
- Soft, even studio lighting with no harsh shadows
- Remove any background clutter, other objects, or surface textures
- Keep the minifigure's exact appearance, colors, accessories, and expression unchanged
- The result should look like an official catalog-style product photo
- Output a high quality, clean image
```

### 2. Integration into Import Flow

Modify `useImportResidents` (or the `ResidentImport` page) so after uploading each file:
1. Call `standardize-portrait` with the uploaded image URL
2. This returns a new `media_id` for the standardized version
3. Use this standardized media ID as the `avatar_media_id` when creating the profile job (so the AI analyzes the clean version)
4. Store the original upload as the source and the standardized version as the avatar

The import progress UI will show an additional status step: "Standardizing portrait..." before "Generating profile..."

### 3. Updated Import Flow (3 steps per image)

```text
Upload raw photo --> Standardize portrait --> Generate AI profile
     |                      |                        |
  media record       new media record          resident record
  (original)         (clean portrait)          (avatar = clean)
```

### 4. Config

Add to `supabase/config.toml`:
```toml
[functions.standardize-portrait]
verify_jwt = false
```

## Technical Details

**Files to create:**
- `supabase/functions/standardize-portrait/index.ts` -- new edge function using `google/gemini-2.5-flash-image` with `modalities: ["image", "text"]`

**Files to modify:**
- `src/pages/caerhold/admin/ResidentImport.tsx` -- add standardization step between upload and profile generation, update progress UI
- `src/hooks/caerhold/useCaerholdResidentImport.ts` -- add `useStandardizePortrait` mutation hook
- `supabase/config.toml` -- register new function

**Edge function flow:**
1. Receive `{ media_id, batch_id }` in request body
2. Fetch the media record to get `public_url`
3. Call Gemini image edit endpoint with the source image + preset prompt
4. Extract base64 result from `choices[0].message.images[0].image_url.url`
5. Decode base64 to binary, upload to storage as `caerhold/{batch_id}/portrait_{uuid}.png`
6. Create new `caerhold_media` record for the standardized image
7. Return `{ media_id, public_url }` of the new standardized portrait

**Import page changes:**
- Status flow becomes: `queued` -> `standardizing` -> `processing` -> `complete`/`failed`
- Each image card shows the current step in the pipeline

