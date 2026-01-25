
# Studio Assembly Website Enhancement Plan

## Overview

This plan transforms the Studio Assembly website from a static portfolio into a dynamic content-driven platform. We'll implement a robust content management system using Lovable Cloud + Supabase, starting with the Journal/Blog system, then expanding to the City of Caerhold world-building section.

## Phase 1: Foundation (Journal/Blog System)

### 1.1 Database Architecture

Create the core content tables in Supabase:

```text
+------------------+     +------------------+     +------------------+
|   auth.users     |     |     profiles     |     |    user_roles    |
+------------------+     +------------------+     +------------------+
| id (uuid)        |<----| id (uuid)        |     | id (uuid)        |
| email            |     | user_id (fk)     |     | user_id (fk)     |
| ...              |     | display_name     |     | role (enum)      |
+------------------+     | avatar_url       |     +------------------+
                         +------------------+           |
                                                       |
        +----------------------------------------------+
        |
        v
+------------------+     +------------------+     +------------------+
|  journal_posts   |     |  post_revisions  |     |      tags        |
+------------------+     +------------------+     +------------------+
| id (uuid)        |<----| post_id (fk)     |     | id (uuid)        |
| author_id (fk)   |     | content          |     | name             |
| title            |     | created_at       |     | slug             |
| slug             |     +------------------+     +------------------+
| summary          |                                    |
| content (text)   |     +------------------+          |
| cover_image_url  |     |    post_tags     |<---------+
| status (enum)    |     +------------------+
| published_at     |     | post_id (fk)     |
| created_at       |     | tag_id (fk)      |
| updated_at       |     +------------------+
+------------------+
```

**Enums:**
- `app_role`: 'admin', 'editor', 'author'
- `post_status`: 'draft', 'scheduled', 'published', 'archived'

### 1.2 Security Architecture

Implement role-based access control (RBAC):

- **Admin**: Full control over all content and user management
- **Editor**: Can create, edit, publish any post; cannot manage users
- **Author**: Can create and edit own drafts; submit for review

RLS policies will:
- Allow public read access to published posts
- Restrict drafts to their authors and editors/admins
- Use security definer functions to avoid recursive policy issues

### 1.3 Admin Dashboard

Create a protected admin area at `/admin`:

**Pages to create:**
- `/admin` - Dashboard overview with stats
- `/admin/posts` - Post list with filters (draft, published, scheduled)
- `/admin/posts/new` - Rich text editor for creating posts
- `/admin/posts/:id/edit` - Edit existing posts
- `/admin/media` - Media library for image uploads
- `/admin/team` - User/role management (admin only)

**Components:**
- `AdminLayout` - Sidebar navigation with role-based menu items
- `RichTextEditor` - WYSIWYG editor using TipTap
- `MediaUploader` - Drag-and-drop image upload to Supabase Storage
- `PostStatusBadge` - Visual status indicators
- `AutosaveProvider` - Autosave drafts every 30 seconds

### 1.4 Public Journal Pages

Update the existing Journal placeholder:

**Routes:**
- `/journal` - Grid of published posts with pagination
- `/journal/:slug` - Individual post detail page

**Features:**
- Responsive card grid layout
- Category/tag filtering
- Search functionality
- Social sharing buttons (Open Graph meta tags)
- Related posts section

### 1.5 File Structure (Phase 1)

```text
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── PostEditor.tsx
│   │   ├── RichTextEditor.tsx
│   │   ├── MediaUploader.tsx
│   │   ├── PostList.tsx
│   │   └── TeamManagement.tsx
│   ├── journal/
│   │   ├── JournalCard.tsx
│   │   ├── JournalGrid.tsx
│   │   ├── PostContent.tsx
│   │   └── ShareButtons.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       ├── AuthProvider.tsx
│       └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePosts.ts
│   └── useRoles.ts
├── pages/
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── Posts.tsx
│   │   ├── PostEditor.tsx
│   │   └── Team.tsx
│   ├── Journal.tsx (update)
│   └── JournalPost.tsx (new)
└── lib/
    └── supabase.ts
```

---

## Phase 2: City of Caerhold

### 2.1 Content Model

Extend the database with world-building content types:

```text
+------------------+     +------------------+     +------------------+
|    residents     |     |    locations     |     |   lore_entries   |
+------------------+     +------------------+     +------------------+
| id (uuid)        |     | id (uuid)        |     | id (uuid)        |
| name             |     | name             |     | title            |
| slug             |     | slug             |     | slug             |
| image_url        |     | type (enum)      |     | category (enum)  |
| bio (rich text)  |     | image_url        |     | content          |
| occupation       |     | description      |     | created_at       |
| status (enum)    |     | history          |     +------------------+
| created_at       |     | status (enum)    |
+------------------+     +------------------+
        |                        |
        v                        v
+------------------------------------------+
|           relationships                  |
+------------------------------------------+
| id (uuid)                                |
| source_type ('resident'|'location')      |
| source_id (uuid)                         |
| target_type ('resident'|'location'|'lore')|
| target_id (uuid)                         |
| relationship_type (string)               |
+------------------------------------------+
```

