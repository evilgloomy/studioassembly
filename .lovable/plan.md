

# Merge Caerhold Admin into Studio Assembly Admin

## Overview

Move all Caerhold admin pages from `/caerhold/admin/*` into the main `/admin/*` panel. This eliminates the separate Caerhold admin layout, sidebar, and protected route -- everything is managed under the existing Studio Assembly admin infrastructure.

---

## Changes

### 1. Update Main Admin Sidebar

Add a "Caerhold" section to `src/components/admin/AdminSidebar.tsx` with the following nav items (grouped under a section divider/header):

| Label | Path | Icon |
|-------|------|------|
| **City Dashboard** | `/admin/caerhold` | `Landmark` |
| **City Media** | `/admin/caerhold/media` | `Image` |
| **Post Drafts** | `/admin/caerhold/drafts` | `FileEdit` |
| **Residents** | `/admin/caerhold/residents` | `Users` |
| **Import Residents** | `/admin/caerhold/residents/import` | `Upload` |
| **Resident Drafts** | `/admin/caerhold/residents/drafts` | `UserPlus` |
| **Locations** | `/admin/caerhold/locations` | `MapPin` |

These will appear below a "CAERHOLD" section label, only visible to users with admin, caerhold_admin, or caerhold_editor roles.

### 2. Update Route Registration in App.tsx

Move all Caerhold admin routes from the separate `/caerhold/admin` route group into the existing `/admin` route group:

```text
/admin/caerhold              -> CaerholdAdminDashboard
/admin/caerhold/media        -> CaerholdAdminMedia
/admin/caerhold/drafts       -> CaerholdAdminDrafts
/admin/caerhold/drafts/:id   -> CaerholdDraftEditor
/admin/caerhold/residents    -> CaerholdAdminResidents
/admin/caerhold/residents/import  -> CaerholdResidentImport
/admin/caerhold/residents/drafts  -> CaerholdResidentDrafts
/admin/caerhold/residents/:id     -> CaerholdResidentEditor
/admin/caerhold/locations    -> CaerholdAdminLocations
```

Remove the entire `/caerhold/admin` route group and its `CaerholdProtectedRoute` + `CaerholdAdminLayout` wrappers.

### 3. Update Internal Links in Caerhold Admin Pages

All Caerhold admin pages currently link to `/caerhold/admin/...`. These need updating to `/admin/caerhold/...`:

- `src/pages/caerhold/admin/Dashboard.tsx` - links to media, drafts
- `src/pages/caerhold/admin/Drafts.tsx` - links to draft editor
- `src/pages/caerhold/admin/Residents.tsx` - links to import, individual residents
- `src/pages/caerhold/admin/ResidentDrafts.tsx` - links to resident editor
- `src/pages/caerhold/admin/ResidentImport.tsx` - links to drafts
- `src/pages/caerhold/admin/ResidentEditor.tsx` - links back to residents
- `src/pages/caerhold/admin/DraftEditor.tsx` - links back to drafts

### 4. Update Auth / Access Control

The existing `ProtectedRoute` wrapping `/admin` already ensures authentication. For Caerhold-specific pages, no extra protection is needed beyond what the main admin route provides -- RLS on the database tables already restricts data access to `caerhold_admin`/`caerhold_editor` roles.

The `get_user_role` function currently only returns the highest-priority role among `admin`, `editor`, `author`. It needs to also handle `caerhold_admin` and `caerhold_editor` so the sidebar can conditionally show Caerhold links. The `hasContentRole` check should also include these Caerhold roles so users with only a Caerhold role can access `/admin`.

### 5. Files No Longer Needed

These files become unused and can be removed:
- `src/components/caerhold/CaerholdAdminLayout.tsx`
- `src/components/caerhold/CaerholdAdminSidebar.tsx`
- `src/components/caerhold/CaerholdProtectedRoute.tsx`
- `src/hooks/caerhold/useCaerholdAuth.ts`

### 6. Update `get_user_role` Database Function

The current function only prioritizes `admin > editor > author`. It needs to include `caerhold_admin` and `caerhold_editor` in its priority ordering so that users with these roles get a non-null result, which in turn makes `hasContentRole = true` and grants access to the admin panel.

---

## Summary of Impact

- Single admin panel for everything -- no separate login or layout for Caerhold
- Caerhold nav items appear as a grouped section in the existing sidebar
- All existing Caerhold admin functionality preserved, just re-routed
- Caerhold roles (`caerhold_admin`, `caerhold_editor`) gain access to the main admin shell
- Database RLS continues to enforce data-level access control

