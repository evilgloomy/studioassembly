import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STANDARDIZE_PROMPT = `CRITICAL REQUIREMENT: The minifigure must be FLOATING against a perfectly seamless, pure #FFFFFF white void. There must be ABSOLUTELY NO baseplate, no ground plane, no stand, no pedestal, no surface, no shadow, no reflection, no shadow catcher -- nothing beneath or around the figure. The background must be a completely flat, featureless white with zero gradient, zero grey tones, and zero environmental elements.

Using the provided reference image as the sole character reference, create a full CGI 3D render of this Lego minifigure as if it were a hero shot from 'The Lego Movie'. The render must look like it was produced by Animal Logic's rendering pipeline -- subsurface scattering on the plastic skin, micro-scratches and fingerprint smudges on glossy surfaces, and bright, even studio lighting with soft key light and subtle rim highlights. Use high-key lighting so the entire figure is well-lit with no dark shadows. Maintain absolute 1:1 fidelity to every detail in the reference: exact hair mould, precise facial print, all torso and leg printing, and any accessories. Pay close attention to the leg type: if the reference shows short, stubby legs (indicating a child minifigure), the render MUST use short legs -- do NOT replace them with standard full-length adult legs. The minifigure should be in a neutral standing pose. Output a single high-resolution image.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Verify user identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Role check — must be caerhold admin/editor
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient.rpc("is_caerhold_admin_or_editor", {
      _user_id: claimsData.claims.sub,
    });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { media_id, batch_id } = await req.json();
    if (!media_id || !batch_id) {
      return new Response(
        JSON.stringify({ error: "media_id and batch_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = adminClient;

    // 1. Fetch the media record to get public_url
    const { data: media, error: mediaError } = await supabase
      .from("caerhold_media")
      .select("public_url, uploaded_by")
      .eq("id", media_id)
      .single();

    if (mediaError || !media) {
      return new Response(
        JSON.stringify({ error: "Media not found", details: mediaError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Standardizing portrait for media:", media_id);

    // 2. Call Gemini image edit via Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: STANDARDIZE_PROMPT },
              { type: "image_url", image_url: { url: media.public_url } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", status: aiResponse.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No image returned from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Decode base64 to binary
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const rawBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      rawBytes[i] = binaryString.charCodeAt(i);
    }

    // 3b. Post-process: force near-white pixels to pure white
    console.log("Post-processing: forcing near-white pixels to #FFFFFF");
    const img = await Image.decode(rawBytes);
    const THRESHOLD = 220;
    for (let x = 1; x <= img.width; x++) {
      for (let y = 1; y <= img.height; y++) {
        const pixel = img.getPixelAt(x, y);
        const r = (pixel >> 24) & 0xFF;
        const g = (pixel >> 16) & 0xFF;
        const b = (pixel >> 8) & 0xFF;
        if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
          img.setPixelAt(x, y, 0xFFFFFFFF); // pure white, full alpha
        }
      }
    }
    const bytes = await img.encode();

    // 4. Upload to storage
    const portraitFileName = `portrait_${crypto.randomUUID()}.png`;
    const storagePath = `caerhold/${batch_id}/${portraitFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, bytes, { contentType: "image/png" });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload standardized portrait", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);

    // 5. Create new media record for the standardized portrait
    const { data: newMedia, error: newMediaError } = await supabase
      .from("caerhold_media")
      .insert({
        type: "image",
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        upload_batch_id: batch_id,
        uploaded_by: media.uploaded_by,
      })
      .select("id, public_url")
      .single();

    if (newMediaError) {
      console.error("Media record error:", newMediaError);
      return new Response(
        JSON.stringify({ error: "Failed to create media record", details: newMediaError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Standardized portrait created:", newMedia.id);

    return new Response(
      JSON.stringify({ media_id: newMedia.id, public_url: newMedia.public_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("standardize-portrait error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
