

# Integrating ArtistAgent.AI Systems into Caerhold

## What This Means

The [ArtistAgent.AI](/projects/ee744222-6c7f-4bd5-b7f3-347d2438f7b3) project has three core systems that map well onto Caerhold's residents:

1. **LEMO** (Lovable Emotional Management Operations) -- A multi-dimensional relationship scoring engine that tracks affection, trust, comfort, respect, and compatibility between users and characters. It uses sentiment analysis, anti-gaming mechanics, and relationship tiers to dynamically shape how a character responds.

2. **Aurora Brain** -- A memory and emotional intelligence engine. It gives characters persistent emotional context (emotional state, micro-expressions, conversation arc tracking) and uses that to modify response tone, length, and personality expression.

3. **Character System** -- Rich character profiles with personality traits, MBTI, zodiac, visual identity, and system prompts for AI-driven conversations.

Caerhold already has a solid foundation: residents have `tone_profile`, `canon_rules`, `personality`, and `lore_hooks`. What's missing is the **live interaction layer** -- residents can't "talk" to visitors, and there's no relationship tracking or emotional memory.

---

## Adapted Architecture for Caerhold

The ArtistAgent system is designed for 1:1 romantic AI companions. Caerhold needs a **municipal, wholesome** adaptation: residents are city characters you can chat with, and the relationship system tracks familiarity/rapport rather than romance.

### Relationship Tiers (Caerhold-adapted)

Instead of Blocked → Hostile → ... → Intimate, we use:

| Tier | Composite Range | Description |
|------|----------------|-------------|
| Stranger | 0-15 | First encounter, formal |
| Acquaintance | 16-35 | Recognizes you, friendly |
| Neighbor | 36-55 | Comfortable, shares stories |
| Friend | 56-75 | Open, personal, helpful |
| Confidant | 76-100 | Deep trust, inside jokes |

No heat tiers. No adult content gating. Clean, city-life focused.

---

## 1. Database Migration

### New table: `caerhold_visitor_relationships`

Tracks relationship state between a site visitor (auth user) and a resident.

```text
id              uuid PK
user_id         uuid FK -> auth.users NOT NULL
resident_id     uuid FK -> caerhold_residents ON DELETE CASCADE NOT NULL
affection       numeric default 0
trust           numeric default 0
comfort         numeric default 0
respect         numeric default 0
compatibility   numeric default 0
composite_score numeric default 0
interaction_count int default 0
last_interaction timestamptz
created_at      timestamptz default now()
updated_at      timestamptz default now()
UNIQUE(user_id, resident_id)
```

### New table: `caerhold_relationship_events`

Stores each scoring event for analytics and velocity calculations.

```text
id              uuid PK
user_id         uuid NOT NULL
resident_id     uuid FK -> caerhold_residents ON DELETE CASCADE NOT NULL
tag             text NOT NULL
base_impact     numeric NOT NULL
delta_affection numeric default 0
delta_trust     numeric default 0
delta_comfort   numeric default 0
delta_respect   numeric default 0
delta_compatibility numeric default 0
created_at      timestamptz default now()
```

### New table: `caerhold_chat_messages`

Stores conversation history for memory/context.

```text
id              uuid PK
user_id         uuid NOT NULL
resident_id     uuid FK -> caerhold_residents ON DELETE CASCADE NOT NULL
role            text NOT NULL  -- 'user' or 'assistant'
content         text NOT NULL
emotional_state jsonb
created_at      timestamptz default now()
```

### Database function: `update_caerhold_relationship_scores`

