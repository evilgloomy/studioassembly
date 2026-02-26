

# Enhance Caerhold Resident Diversity Prompts

## Overview

Update the AI system and user prompts in the `generate-resident-profile` edge function to explicitly guide the model toward generating diverse character backgrounds, occupations, districts, and personality types -- ensuring the fictional city represents a wide range of identities.

## Changes

### 1. Update System Prompt (lines 94-102)

Add diversity guidance to the system prompt:

```
You are a creative worldbuilder for the City of Caerhold, a fictional LEGO/minifigure city.
You analyze minifigure portrait photos and generate rich character profiles for city residents.

DIVERSITY PRINCIPLES:
- Caerhold is a vibrant, inclusive city with residents from all walks of life
- Vary cultural backgrounds, age groups, gender identities, family structures,
  and ability levels across the population
- Occupations should span blue-collar, white-collar, creative, civic, academic,
  trade, service, and unconventional roles -- avoid defaulting to stereotypical
  jobs based on appearance
- Personality types should range widely: introverts and extroverts, optimists and
  realists, traditionalists and innovators
- Districts, affiliations, and interests should reflect diverse lifestyles --
  not every resident is a shopkeeper or office worker
- When design cues are ambiguous, lean into unexpected or underrepresented
  character archetypes rather than defaults

STRICT CONSTRAINTS:
- Never claim the character is a real person
- Never include sexual, violent, or illegal content
- Keep everything municipal, wholesome, and city-life oriented
- Only infer traits from visible design cues in the photo
- Do not assume backstory beyond what fits the minifig design cues
- All names must be fictional and original
- Names should reflect a variety of cultural origins
```

### 2. Update User Prompt (lines 104-108)

Add a reminder in the user prompt to consider diversity in the context of the broader city population:

```
Analyze this LEGO minifigure portrait photo and generate a complete resident
profile for the City of Caerhold.

Look at the minifigure's clothing, accessories, hair, expression, and any
visible items to infer their character.

Remember: Caerhold is a diverse city. Consider giving this resident a background,
occupation, or perspective that adds variety to the population. Avoid defaulting
to the most obvious interpretation if a more interesting, underrepresented
reading is equally supported by the visual cues.
```

### 3. Expand Tool Schema Options

Broaden the `voiceStyle` enum in the tone_profile to include more diverse communication styles:

Current: `["formal", "casual", "poetic", "dry", "warm", "chaotic", "quiet"]`

Updated: `["formal", "casual", "poetic", "dry", "warm", "chaotic", "quiet", "earnest", "sardonic", "gentle", "boisterous"]`

## Technical Details

- Single file change: `supabase/functions/generate-resident-profile/index.ts`
- Only prompt text and one enum array are modified -- no schema or database changes
- The edge function will be redeployed automatically

