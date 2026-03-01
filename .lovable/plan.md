

# Fix: Chinese Characters in AI-Generated Resident Profiles

## Problem

The AI model (`google/gemini-3-flash-preview`) occasionally produces corrupted JSON in tool call responses, injecting Chinese characters (e.g., `消`, `协助`) into string values. This corrupted data gets saved directly to the database and displayed in the editor.

Example: `"Inquisitive消"` instead of `"Inquisitive"`, or `"Caerhold Junior Naturalist Club消"` instead of `"Caerhold Junior Naturalist Club"`.

## Root Cause

The tool call `arguments` string from the AI sometimes contains garbled characters. The edge function parses this JSON and saves it without any sanitization.

## Solution (2 parts)

### 1. Sanitize AI output in the edge function

After parsing `toolCall.function.arguments`, add a sanitization step that:
- Recursively walks all string values in the parsed profile object
- Strips non-Latin/non-ASCII garbage characters (Chinese, Korean, etc.) that don't belong in English text
- Cleans up any broken JSON fragments embedded in string values (e.g., `],grounding_rule:` appearing inside a string)

A regex like `/[^\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF]/g` will strip non-Latin characters. A second pass will trim trailing JSON-like fragments from strings (e.g., patterns like `],key_name:` or `},next_key:`).

**File:** `supabase/functions/generate-resident-profile/index.ts` (after line 245 where `profile` is parsed)

### 2. Switch to a more stable model

Change from `google/gemini-3-flash-preview` to `google/gemini-2.5-flash` which is a stable release and less prone to structured output corruption.

**File:** `supabase/functions/generate-resident-profile/index.ts` (line 135)

### 3. Fix existing corrupted data for Sami Vinter

Run a one-time cleanup of the affected resident's data by manually cleaning the corrupted JSON fields in `canon_rules`, `personality`, and `lore_hooks`.

This will be done via a database migration that updates the specific resident record.

## Technical Details

Sanitization function (added to edge function):

```typescript
function sanitizeStrings(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/[^\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF\s]/g, '')
      .replace(/[\]\}],?\w[\w_]*:.*$/g, '')
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(sanitizeStrings);
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = sanitizeStrings(v);
    }
    return result;
  }
  return obj;
}
```

Applied right after `JSON.parse(toolCall.function.arguments)` so all data is clean before any database writes.

