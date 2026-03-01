

# Fix Portrait Standardization: Better Model + Stronger Prompt

## Problems Identified

1. **Low-quality model**: Currently using `google/gemini-2.5-flash-image` (the fast/cheap option). This model struggles to follow complex composition instructions and produces lower fidelity renders with baseplates and shadows.
2. **Prompt not forceful enough**: The model still renders baseplates and ground shadows despite the instructions. The prompt needs to be restructured to emphasize isolation more aggressively.

## Solution

### 1. Upgrade to higher-quality image model

Switch from `google/gemini-2.5-flash-image` to `google/gemini-3-pro-image-preview` -- this is the best available image generation model with much better instruction-following and render quality.

### 2. Strengthen the prompt

Restructure the prompt to lead with the isolation/background requirement (models pay more attention to early instructions) and add stronger negative constraints:

```
CRITICAL REQUIREMENT: The minifigure must be FLOATING against a perfectly seamless, 
pure #FFFFFF white void. There must be ABSOLUTELY NO baseplate, no ground plane, 
no stand, no pedestal, no surface, no shadow, no reflection, no shadow catcher -- 
nothing beneath or around the figure. The background must be a completely flat, 
featureless white with zero gradient, zero grey tones, and zero environmental elements.

Using the provided reference image as the sole character reference, create a full CGI 
3D render of this Lego minifigure as if it were a hero shot from 'The Lego Movie'. 
The render must look like it was produced by Animal Logic's rendering pipeline -- 
subsurface scattering on the plastic skin, micro-scratches and fingerprint smudges 
on glossy surfaces, and bright, even studio lighting with soft key light and subtle 
rim highlights. Use high-key lighting so the entire figure is well-lit with no dark 
shadows. Maintain absolute 1:1 fidelity to every detail in the reference: exact hair 
mould, precise facial print, all torso and leg printing, and any accessories. Pay 
close attention to the leg type: if the reference shows short, stubby legs (indicating 
a child minifigure), the render MUST use short legs -- do NOT replace them with 
standard full-length adult legs. The minifigure should be in a neutral standing pose. 
Output a single high-resolution image.
```

Key changes:
- Background/isolation instruction moved to the very top as a "CRITICAL REQUIREMENT"
- Added "FLOATING" and "white void" language
- Explicitly listed more things to exclude: pedestal, surface, reflection
- Removed redundant background instruction from the end (now all at the top where the model pays most attention)

## Technical Details

**File:** `supabase/functions/standardize-portrait/index.ts`

1. Change model on line 57 from `google/gemini-2.5-flash-image` to `google/gemini-3-pro-image-preview`
2. Replace `STANDARDIZE_PROMPT` constant on line 11 with the restructured prompt above
3. Redeploy the function