An RPC function that atomically updates relationship dimensions and logs the event (ported from ArtistAgent's `update_relationship_scores_v2`), using Caerhold's 5 tiers.

### RLS

- `caerhold_visitor_relationships`: Users can SELECT/INSERT/UPDATE their own rows only (`user_id = auth.uid()`). Admins can SELECT all.
- `caerhold_relationship_events`: Users can SELECT their own. Admins can SELECT all. INSERT via RPC only.
- `caerhold_chat_messages`: Users can SELECT/INSERT their own. Admins can SELECT all.

---

## 2. Edge Function: `chat-with-resident`

Core chat endpoint. Adapts ArtistAgent's prompt composition + LEMO scoring into one flow.

**Input**: `{ resident_id, message, conversation_id? }`

**Flow**:
1. Auth check (must be logged in)
2. Fetch resident (tone_profile, personality, canon_rules, lore_hooks, bio)
3. Fetch or create visitor relationship
4. Fetch recent chat messages (last 20) for context
5. **Compose enhanced prompt** (adapted from `LemoPromptComposer`):
   - Base system prompt from resident's tone_profile + personality + canon_rules
   - Inject `[RELATIONSHIP_CONTEXT]` block with tier, affection, trust scores
   - Apply tone guideline hints based on current tier
6. Call Lovable AI (gemini-2.5-flash) with streaming
7. **Post-response LEMO scoring** (adapted from `lemoScoringService`):
   - Classify user message sentiment (rule-based + keyword matching)
   - Calculate dimension deltas with anti-gaming (diminishing returns)
   - Update relationship via RPC
8. Store both messages in `caerhold_chat_messages`
9. Return streamed response

**Prompt structure** (per-resident, relationship-aware):
```
You are {display_name}, a resident of the City of Caerhold.
{bio}

Voice: {tone_profile.voiceStyle}, {tone_profile.cadence}
Personality: {personality.traits}, Quirks: {personality.quirks}
{canon_rules restrictions}

[RELATIONSHIP_CONTEXT]
Tier=Neighbor, Affection=42, Trust=38, Comfort=45
Be warm and share casual stories. Open up about daily life in Caerhold.
```

---

## 3. LEMO Scoring Engine (Caerhold Edition)

Simplified version of ArtistAgent's LEMO v3, implemented server-side in the edge function.

**Sentiment classification** -- Rule-based pattern matching (ported from `lemoRuleEngine`):
- Positive tags: gratitude, praise, agreement, empathy, excitement
- Negative tags: dismissive, rude
- No romantic/flirt/love categories (not applicable to city life)

**Relationship dimension mapping** (adapted from `crossDimensionalInfluence`):
- Asking about their work → +respect, +compatibility
- Sharing personal stories → +comfort, +trust
- Complimenting their neighborhood → +affection
- Being dismissive → -comfort, -respect

**Anti-gaming** (from ArtistAgent's `antiGaming` config):
- Diminishing returns on repeated positive interactions (0.7 decay)
- Emotional inertia: rapid-fire messages have reduced impact
- Volatility threshold: flag suspicious scoring patterns

**Tier progression** -- Composite score is weighted average: `(affection*0.25 + trust*0.25 + comfort*0.2 + respect*0.15 + compatibility*0.15)`

---

## 4. Relationship Tone Mapper (Caerhold Edition)

Adapted from `relationshipToneMapper.ts`. Maps tier to prompt injection hints:

| Tier | Prompt Hint |
|------|------------|
| Stranger | "Be polite and formal. Introduce yourself. Keep responses brief." |
| Acquaintance | "Be friendly, use their name. Share surface-level city info." |
| Neighbor | "Be warm and casual. Share stories about the district. Light humor." |
| Friend | "Be open and personal. Reference past conversations. Offer genuine advice." |
| Confidant | "Be deeply familiar. Use inside references. Show vulnerability. Long, personal responses." |

---

## 5. Frontend: Chat with Residents

### New: `src/pages/caerhold/ResidentChat.tsx`

Full-page chat interface for talking to a resident.

- Hero bar: resident avatar, name, role, relationship tier badge
- Message list with markdown rendering
- Input bar with send button
- Relationship meter: small visual showing current tier + progress bar to next tier
- "First meeting" greeting message from resident's existing greeting/bio

### New: `src/components/caerhold/RelationshipMeter.tsx`

Visual component showing:
- Current tier name + icon
- Progress bar (composite_score mapped to 0-100 within tier range)
- Dimension breakdown on hover/click (affection, trust, comfort, respect, compatibility as small bars)

### Updated: `src/pages/caerhold/ResidentProfile.tsx`

- Add "Chat with {name}" button (links to `/caerhold/residents/:slug/chat`)
- Show relationship tier badge if logged in and relationship exists

### New route: `/caerhold/residents/:slug/chat` -> ResidentChat

---

## 6. Types

Add to `src/types/caerhold.ts`:

```typescript
interface CaerholdVisitorRelationship {
  id: string;
  user_id: string;
  resident_id: string;
  affection: number;
  trust: number;
  comfort: number;
  respect: number;
  compatibility: number;
  composite_score: number;
  interaction_count: number;
  last_interaction: string | null;
}

interface CaerholdChatMessage {
  id: string;
  user_id: string;
  resident_id: string;
  role: 'user' | 'assistant';
  content: string;
  emotional_state: Record<string, any> | null;
  created_at: string;
}

type CaerholdRelationshipTier = 'Stranger' | 'Acquaintance' | 'Neighbor' | 'Friend' | 'Confidant';
```

---

## 7. Data Hooks

### `src/hooks/caerhold/useCaerholdChat.ts`
- `useCaerholdChatMessages(residentId)` -- fetch message history
- `useSendMessage()` -- mutation that calls edge function, handles streaming
- `useCaerholdRelationship(residentId)` -- fetch current relationship state

---

## 8. Implementation Order

1. Database migration (3 tables + RPC function + RLS)
2. Types update
3. Edge function: `chat-with-resident` (with inline LEMO scoring + tone mapping)
4. Chat hooks
5. RelationshipMeter component
6. ResidentChat page
7. ResidentProfile "Chat" button + route
8. Config.toml update

---

## What's NOT Included (Future)

- **Aurora Memory/MemVid**: Vector-based memory search. Too complex for v1 -- we use simple message history instead.
- **Micro-expressions / emotional interjections**: The `*blushes*` style responses don't fit Caerhold's municipal tone.
- **Heat tiers / consent system**: Not applicable to wholesome city interactions.
- **Predictive analytics / forecasting**: Nice-to-have for admin dashboard later.
- **Group chat**: Multiple residents chatting together (future feature).

