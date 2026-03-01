import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Verify caerhold role using service role client
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
      return new Response(JSON.stringify({ error: "Forbidden: Caerhold admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job
    const { data: job, error: jobError } = await adminClient
      .from("caerhold_resident_profile_jobs")
      .select("*, caerhold_media(*)")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await adminClient
      .from("caerhold_resident_profile_jobs")
      .update({ status: "processing" })
      .eq("id", job_id);

    const mediaRecord = (job as any).caerhold_media;
    const imageUrl = mediaRecord.public_url;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a creative worldbuilder for the City of Caerhold, a fictional LEGO/minifigure city. You analyze minifigure portrait photos and generate rich character profiles for city residents.

DIVERSITY PRINCIPLES:
- Caerhold is a vibrant, inclusive city with residents from all walks of life
- Vary cultural backgrounds, age groups, gender identities, family structures, and ability levels across the population
- Occupations should span blue-collar, white-collar, creative, civic, academic, trade, service, and unconventional roles -- avoid defaulting to stereotypical jobs based on appearance
- Personality types should range widely: introverts and extroverts, optimists and realists, traditionalists and innovators
- Districts, affiliations, and interests should reflect diverse lifestyles -- not every resident is a shopkeeper or office worker
- When design cues are ambiguous, lean into unexpected or underrepresented character archetypes rather than defaults

STRICT CONSTRAINTS:
- Never claim the character is a real person
- Never include sexual, violent, or illegal content
- Keep everything municipal, wholesome, and city-life oriented
- Only infer traits from visible design cues in the photo (clothing, accessories, expression, colors)
- Do not assume backstory beyond what fits the minifig design cues
- All names must be fictional and original
- Names should reflect a variety of cultural origins`;

    const userPrompt = `Analyze this LEGO minifigure portrait photo and generate a complete resident profile for the City of Caerhold.

Look at the minifigure's clothing, accessories, hair, expression, and any visible items to infer their character.

Remember: Caerhold is a diverse city. Consider giving this resident a background, occupation, or perspective that adds variety to the population. Avoid defaulting to the most obvious interpretation if a more interesting, underrepresented reading is equally supported by the visual cues.

Image URL: ${imageUrl}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_resident_profile",
              description: "Create a resident profile from the analyzed minifigure image",
              parameters: {
                type: "object",
                properties: {
                  first_name: { type: "string", description: "Fictional first name" },
                  last_name: { type: "string", description: "Fictional last name" },
                  handle: { type: "string", description: "Social handle starting with @, lowercase, underscores" },
                  occupation: { type: "string", description: "Job title or role in the city" },
                  bio: { type: "string", description: "2-3 sentence character bio" },
                  tone_profile: {
                    type: "object",
                    properties: {
                      voiceStyle: { type: "string", enum: ["formal", "casual", "poetic", "dry", "warm", "chaotic", "quiet", "earnest", "sardonic", "gentle", "boisterous"] },
                      useEmoji: { type: "boolean" },
                      cadence: { type: "string", enum: ["short sentences", "flowing prose", "punchy", "measured"] },
                      personality: { type: "string", description: "Brief personality summary" },
                    },
                    required: ["voiceStyle", "useEmoji", "cadence", "personality"],
                  },
                  personality: {
                    type: "object",
                    properties: {
                      traits: { type: "array", items: { type: "string" }, description: "3-5 personality traits" },
                      quirks: { type: "array", items: { type: "string" }, description: "1-3 quirks" },
                      values: { type: "array", items: { type: "string" }, description: "2-3 values" },
                    },
                    required: ["traits", "quirks", "values"],
                  },
                  lore_hooks: {
                    type: "object",
                    properties: {
                      home_district: { type: "string", description: "Where in Caerhold they live" },
                      affiliations: { type: "array", items: { type: "string" }, description: "Groups or organizations" },
                      recurring_motifs: { type: "array", items: { type: "string" }, description: "Themes in their posts" },
                    },
                    required: ["home_district", "affiliations", "recurring_motifs"],
                  },
                  canon_rules: {
                    type: "object",
                    properties: {
                      allowed_topics: { type: "array", items: { type: "string" } },
                      forbiddenClaims: { type: "array", items: { type: "string" } },
                      grounding_rule: { type: "string" },
                    },
                    required: ["allowed_topics", "forbiddenClaims", "grounding_rule"],
                  },
                },
                required: ["first_name", "last_name", "handle", "occupation", "bio", "tone_profile", "personality", "lore_hooks", "canon_rules"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_resident_profile" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      await adminClient
        .from("caerhold_resident_profile_jobs")
        .update({ status: "failed", error_message: `AI error: ${response.status}` })
        .eq("id", job_id);

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
      await adminClient
        .from("caerhold_resident_profile_jobs")
        .update({ status: "failed", error_message: "No tool call in AI response" })
        .eq("id", job_id);
      throw new Error("AI did not return structured profile");
    }

    const profile = JSON.parse(toolCall.function.arguments);
    const slug = `${profile.first_name}-${profile.last_name}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const handle = profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`;
    const displayName = `${profile.first_name} ${profile.last_name}`;

    // Check if this job already has a resident (re-generation)
    if (job.result_resident_id) {
      // Update existing resident
      await adminClient
        .from("caerhold_residents")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          display_name: displayName,
          handle,
          slug,
          role_title: profile.occupation,
          bio: profile.bio,
          tone_profile: profile.tone_profile,
          personality: profile.personality,
          lore_hooks: profile.lore_hooks,
          canon_rules: {
            ...profile.canon_rules,
            grounding_rule: `This character was generated from media_id ${job.media_id}. Future posts must only reference tagged media or admin notes.`,
          },
        })
        .eq("id", job.result_resident_id);

      await adminClient
        .from("caerhold_resident_profile_jobs")
        .update({
          status: "complete",
          raw_model_output: profile,
          error_message: "",
        })
        .eq("id", job_id);

      return new Response(JSON.stringify({ resident_id: job.result_resident_id, profile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new draft resident
    const { data: resident, error: residentError } = await adminClient
      .from("caerhold_residents")
      .insert({
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: displayName,
        handle,
        slug,
        role_title: profile.occupation,
        bio: profile.bio,
        tone_profile: profile.tone_profile,
        personality: profile.personality,
        lore_hooks: profile.lore_hooks,
        canon_rules: {
          ...profile.canon_rules,
          grounding_rule: `This character was generated from media_id ${job.media_id}. Future posts must only reference tagged media or admin notes.`,
        },
        posting_enabled: false,
        profile_status: "draft",
        source_media_id: job.media_id,
        avatar_media_id: job.media_id,
      })
      .select("id")
      .single();

    if (residentError) {
      await adminClient
        .from("caerhold_resident_profile_jobs")
        .update({ status: "failed", error_message: residentError.message })
        .eq("id", job_id);
      throw residentError;
    }

    // Update job with result
    await adminClient
      .from("caerhold_resident_profile_jobs")
      .update({
        status: "complete",
        result_resident_id: resident.id,
        raw_model_output: profile,
        error_message: "",
      })
      .eq("id", job_id);

    return new Response(JSON.stringify({ resident_id: resident.id, profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-resident-profile error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
