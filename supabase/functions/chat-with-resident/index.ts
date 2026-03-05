import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================
// LEMO Sentiment Classification (Caerhold Edition)
// =====================================================
interface SentimentTag {
  tag: string;
  deltas: { affection: number; trust: number; comfort: number; respect: number; compatibility: number };
}

const SENTIMENT_RULES: { patterns: RegExp[]; result: SentimentTag }[] = [
  {
    patterns: [/thank/i, /appreciate/i, /grateful/i, /thanks/i],
    result: { tag: 'gratitude', deltas: { affection: 2, trust: 1, comfort: 1, respect: 1, compatibility: 0.5 } }
  },
  {
    patterns: [/amazing/i, /wonderful/i, /great job/i, /well done/i, /impressive/i, /talented/i],
    result: { tag: 'praise', deltas: { affection: 1.5, trust: 0.5, comfort: 0.5, respect: 2, compatibility: 1 } }
  },
  {
    patterns: [/agree/i, /exactly/i, /right/i, /true/i, /good point/i, /makes sense/i],
    result: { tag: 'agreement', deltas: { affection: 0.5, trust: 1.5, comfort: 1, respect: 0.5, compatibility: 2 } }
  },
  {
    patterns: [/sorry to hear/i, /must be hard/i, /hope you/i, /feel better/i, /care about/i],
    result: { tag: 'empathy', deltas: { affection: 2, trust: 2, comfort: 1.5, respect: 0.5, compatibility: 0.5 } }
  },
  {
    patterns: [/exciting/i, /awesome/i, /love it/i, /can't wait/i, /so cool/i, /fantastic/i],
    result: { tag: 'excitement', deltas: { affection: 1.5, trust: 0.5, comfort: 1.5, respect: 0.5, compatibility: 1.5 } }
  },
  {
    patterns: [/tell me about/i, /what do you/i, /how does/i, /curious/i, /interested in/i],
    result: { tag: 'curiosity', deltas: { affection: 0.5, trust: 1, comfort: 0.5, respect: 1.5, compatibility: 1 } }
  },
  {
    patterns: [/whatever/i, /don't care/i, /boring/i, /shut up/i, /waste of time/i],
    result: { tag: 'dismissive', deltas: { affection: -1.5, trust: -1, comfort: -2, respect: -2, compatibility: -1 } }
  },
  {
    patterns: [/stupid/i, /idiot/i, /hate/i, /ugly/i, /worst/i, /terrible/i],
    result: { tag: 'rude', deltas: { affection: -2, trust: -2, comfort: -2, respect: -2, compatibility: -1.5 } }
  },
];

function classifySentiment(message: string): SentimentTag {
  for (const rule of SENTIMENT_RULES) {
    if (rule.patterns.some(p => p.test(message))) {
      return rule.result;
    }
  }
  // Neutral default
  return { tag: 'neutral', deltas: { affection: 0.3, trust: 0.3, comfort: 0.5, respect: 0.2, compatibility: 0.2 } };
}

// =====================================================
// Anti-gaming: diminishing returns
// =====================================================
function applyDiminishing(deltas: SentimentTag['deltas'], interactionCount: number): SentimentTag['deltas'] {
  // Each interaction reduces impact by decay factor (floored at 0.2x)
  const decay = Math.max(0.2, Math.pow(0.95, Math.min(interactionCount, 50)));
  return {
    affection: deltas.affection * decay,
    trust: deltas.trust * decay,
    comfort: deltas.comfort * decay,
    respect: deltas.respect * decay,
    compatibility: deltas.compatibility * decay,
  };
}

// =====================================================
// Tone Mapper
// =====================================================
type RelationshipTier = 'Stranger' | 'Acquaintance' | 'Neighbor' | 'Friend' | 'Confidant';

function getTier(composite: number): RelationshipTier {
  if (composite >= 76) return 'Confidant';
  if (composite >= 56) return 'Friend';
  if (composite >= 36) return 'Neighbor';
  if (composite >= 16) return 'Acquaintance';
  return 'Stranger';
}

const TIER_PROMPTS: Record<RelationshipTier, string> = {
  Stranger: "Be polite and formal. Introduce yourself briefly. Keep responses concise and welcoming.",
  Acquaintance: "Be friendly and use a warm tone. Share surface-level info about life in Caerhold. Show recognition.",
  Neighbor: "Be warm and casual. Share stories about the district. Use light humor. Be comfortable.",
  Friend: "Be open and personal. Reference shared context. Offer genuine advice and opinions. Be yourself.",
  Confidant: "Be deeply familiar. Use inside references. Show vulnerability and personal depth. Long, heartfelt responses.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { resident_id, message } = await req.json();
    if (!resident_id || !message) throw new Error("resident_id and message required");

    // Fetch resident
    const { data: resident, error: resError } = await adminClient
      .from("caerhold_residents")
      .select("*")
      .eq("id", resident_id)
      .single();
    if (resError || !resident) throw new Error("Resident not found");

    // Fetch or create relationship
    let { data: relationship } = await adminClient
      .from("caerhold_visitor_relationships")
      .select("*")
      .eq("user_id", user.id)
      .eq("resident_id", resident_id)
      .maybeSingle();

    if (!relationship) {
      const { data: newRel } = await adminClient
        .from("caerhold_visitor_relationships")
        .insert({ user_id: user.id, resident_id })
        .select()
        .single();
      relationship = newRel;
    }

    const compositeScore = relationship?.composite_score || 0;
    const tier = getTier(compositeScore);
    const interactionCount = relationship?.interaction_count || 0;

    // Fetch recent messages for context
    const { data: recentMessages } = await adminClient
      .from("caerhold_chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .eq("resident_id", resident_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const chatHistory = (recentMessages || []).reverse();

    // Build system prompt
    const toneProfile = resident.tone_profile as Record<string, any> || {};
    const personality = resident.personality as Record<string, any> || {};
    const canonRules = resident.canon_rules as Record<string, any> || {};
    const loreHooks = resident.lore_hooks as Record<string, any> || {};

    const systemPrompt = `You are ${resident.display_name}, a resident of the City of Caerhold — a miniature city made entirely of LEGO bricks.
${resident.bio || ''}

Voice: ${toneProfile.voiceStyle || 'friendly'}, ${toneProfile.cadence || 'conversational'}
${toneProfile.personality ? `Personality: ${toneProfile.personality}` : ''}
${personality.traits ? `Traits: ${Array.isArray(personality.traits) ? personality.traits.join(', ') : personality.traits}` : ''}
${personality.quirks ? `Quirks: ${Array.isArray(personality.quirks) ? personality.quirks.join(', ') : personality.quirks}` : ''}
${resident.role_title ? `Role: ${resident.role_title}` : ''}

${canonRules.backstory ? `Backstory: ${canonRules.backstory}` : ''}
${canonRules.allowedTopics ? `You enjoy discussing: ${canonRules.allowedTopics.join(', ')}` : ''}
${canonRules.forbiddenClaims ? `Never claim: ${canonRules.forbiddenClaims.join('; ')}` : ''}
${canonRules.relationships ? `Known relationships: ${canonRules.relationships.join('; ')}` : ''}
${Object.entries(loreHooks).length > 0 ? `Lore details: ${Object.entries(loreHooks).map(([k, v]) => `${k}: ${v}`).join('; ')}` : ''}

[RELATIONSHIP_CONTEXT]
Tier: ${tier} | Affection: ${Math.round(relationship?.affection || 0)} | Trust: ${Math.round(relationship?.trust || 0)} | Comfort: ${Math.round(relationship?.comfort || 0)} | Respect: ${Math.round(relationship?.respect || 0)} | Compatibility: ${Math.round(relationship?.compatibility || 0)}
Interactions so far: ${interactionCount}
${TIER_PROMPTS[tier]}

${toneProfile.useEmoji ? 'Feel free to use emojis when fitting.' : 'Avoid using emojis.'}
${toneProfile.vocabulary ? `Preferred words/phrases: ${toneProfile.vocabulary.join(', ')}` : ''}

IMPORTANT RULES:
- Stay in character at all times. You ARE this resident.
- Never break the fourth wall or acknowledge being an AI.
- Keep responses under 200 words unless the tier is Friend or Confidant.
- Be wholesome and family-friendly. This is a municipal city setting.
- Reference Caerhold locations, districts, and other residents when natural.
${resident.is_child ? '- You are a child character. Speak with age-appropriate language and interests.' : ''}`;

    // Store user message
    await adminClient.from("caerhold_chat_messages").insert({
      user_id: user.id,
      resident_id,
      role: "user",
      content: message,
    });

    // Build messages array
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // Call Lovable AI with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      throw new Error("AI gateway error");
    }

    // We need to collect the full response for storage while streaming
    // Use a TransformStream to tap into the stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponse = "";

    // Process in background
    (async () => {
      try {
        const reader = aiResponse.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Forward chunk to client
          await writer.write(value);

          // Parse for storage
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch { /* partial */ }
          }
        }
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();

        // After stream completes: store assistant message + LEMO scoring
        try {
          await adminClient.from("caerhold_chat_messages").insert({
            user_id: user.id,
            resident_id,
            role: "assistant",
            content: fullResponse,
          });

          // LEMO scoring
          const sentiment = classifySentiment(message);
          const deltas = applyDiminishing(sentiment.deltas, interactionCount);

          await adminClient.rpc("update_caerhold_relationship_scores", {
            p_user_id: user.id,
            p_resident_id: resident_id,
            p_tag: sentiment.tag,
            p_base_impact: 1,
            p_delta_affection: deltas.affection,
            p_delta_trust: deltas.trust,
            p_delta_comfort: deltas.comfort,
            p_delta_respect: deltas.respect,
            p_delta_compatibility: deltas.compatibility,
          });
        } catch (e) {
          console.error("Post-stream processing error:", e);
        }
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-with-resident error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
