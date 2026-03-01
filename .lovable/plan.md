

# Brighten Portrait Standardization Output

## What Changes

Update the `STANDARDIZE_PROMPT` in the `standardize-portrait` edge function to emphasize brighter overall lighting and a pure #FFFFFF white background, matching the clean aesthetic shown in the reference image.

## New Prompt

```
Using the provided reference image as the sole character reference, create a full CGI 3D render of this Lego minifigure as if it were a hero shot from 'The Lego Movie'. The render must look like it was produced by Animal Logic's rendering pipeline -- subsurface scattering on the plastic skin, micro-scratches and fingerprint smudges on glossy surfaces, and bright, even studio lighting with soft key light and subtle rim highlights. Use high-key lighting so the entire figure is well-lit with no dark shadows. Maintain absolute 1:1 fidelity to every detail in the reference: exact hair mould, precise facial print, all torso and leg printing, and any accessories. The minifigure should be standing in a neutral pose on a perfectly seamless, pure #FFFFFF white background with no baseplate, stand, shadow catcher, ground plane, or shadow visible. The background must be completely flat white with zero gradient or grey tones. Output a single high-resolution image.
```

Key changes from current prompt:
- Replaced "cinematic studio lighting" with "bright, even studio lighting" and added "high-key lighting" to push brightness up
- Removed "depth-of-field" which can darken/blur areas
- Added "no dark shadows" instruction
- Changed background spec to explicitly require "#FFFFFF white" with "zero gradient or grey tones"
- Added "no shadow visible" to prevent ground shadows from greying out the background

## Technical Details

**File:** `supabase/functions/standardize-portrait/index.ts` -- replace the `STANDARDIZE_PROMPT` constant (line 10) with the new text, then redeploy.

