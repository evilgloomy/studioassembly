// =====================================================
// CITY OF CAERHOLD - TypeScript Types
// =====================================================

// Enums
export type CaerholdAuthorType = 'resident' | 'location';
export type CaerholdPostStatus = 'draft' | 'approved' | 'scheduled' | 'published';
export type CaerholdLocationType = 'landmark' | 'business' | 'residence' | 'street' | 'park' | 'cafe' | 'restaurant' | 'retail' | 'civic' | 'service' | 'entertainment' | 'office';
export type CaerholdRelationType = 'friend' | 'coworker' | 'rival' | 'family' | 'neighbor';

// Tone Profile for residents (controls AI caption generation voice)
export interface CaerholdToneProfile {
  voiceStyle?: string;       // e.g., "formal", "casual", "poetic"
  useEmoji?: boolean;        // Whether to include emojis
  cadence?: string;          // e.g., "short sentences", "flowing prose"
  vocabulary?: string[];     // Preferred words/phrases
  personality?: string;      // Brief personality description
}

// Canon Rules for residents/locations (AI generation constraints)
export interface CaerholdCanonRules {
  allowedTopics?: string[];      // Topics the entity can discuss
  forbiddenClaims?: string[];    // Facts that must never be stated
  relationships?: string[];      // Known relationships to other entities
  backstory?: string;            // Brief backstory for context
}

// =====================================================
// Database Row Types
// =====================================================

export interface CaerholdDistrict {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  map_hotspot: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CaerholdResident {
  id: string;
  slug: string;
  display_name: string;
  handle: string;
  role_title: string | null;
  bio: string | null;
  first_name: string | null;
  last_name: string | null;
  personality: Record<string, any>;
  lore_hooks: Record<string, any>;
  profile_status: 'draft' | 'published';
  source_media_id: string | null;
  tone_profile: CaerholdToneProfile;
  canon_rules: CaerholdCanonRules;
  posting_enabled: boolean;
  is_child: boolean;
  avatar_media_id: string | null;
  home_district_id: string | null;
  primary_work_location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaerholdLocation {
  id: string;
  slug: string;
  name: string;
  type: CaerholdLocationType;
  description: string | null;
  canon_rules: CaerholdCanonRules;
  hero_media_id: string | null;
  district_id: string | null;
  is_published: boolean;
  hero_image_url: string | null;
  ai_status: 'idle' | 'queued' | 'generated' | 'error';
  ai_generated_json: Record<string, any> | null;
  ai_prompt_version: string;
  ai_locked_fields: string[];
  short_blurb: string | null;
  category: string | null;
  vibe_tags: string[] | null;
  signature_items: string[] | null;
  visitor_tips: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CaerholdLocationMedia {
  id: string;
  location_id: string;
  media_id: string;
  sort_order: number;
  created_at: string;
}

export interface CaerholdLocationOwner {
  id: string;
  location_id: string;
  resident_id: string;
  role: string;
  note: string | null;
  created_at: string;
}

export interface CaerholdLocationOwnerWithResident extends CaerholdLocationOwner {
  resident?: CaerholdResident | null;
}

export interface CaerholdResidentConnection {
  id: string;
  resident_id: string;
  connected_resident_id: string;
  relation_type: string;
  note: string | null;
  created_at: string;
}

export interface CaerholdSiteSettings {
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export interface CaerholdMedia {
  id: string;
  type: 'image' | 'video';
  storage_path: string;
  public_url: string;
  thumb_url: string | null;
  upload_batch_id: string;
  captured_at: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface CaerholdMediaResidentTag {
  id: string;
  media_id: string;
  resident_id: string;
  tagged_by: string;
  created_at: string;
}

export interface CaerholdMediaLocationTag {
  id: string;
  media_id: string;
  location_id: string;
  tagged_by: string;
  created_at: string;
}

export interface CaerholdPost {
  id: string;
  author_type: CaerholdAuthorType;
  resident_id: string | null;
  location_id: string | null;
  status: CaerholdPostStatus;
  caption: string;
  ai_caption: string;
  admin_notes: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CaerholdPostMedia {
  post_id: string;
  media_id: string;
}

export interface CaerholdPostGenerationJob {
  id: string;
  job_hash: string;
  resident_id: string;
  location_id: string | null;
  upload_batch_id: string;
  draft_post_id: string | null;
  status: 'created' | 'updated' | 'failed';
  created_at: string;
}

// =====================================================
// Extended Types (with relations)
// =====================================================

export interface CaerholdResidentWithAvatar extends CaerholdResident {
  avatar?: CaerholdMedia | null;
}

export interface CaerholdLocationWithHero extends CaerholdLocation {
  hero?: CaerholdMedia | null;
}

export interface CaerholdPostWithRelations extends CaerholdPost {
  resident?: CaerholdResident | null;
  location?: CaerholdLocation | null;
  media?: CaerholdMedia[];
}

export interface CaerholdMediaWithTags extends CaerholdMedia {
  resident_tags?: CaerholdResident[];
  location_tags?: CaerholdLocation[];
}

// =====================================================
// Form/Input Types
// =====================================================

export interface CaerholdDistrictInput {
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  sort_order?: number;
  is_published?: boolean;
  map_hotspot?: Record<string, any> | null;
}

export interface CaerholdResidentInput {
  slug: string;
  display_name: string;
  handle: string;
  role_title?: string | null;
  bio?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  personality?: Record<string, any>;
  lore_hooks?: Record<string, any>;
  profile_status?: 'draft' | 'published';
  source_media_id?: string | null;
  tone_profile?: CaerholdToneProfile;
  canon_rules?: CaerholdCanonRules;
  posting_enabled?: boolean;
  is_child?: boolean;
  avatar_media_id?: string | null;
  home_district_id?: string | null;
  primary_work_location_id?: string | null;
}

export interface CaerholdLocationInput {
  slug: string;
  name: string;
  type: CaerholdLocationType;
  description?: string | null;
  canon_rules?: CaerholdCanonRules;
  hero_media_id?: string | null;
  district_id?: string | null;
  is_published?: boolean;
  hero_image_url?: string | null;
  short_blurb?: string | null;
  category?: string | null;
  vibe_tags?: string[] | null;
  signature_items?: string[] | null;
  visitor_tips?: string[] | null;
  ai_locked_fields?: string[];
}

export interface CaerholdMediaUpload {
  file: File;
  type: 'image' | 'video';
  captured_at?: string | null;
}

export interface CaerholdTagInput {
  media_id: string;
  resident_ids?: string[];
  location_ids?: string[];
}

export interface CaerholdPostUpdate {
  caption?: string;
  admin_notes?: string;
  status?: CaerholdPostStatus;
  scheduled_at?: string | null;
}

// =====================================================
// API Response Types
// =====================================================

export interface CaerholdCaptionGenerationResult {
  ai_caption: string;
  success: boolean;
  error?: string;
}

export interface CaerholdUploadBatchResult {
  batch_id: string;
  media: CaerholdMedia[];
  success: boolean;
  error?: string;
}

export interface CaerholdTaggingResult {
  drafts_created: number;
  drafts_updated: number;
  success: boolean;
  error?: string;
}
