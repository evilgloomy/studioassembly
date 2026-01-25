
# Post Editor Enhancement: Image Upload & AI Summary

## Overview

This plan adds two key features to the Post Editor:
1. **Image Upload** - Direct upload capability within the editor with an image picker from the media library
2. **AI-Generated Summary** - One-click SEO-optimized summary generation using Lovable AI

---

## Feature 1: Image Upload & Media Picker

### Current State
- Cover image requires manually entering a URL
- Users must go to the separate Media Library page to upload images and copy URLs
- No inline image upload experience

### Proposed Solution

Add an integrated image upload and media picker directly in the Post Editor sidebar:

```text
+---------------------------+
| COVER IMAGE               |
+---------------------------+
| [Upload Image] [Browse]   |
| +-----------------------+ |
| |                       | |
| |   Image Preview       | |
| |                       | |
| +-----------------------+ |
| URL: https://...          |
+---------------------------+
```

**Components to Create:**
- `ImageUploader.tsx` - Reusable component with drag-drop upload
- `MediaPicker.tsx` - Dialog/sheet to browse and select from existing media library

**Behavior:**
- "Upload Image" button opens file picker for direct upload
- "Browse" button opens a sheet showing the media library grid
- Clicking an image in the picker sets it as the cover image
- URL field remains editable for external image URLs

---

## Feature 2: AI-Generated SEO Summary

### Implementation Approach

Create a backend function that uses Lovable AI to analyze the post content and generate an SEO-optimized summary. Lovable AI is available with the `LOVABLE_API_KEY` which is automatically provisioned.

### Edge Function: `generate-summary`

```text
Request:
  POST /functions/v1/generate-summary
  Body: { title: string, content: string }

Response:
  { summary: string }
```

**AI Prompt Strategy:**
- Analyze the title and content
- Generate a 150-160 character summary (optimal for SEO meta descriptions)
- Focus on keywords and compelling language
- Include a call-to-action when appropriate

### UI Changes

Add a "Generate with AI" button next to the Summary field:

```text
+----------------------------------+
| SUMMARY                          |
+----------------------------------+
| [textarea for summary...]        |
|                                  |
| [✨ Generate with AI] [Refresh]  |
| Character count: 145/160         |
+----------------------------------+
```

**Behavior:**
- Button disabled until content has at least 100 characters
- Shows loading spinner during generation
- Populates the summary field with AI-generated text
- User can edit the result before saving
- "Refresh" regenerates a new summary

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/generate-summary/index.ts` | Edge function for AI summary generation |
| `src/components/admin/ImageUploader.tsx` | Reusable image upload component |
| `src/components/admin/MediaPicker.tsx` | Media library picker dialog |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/PostEditor.tsx` | Add ImageUploader, MediaPicker, and AI summary button |
| `supabase/config.toml` | Add generate-summary function configuration |

---

## Technical Details

### Edge Function Implementation

```typescript
// supabase/functions/generate-summary/index.ts
// - Uses LOVABLE_API_KEY (auto-provisioned)
// - Calls https://ai.gateway.lovable.dev/v1/chat/completions
// - Model: google/gemini-3-flash-preview (fast, balanced)
// - Returns 150-160 char SEO-optimized summary
```

### ImageUploader Component

- Drag-and-drop zone with visual feedback
- File type validation (images only)
- Size limit (5MB)
- Upload progress indicator
- Returns public URL on success

### MediaPicker Component

- Sheet/dialog with media grid
- Reuses the media fetching logic from Media.tsx
- Click to select, returns URL to parent
- Search/filter capability (optional enhancement)

---

## Implementation Sequence

1. **Create the edge function** for AI summary generation
2. **Update config.toml** to register the new function
3. **Create ImageUploader component** with upload logic
4. **Create MediaPicker component** with selection logic
5. **Update PostEditor.tsx** to integrate all new features

---

## UI/UX Considerations

- Buttons use the established "tracking-widest uppercase" styling
- AI generation button uses a sparkle icon (✨) to indicate AI
- Loading states with appropriate feedback
- Error handling with toast notifications
- Character count helps authors stay within SEO limits
