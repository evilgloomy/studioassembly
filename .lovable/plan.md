

# Update Portrait Standardization Prompt

## What Changes

Update the preset prompt in the `standardize-portrait` edge function to produce cinematic "Lego Movie" style 3D renders instead of the current catalog-style product photos.

## New Prompt

```
Using the provided reference image, generate a highly accurate, photorealistic 3D render of this exact Lego minifigure in a high-quality, cinematic 'Lego Movie' style. Maintain strict 1:1 consistency with the character's specific hair piece, facial expression, and clothing details (dark red jacket, tan vest, white collared shirt, and light blue legs). The minifigure must be standing directly on a seamless, bright white background. Do not include any black baseplate, stand, or ground props
```

## Technical Details

**File to modify:**
- `supabase/functions/standardize-portrait/index.ts` -- replace the `STANDARDIZE_PROMPT` constant (lines 10-18) with the new prompt text

One-line change, then redeploy the function automatically.