**Enums:**
- `location_type`: 'district', 'building', 'landmark', 'street'
- `lore_category`: 'myth', 'event', 'tradition', 'item', 'history'

### 2.2 Public Caerhold Section

**Routes:**
- `/caerhold` - Main landing with featured content
- `/caerhold/residents` - Character directory
- `/caerhold/residents/:slug` - Character profile
- `/caerhold/locations` - Location explorer
- `/caerhold/locations/:slug` - Location detail
- `/caerhold/lore` - Stories and history
- `/caerhold/lore/:slug` - Lore entry detail

**Features:**
- Interactive district map (SVG with clickable regions)
- Character cards with avatars
- Relationship visualization
- Breadcrumb navigation
- Cross-linking between related entries

### 2.3 Admin Extensions

Add content management for Caerhold:
- `/admin/caerhold/residents` - Manage characters
- `/admin/caerhold/locations` - Manage places
- `/admin/caerhold/lore` - Manage stories
- Relationship editor for connecting entries

---

## Phase 3: Shop Enhancements

### 3.1 Navigation Improvements

- Add search bar to header (search products by name)
- Add filter sidebar on `/shop` (by category, price range)
- Add breadcrumb navigation to product pages
- Sort options (price, name, newest)

### 3.2 Shopify Integration

Since you want to integrate Shopify for e-commerce:
- Enable Shopify integration in Lovable
- Sync product catalog from Shopify
- Replace static product data with dynamic Shopify products
- Add "Add to Cart" functionality
- Implement cart drawer/page
- Redirect to Shopify checkout

### 3.3 Product-Content Links

- Link Journal posts to related products
- Add "Featured in Journal" section to product pages
- Cross-promote kits mentioned in Caerhold lore

---

## Phase 4: Newsletter & Engagement

### 4.1 Newsletter Signup

- Add email capture form to Footer
- Create newsletter popup (optional, triggered on scroll)
- Store subscribers in Supabase `newsletter_subscribers` table
- Integrate with email service (Resend) for welcome email

### 4.2 Social & SEO

- Add Open Graph meta tags to all pages
- Generate dynamic OG images for posts
- Add RSS/Atom feed at `/journal/feed.xml`
- Improve alt text on all images
- Add structured data (JSON-LD) for products and articles

---

## Implementation Sequence

| Step | Task | Dependencies |
|------|------|--------------|
| 1 | Enable Lovable Cloud + Supabase | None |
| 2 | Create database schema (auth, roles, posts) | Step 1 |
| 3 | Implement authentication flow | Step 2 |
| 4 | Build admin layout and navigation | Step 3 |
| 5 | Create rich text post editor | Step 4 |
| 6 | Set up Supabase Storage for media | Step 2 |
| 7 | Build public Journal pages | Step 5 |
| 8 | Add Caerhold database tables | Step 2 |
| 9 | Build Caerhold admin pages | Step 4, 8 |
| 10 | Create public Caerhold section | Step 9 |
| 11 | Enable Shopify integration | None |
| 12 | Add shop search and filters | Step 11 |
| 13 | Implement newsletter signup | Step 1 |
| 14 | Add SEO and social sharing | Steps 7, 10 |

---

## Technical Considerations

### Authentication

- Use Supabase Auth with email/password
- Admin users invited via email link
- JWT verification in edge functions
- Session management with `onAuthStateChange`

### Media Storage

- Create `media` bucket in Supabase Storage (public)
- Organize by type: `journal/`, `caerhold/`, `products/`
- Implement image optimization on upload
- Lazy loading for gallery images

### Performance

- Static generation for published posts
- Incremental loading with React Query
- Image lazy loading with blur placeholders
- Code splitting for admin bundle

### Security

- RLS policies on all tables
- Role checks in security definer functions
- Input validation with Zod
- Sanitize rich text content (DOMPurify)
- CSRF protection on forms

---

## Estimated Effort

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | Journal/Blog System | High |
| 2 | City of Caerhold | Medium-High |
| 3 | Shop Enhancements | Medium |
| 4 | Newsletter & SEO | Low-Medium |

Phase 1 is the foundation and will take the most effort. Once the admin system and authentication are in place, Phases 2-4 build upon that infrastructure.

---

## Ready to Begin?

Approve this plan to start implementation. We'll begin with:
1. Enabling Lovable Cloud
2. Setting up the Supabase database schema
3. Building the authentication system
4. Creating the admin dashboard

