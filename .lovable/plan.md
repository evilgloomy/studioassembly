

# Enhance Portrait Standardization Prompt

## What Changes

Update the `STANDARDIZE_PROMPT` in `supabase/functions/standardize-portrait/index.ts` to push the output toward a full CG "Lego Movie" aesthetic rather than a subtle touch-up of the source photo.

## New Prompt

```
Using the provided reference image as the sole character reference, create a full CGI 3D render of this Lego minifigure as if it were a hero shot from 'The Lego Movie'. The render must look like it was produced by Animal Logic's rendering pipeline -- subsurface scattering on the plastic skin, micro-scratches and fingerprint smudges on glossy surfaces, subtle depth-of-field, and cinematic studio lighting with soft key light and rim highlights. Maintain absolute 1:1 fidelity to every detail in the reference: exact hair mould, precise facial print, all torso and leg printing, and any accessories. The minifigure should be standing in a neutral pose on a perfectly seamless, pure white cyclorama background with no baseplate, stand, shadow catcher, or ground plane visible. Output a single high-resolution image.
```

Key differences from the current prompt:
- Explicitly references Animal Logic's rendering pipeline (the studio behind The Lego Movie) to steer the model toward that specific CG look
- Adds material detail cues: subsurface scattering, micro-scratches, fingerprint smudges on plastic
- Adds lighting cues: cinematic studio lighting, soft key light, rim highlights, depth-of-field
- Asks for "full CGI 3D render" and "hero shot" rather than just "photorealistic 3D render"
- Specifies "pure white cyclorama" for a cleaner studio backdrop description
- Keeps the strict fidelity instruction for hair, face, torso/leg printing, and accessories

## Technical Details

**File:** `supabase/functions/standardize-portrait/index.ts` -- replace the `STANDARDIZE_PROMPT` constant (line 10) with the new text above, then the function auto-deploys.

