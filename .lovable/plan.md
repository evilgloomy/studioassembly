
# Preserve Short Legs (Child Figures) in Portrait Standardization

## Problem

The current prompt tells the AI to maintain "1:1 fidelity" but doesn't explicitly call out leg length. The model defaults to rendering standard long-leg minifigures every time, even when the source photo shows a child figure with short/stubby legs.

## Solution

Add an explicit instruction to the `STANDARDIZE_PROMPT` that tells the model to carefully observe the leg type in the reference image and reproduce it exactly -- short stubby legs for child figures, standard long legs for adult figures.

## Updated Prompt

The key addition (bolded for clarity) within the fidelity instruction:

> "...Maintain absolute 1:1 fidelity to every detail in the reference: exact hair mould, precise facial print, all torso and leg printing, and any accessories. **Pay close attention to the leg type: if the reference shows short, stubby legs (indicating a child minifigure), the render MUST use short legs -- do NOT replace them with standard full-length adult legs.** The minifigure should be standing in a neutral pose..."

## Technical Details

**File:** `supabase/functions/standardize-portrait/index.ts` -- update the `STANDARDIZE_PROMPT` constant on line 10 to include the leg-type instruction, then redeploy.
