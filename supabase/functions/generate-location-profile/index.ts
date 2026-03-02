import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    for (const [k, v] of Object.entries(obj)) result[k] = sanitizeStrings(v);
    return result;
  }
  return obj;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "editor", "caerhold_admin", "caerhold_editor"])
      .limit(1)
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { location_id } = await req.json();
    if (!location_id) {
      return new Response(JSON.stringify({ error: "location_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch location
    const { data: location, error: locError } = await adminClient
      .from("caerhold_locations")
      .select("*")
      .eq("id", location_id)
      .single();

    if (locError || !location) {
      return new Response(JSON.stringify({ error: "Location not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch location media images (up to 6)
    const { data: locationMedia } = await adminClient
      .from("caerhold_location_media")
      .select("*, media:caerhold_media!caerhold_location_media_media_id_fkey(public_url, type)")
      .eq("location_id", location_id)
      .order("sort_order")
      .limit(6);

    const imageUrls = (locationMedia || [])
      .filter((lm: any) => lm.media?.type?.startsWith("image"))
      .map((lm: any) => lm.media.public_url);

    if (imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "No images attached to this location. Add images first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Set status to processing
    await adminClient
      .from("caerhold_locations")
      .update({ ai_status: "processing" } as any)
      .eq("id", location_id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are generating a tourism-directory style profile for a fictional city called Caerhold.
You must infer only what is reasonably visible from the building/business image(s).
If something is unknown, keep it generic and avoid invented specifics.
Tone: calm, civic, premium — like a municipal tourism directory.
Never claim real-world facts (addresses, prices) unless visible.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze the uploaded image(s) of a Caerhold location. Generate a structured profile.

Requirements:
- category must be one of: cafe, restaurant, retail, residential, civic, park, service, landmark, entertainment, office
- short_blurb: max 140 chars
- description: 2-4 sentences
- vibe_tags: 3-6 items
- signature_items: 2-6 items (only if relevant, e.g. menu items, products)
- visitor_tips: 2-5 items
- notable_details: 2-5 items referencing visible design cues (colors, facade, signage, windows, rooftop, etc.)
- include confidence scores 0-1 for name and category

Current location name: "${location.name}"`,
      },
      ...imageUrls.map((url: string) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_location_profile",
              description: "Create a location profile from the analyzed image(s)",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Location name (inferred or confirmed)" },
                  category: { type: "string", enum: ["cafe", "restaurant", "retail", "residential", "civic", "park", "service", "landmark", "entertainment", "office"] },
                  short_blurb: { type: "string", description: "Max 140 char summary" },
                  description: { type: "string", description: "2-4 sentence description" },
                  vibe_tags: { type: "array", items: { type: "string" }, description: "3-6 vibe tags" },
                  signature_items: { type: "array", items: { type: "string" }, description: "2-6 signature items" },
                  visitor_tips: { type: "array", items: { type: "string" }, description: "2-5 visitor tips" },
                  notable_details: { type: "array", items: { type: "string" }, description: "2-5 notable design details" },
                  confidence: {
                    type: "object",
                    properties: {
                      name: { type: "number" },
                      category: { type: "number" },
                    },
                    required: ["name", "category"],
                  },
                },
                required: ["name", "category", "short_blurb", "description", "vibe_tags", "signature_items", "visitor_tips", "notable_details", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_location_profile" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      await adminClient.from("caerhold_locations").update({ ai_status: "error" } as any).eq("id", location_id);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      await adminClient.from("caerhold_locations").update({ ai_status: "error" } as any).eq("id", location_id);
      throw new Error("AI did not return structured profile");
    }

    const rawProfile = JSON.parse(toolCall.function.arguments);
    const profile = sanitizeStrings(rawProfile);
    console.log("Generated location profile:", JSON.stringify(profile));

    // Build update respecting locked fields
    const lockedFields: string[] = location.ai_locked_fields || [];
    const updateData: Record<string, any> = {
      ai_generated_json: profile,
      ai_status: "generated",
    };

    if (!lockedFields.includes("category")) updateData.category = profile.category;
    if (!lockedFields.includes("short_blurb")) updateData.short_blurb = profile.short_blurb;
    if (!lockedFields.includes("description")) updateData.description = profile.description;
    if (!lockedFields.includes("vibe_tags")) updateData.vibe_tags = profile.vibe_tags;
    if (!lockedFields.includes("signature_items")) updateData.signature_items = profile.signature_items;
    if (!lockedFields.includes("visitor_tips")) updateData.visitor_tips = profile.visitor_tips;

    // Set hero_image_url from first image if not already set
    if (!location.hero_image_url && imageUrls.length > 0) {
      updateData.hero_image_url = imageUrls[0];
    }

    await adminClient
      .from("caerhold_locations")
      .update(updateData)
      .eq("id", location_id);

    return new Response(JSON.stringify({ profile, location_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-location-profile error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
